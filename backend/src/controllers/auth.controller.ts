import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const signToken = (id: string) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const createSendToken = (user: any, statusCode: number, res: Response) => {
  const token = signToken(user.id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.passwordHash = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return next(new AppError('অনুগ্রহ করে ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন', 400));
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return next(new AppError('ইউজারনেম বা পাসওয়ার্ড সঠিক নয়', 401));
    }

    if (!user.isActive) {
      return next(new AppError('এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে', 401));
    }

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (user) user.passwordHash = undefined;
    
    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user || !(await bcrypt.compare(oldPassword, user.passwordHash))) {
      return next(new AppError('বর্তমান পাসওয়ার্ডটি সঠিক নয়', 401));
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false
      },
      include: { role: true }
    });

    createSendToken(updatedUser, 200, res);
  } catch (error) {
    next(error);
  }
};

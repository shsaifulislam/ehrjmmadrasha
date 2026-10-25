import { z } from 'zod';

export const createTeacherSchema = z.object({
  body: z.object({
    teacherId: z.string().min(1, 'Teacher ID is required'),
    nameBn: z.string().min(1, 'Bangla name is required'),
    phone: z.string().min(11, 'Phone number must be at least 11 digits'),
    designation: z.string().optional(),
    joinDate: z.string().optional(),
    username: z.string().min(4, 'Username must be at least 4 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
});

export const updateTeacherSchema = z.object({
  body: z.object({
    nameBn: z.string().optional(),
    phone: z.string().optional(),
    designation: z.string().optional(),
    joinDate: z.string().optional(),
  })
});

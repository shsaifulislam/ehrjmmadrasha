import { Router } from 'express';
import { login, logout, getMe, changePassword } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again later.'
});

router.post('/login', loginLimiter, login);
router.post('/logout', logout);

// Protected routes
router.use(requireAuth);
router.get('/me', getMe);
router.post('/change-password', changePassword);

export default router;

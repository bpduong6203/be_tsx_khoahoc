import express, { Request, Response } from 'express';
import { login, register } from '../services/authService';
import { formatUserForResponse } from '../services/userService';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email, password } = req.body;
      const { token, user } = await login(email, password);

      return res.json({
        user: formatUserForResponse(user),
        token,
        message: 'User logged in successfully',
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(error.message.includes('Thông tin đăng nhập') ? 401 : 500).json({
        error: error.message || 'Server error',
      });
    }
  }
);

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { name, email, password } = req.body;
      const { token, user } = await register({ name, email, password });

      return res.status(201).json({
        user: formatUserForResponse(user),
        token,
        message: 'User registered successfully',
      });
    } catch (error: any) {
      console.error('Register error:', error);
      return res.status(error.message.includes('Email đã được sử dụng') ? 400 : 500).json({
        error: error.message || 'Server error',
      });
    }
  }
);

export default router;
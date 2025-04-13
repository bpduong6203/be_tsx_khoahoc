import express, { Request, Response } from 'express';
import { login, register } from '../services/authService';
import { formatUserForResponse } from '../services/userService';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { getGoogleAuthUrl, handleGoogleCallback } from '../services/googleAuthService';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth';

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

router.get('/auth/google', async (req: Request, res: Response) => {
  try {
    const allowedProviders = ['google'];
    const provider = 'google';
    if (!allowedProviders.includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const url = await getGoogleAuthUrl();
    res.json({ url }); // Trả URL giống Laravel Socialite
  } catch (error) {
    res.status(500).json({ error: `Failed to generate Google auth URL: ${(error as Error).message}` });
  }
});

router.get('/auth/google/callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    const user = await handleGoogleCallback(code);
    if (!user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'your_secret',
      { expiresIn: '1h' }
    );

    const redirectUrl = `${process.env.FRONTEND_URL}/callback?token=${token}`;
    res.redirect(redirectUrl);
  } catch (error) {
    res.status(500).json({ error: `Login failed: ${(error as Error).message}` });
  }
});

router.post('/logout', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

router.get('/login/failed', (req: Request, res: Response) => {
  res.status(401).json({ error: 'Login failed' });
});

export default router;
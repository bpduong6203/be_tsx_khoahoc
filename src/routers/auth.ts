import express, { Request, Response } from 'express';
import { login } from '../utils/auth';
import { createUser, getUserByEmail } from '../models/user';
import bcrypt from 'bcrypt';

const router = express.Router();

interface LoginRequestBody {
  email: string;
  password: string;
}

interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
}

router.post('/login', async (req: Request<{}, any, LoginRequestBody>, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const { token, user } = await login(email, password);
    return res.json({
      message: 'User logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/register', async (req: Request<{}, any, RegisterRequestBody>, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Kiểm tra input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash mật khẩu
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Tạo user mới (tự động gán role "user")
    const newUser = await createUser({
      name,
      email,
      password: hashedPassword,
    });

    // Tự động đăng nhập
    const { token } = await login(email, password);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roles: newUser.roles,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
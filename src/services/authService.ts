import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserByEmail, createUser } from '../models/user';
import { User } from '../types';

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  if (!email || !password) {
    throw new Error('Email và mật khẩu là bắt buộc');
  }

  const user = await getUserByEmail(email);
  if (!user || !user.password) {
    throw new Error('Thông tin đăng nhập không hợp lệ');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Thông tin đăng nhập không hợp lệ');
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });

  return { token, user };
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ token: string; user: User }> {
  const { name, email, password } = data;

  if (!name.trim()) {
    throw new Error('Tên không được để trống');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Email không hợp lệ');
  }
  if (password.length < 6) {
    throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('Email đã được sử dụng');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = await createUser({ name, email, password: hashedPassword });

  const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });

  return { token, user: newUser };
}
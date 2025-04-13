import { Request, Response, NextFunction } from 'express';
import pool from '../database/db';
import { verifyToken } from '../utils/auth';

// Middleware: Kiểm tra đăng nhập
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const payload = verifyToken(token);
    (req as any).user = payload; 
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Middleware: Kiểm tra quyền admin
export const isAdminOrOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const [rows] = await pool.query(
      'SELECT r.name FROM roles r JOIN role_user ru ON r.id = ru.role_id WHERE ru.user_id = ? AND r.name = ?',
      [userId, 'admin']
    );
    const isAdmin = (rows as any[]).length > 0;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Error checking admin access' });
  }
};


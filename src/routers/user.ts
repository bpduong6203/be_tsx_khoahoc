import express, { Request, Response } from 'express';
import {
  getAllUsersService,
  getUserDetails,
  updateUserDetails,
  formatUserForResponse,
} from '../services/userService';
import { isAuthenticated, isAdminOrOwner } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.get('/users', isAuthenticated, isAdminOrOwner, async (req: Request, res: Response) => {
  try {
    const users = await getAllUsersService();
    return res.json({
      data: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      })),
      message: 'Users retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

router.get('/user', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await getUserDetails(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const roles = Array.isArray(user.roles)
    ? user.roles.map((role: any) => role.name || 'user')
    : ['user'];
  const userResponse = {
    id: user.id || '',
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar || '',
    roles,
  };
  res.json(userResponse);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

router.put(
  '/user',
  isAuthenticated,
  [
    body('name').optional().trim().notEmpty().withMessage('Tên không được để trống'),
    body('email').optional().isEmail().withMessage('Email không hợp lệ'),
    body('password').optional().isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('avatar')
      .optional()
      .isString()
      .matches(/^\/cdn\/images\//)
      .withMessage('URL ảnh không hợp lệ, phải bắt đầu bằng /cdn/images/'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const userId = (req as any).user.id;
      const { name, email, password, avatar } = req.body;

      const updatedUser = await updateUserDetails(userId, { name, email, password, avatar });
      if (!updatedUser) {
        return res.status(400).json({ error: 'Không có thay đổi để cập nhật' });
      }

      return res.json({
        user: formatUserForResponse(updatedUser),
        message: 'Cập nhật người dùng thành công',
      });
    } catch (error: any) {
      console.error('Lỗi khi cập nhật người dùng:', error);
      return res.status(error.message.includes('not found') ? 404 : 400).json({
        error: error.message || 'Lỗi server',
      });
    }
  }
);

export default router;
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
    return res.json({
      user: formatUserForResponse(user),
      message: 'User retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

router.put(
  '/user',
  isAuthenticated,
  [
    body('name').optional().trim().notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const userId = (req as any).user.id;
      const { name, email, password } = req.body;

      const updatedUser = await updateUserDetails(userId, { name, email, password });
      if (!updatedUser) {
        return res.status(400).json({ error: 'No changes to update' });
      }

      return res.json({
        user: formatUserForResponse(updatedUser),
        message: 'User updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      return res.status(error.message.includes('not found') ? 404 : 400).json({
        error: error.message || 'Server error',
      });
    }
  }
);

export default router;
import express, { Request, Response } from 'express';
import { getAllCategories, createCategory, updateCategory, getCategoryById } from '../models/category';
import { verifyToken } from '../utils/auth';
import { getAllCategoriesWithCourses } from '../models/categories';
import pool from '../database/db';

const router = express.Router();

// Middleware kiểm tra quyền admin
const isAdmin = async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const payload = verifyToken(token);
    const [rows] = await pool.query(
      'SELECT r.name FROM roles r JOIN role_user ru ON r.id = ru.role_id WHERE ru.user_id = ? AND r.name = ?',
      [payload.id, 'admin']
    );
    if ((rows as any[]).length === 0) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    (req as any).user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// GET: Lấy tất cả danh mục
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategories();
    return res.json({
      data: categories,
      message: 'Categories retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST: Tạo danh mục mới (admin only)
router.post('/categories', isAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, parent_id } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const created_by = (req as any).user.id;
    const category = await createCategory({ name, description, parent_id, created_by });
    return res.status(201).json({
      data: category,
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT: Cập nhật danh mục (admin only)
router.put('/categories/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id, status } = req.body;
    const existingCategory = await getCategoryById(id);
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const updatedCategory = await updateCategory(id, { name, description, parent_id, status });
    if (!updatedCategory) {
      return res.status(400).json({ error: 'No changes provided' });
    }
    return res.json({
      data: updatedCategory,
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/categories-course', async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategoriesWithCourses();
    return res.json({
      data: categories,
      message: 'All categories with courses retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
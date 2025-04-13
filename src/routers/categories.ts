import { getAllCategoriesWithCourses } from '../services/categoryService';
import { Router, Request, Response } from 'express';
import { getAllCategories, getCategoryDetails, createNewCategory, updateCategoryDetails } from '../services/categoryService';
import { isAuthenticated, isAdminOrOwner } from '../middleware/auth';

const router = Router();

router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategories();
    return res.json({ data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/categories/:id', async (req: Request, res: Response) => {
  try {
    const category = await getCategoryDetails(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    return res.json({ data: category });
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/categories', isAuthenticated, isAdminOrOwner, async (req: Request, res: Response) => {
  try {
    const { name, description, parent_id } = req.body;
    const created_by = (req as any).user.id; // Lấy từ token
    const category = await createNewCategory({ name, description, parent_id, created_by });
    return res.status(201).json({ data: category });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return res.status(400).json({ error: error.message || 'Failed to create category' });
  }
});

router.put('/categories/:id', isAuthenticated, isAdminOrOwner, async (req: Request, res: Response) => {
  try {
    const { name, description, parent_id, status } = req.body;
    const category = await updateCategoryDetails(req.params.id, { name, description, parent_id, status });
    if (!category) {
      return res.status(404).json({ error: 'Category not found or no changes made' });
    }
    return res.json({ data: category });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(400).json({ error: 'Failed to update category' });
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
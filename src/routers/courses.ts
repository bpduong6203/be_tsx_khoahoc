// src/routers/courses.ts
import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllCourses,
  getCourseDetails,
  formatCourseForResponse,
} from '../services/courseService';
import { isAuthenticated } from '../middleware/auth';
import pool from '../database/db';

const router = express.Router();

// GET: Lấy danh sách khóa học
router.get('/courses', async (req: Request, res: Response) => {
  try {
    const courses = await getAllCourses();
    return res.json({
      data: courses.map(course => formatCourseForResponse(course)),
      message: 'Courses retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET: Lấy khóa học theo ID
router.get('/courses/:id', async (req: Request, res: Response) => {
  try {
    const course = await getCourseDetails(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    return res.json({
      data: formatCourseForResponse(course),
      message: 'Course retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST: Tạo khóa học
router.post('/courses', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { title, description, category_id, price, thumbnail_url } = req.body;
    const user_id = (req as any).user.id;

    const id = uuidv4();
    await pool.query(
      `INSERT INTO courses 
        (id, title, description, category_id, user_id, price, thumbnail_url, status, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Published', NOW(), NOW())`,
      [id, title, description, category_id, user_id, price, thumbnail_url]
    );

    return res.status(201).json({
      message: 'Course created successfully',
      data: { id, title, thumbnail_url },
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT: Cập nhật khóa học
router.put('/courses/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { title, description, category_id, price, status, thumbnail_url } = req.body;
    const { id } = req.params;
    const user_id = (req as any).user.id;

    const updates: any = { title, description, category_id, user_id, price, status, thumbnail_url };
    updates.updated_at = new Date();

    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    await pool.query(`UPDATE courses SET ${fields} WHERE id = ?`, [...values, id]);

    return res.json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE: Xóa mềm khóa học
router.delete('/courses/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE courses SET status = 'Deleted', updated_at = NOW() WHERE id = ?`, [id]);
    return res.json({ message: 'Course deleted (soft) successfully' });
  } catch (error) {
    console.error('Error soft-deleting course:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;

import express, { Request, Response } from 'express';
import {
  getLessonsByCourseId,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  isCourseOwner,
} from '../models/lesson';
import { verifyToken } from '../utils/auth';
import pool from '../database/db';

const router = express.Router();

// Middleware kiểm tra quyền admin hoặc owner
const isAdminOrOwner = async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const payload = verifyToken(token);
    const isAdmin = await checkAdminRole(payload.id);
    if (isAdmin) {
      (req as any).user = payload;
      return next();
    }

    const course_id = req.body.course_id || (await getLessonById(req.params.id))?.course_id;
    if (!course_id) {
      return res.status(400).json({ error: 'Course ID required' });
    }

    const isOwner = await isCourseOwner(course_id, payload.id);
    if (!isOwner) {
      return res.status(403).json({ error: 'Admin or course owner access required' });
    }

    (req as any).user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Hàm phụ kiểm tra quyền admin
async function checkAdminRole(user_id: string): Promise<boolean> {
  const [rows] = await pool.query(
    'SELECT r.name FROM roles r JOIN role_user ru ON r.id = ru.role_id WHERE ru.user_id = ? AND r.name = ?',
    [user_id, 'admin']
  );
  return (rows as any[]).length > 0;
}

// GET: Lấy tất cả bài học theo course_id
router.get('/', async (req: Request, res: Response) => {
  try {
    const { course_id } = req.query;
    if (!course_id || typeof course_id !== 'string') {
      return res.status(400).json({ error: 'course_id is required' });
    }
    const lessons = await getLessonsByCourseId(course_id);
    return res.json({
      data: lessons,
      message: 'Lessons retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET: Lấy chi tiết bài học theo id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lesson = await getLessonById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    return res.json({
      data: lesson,
      message: 'Lesson retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST: Tạo bài học mới
router.post('/', isAdminOrOwner, async (req: Request, res: Response) => {
  try {
    const { course_id, title, description, video_url, duration, order_number } = req.body;
    if (!course_id || !title || order_number === undefined) {
      return res.status(400).json({ error: 'course_id, title, and order_number are required' });
    }
    const lesson = await createLesson({
      course_id,
      title,
      description,
      video_url,
      duration,
      order_number,
    });
    return res.status(201).json({
      data: lesson,
      message: 'Lesson created successfully',
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT: Cập nhật bài học
router.put('/:id', isAdminOrOwner, async (req: Request, res: Response) => {
  try {
    const { title, description, video_url, duration, order_number, status } = req.body;
    const lesson = await updateLesson(req.params.id, {
      title,
      description,
      video_url,
      duration,
      order_number,
      status,
    });
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found or no changes provided' });
    }
    return res.json({
      data: lesson,
      message: 'Lesson updated successfully',
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE: Xóa bài học
router.delete('/:id', isAdminOrOwner, async (req: Request, res: Response) => {
  try {
    const lesson = await getLessonById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    await deleteLesson(req.params.id);
    return res.json({
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
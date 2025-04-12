import express, { Request, Response } from 'express';
import {
  getLessonsByCourseId,
  getAllLessons, // Thêm hàm mới
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

// GET: Lấy tất cả bài học hoặc theo course_id
router.get('/lessons', async (req: Request, res: Response) => {
  try {
    const { course_id } = req.query;
    let lessons;

    if (course_id && typeof course_id === 'string') {
      lessons = await getLessonsByCourseId(course_id);
    } else {
      lessons = await getAllLessons(); // Lấy tất cả bài học
    }

    return res.json({
      lessons: lessons.map(lesson => ({
        id: lesson.id,
        course_id: lesson.course_id,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        video_url: lesson.video_url,
        duration: lesson.duration,
        order_number: lesson.order_number,
        status: lesson.status,
        created_at: lesson.created_at.toISOString().replace('Z', '.000000Z'),
        updated_at: lesson.updated_at.toISOString().replace('Z', '.000000Z'),
      })),
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET: Lấy chi tiết bài học theo id
router.get('/lessons/:id', async (req: Request, res: Response) => {
  try {
    const lesson = await getLessonById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    return res.json({
      lesson: {
        id: lesson.id,
        course_id: lesson.course_id,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        video_url: lesson.video_url,
        duration: lesson.duration,
        order_number: lesson.order_number,
        status: lesson.status,
        created_at: lesson.created_at.toISOString().replace('Z', '.000000Z'),
        updated_at: lesson.updated_at.toISOString().replace('Z', '.000000Z'),
      },
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST: Tạo bài học mới
router.post('/lessons', isAdminOrOwner, async (req: Request, res: Response) => {
  try {
    const { course_id, title, description, content, video_url, duration, order_number } = req.body;
    if (!course_id || !title || order_number === undefined) {
      return res.status(400).json({ error: 'course_id, title, and order_number are required' });
    }
    const lesson = await createLesson({
      course_id,
      title,
      description,
      content,
      video_url,
      duration,
      order_number,
    });
    return res.status(201).json({
      lesson: {
        id: lesson.id,
        course_id: lesson.course_id,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        video_url: lesson.video_url,
        duration: lesson.duration,
        order_number: lesson.order_number,
        status: lesson.status,
        created_at: lesson.created_at.toISOString().replace('Z', '.000000Z'),
        updated_at: lesson.updated_at.toISOString().replace('Z', '.000000Z'),
      },
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT: Cập nhật bài học
router.put('/lessons/:id', isAdminOrOwner, async (req: Request, res: Response) => {
  try {
    const { title, description, content, video_url, duration, order_number, status } = req.body;
    const lesson = await updateLesson(req.params.id, {
      title,
      description,
      content,
      video_url,
      duration,
      order_number,
      status,
    });
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found or no changes provided' });
    }
    return res.json({
      lesson: {
        id: lesson.id,
        course_id: lesson.course_id,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        video_url: lesson.video_url,
        duration: lesson.duration,
        order_number: lesson.order_number,
        status: lesson.status,
        created_at: lesson.created_at.toISOString().replace('Z', '.000000Z'),
        updated_at: lesson.updated_at.toISOString().replace('Z', '.000000Z'),
      },
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE: Xóa bài học
router.delete('/lessons/:id', isAdminOrOwner, async (req: Request, res: Response) => {
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
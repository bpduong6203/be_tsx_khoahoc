import express, { Request, Response } from 'express';
import {
  getAllLessonsService,
  getLessonsByCourseIdService,
  getLessonDetails,
  createNewLesson,
  updateLessonDetails,
  deleteLessonService,
  formatLessonForResponse,
} from '../services/lessonService';
import { isAdminOrOwner, isAuthenticated } from '../middleware/auth';

const router = express.Router();

// GET: Lấy tất cả bài học hoặc theo course_id
router.get('/lessons', async (req: Request, res: Response) => {
  try {
    const { course_id } = req.query;
    let lessons;

    if (course_id && typeof course_id === 'string') {
      lessons = await getLessonsByCourseIdService(course_id);
    } else {
      lessons = await getAllLessonsService();
    }

    return res.json({
      lessons: lessons.map(lesson => formatLessonForResponse(lesson)),
      message: 'Lessons retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error fetching lessons:', error);
    return res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message || 'Server error' });
  }
});

// GET: Lấy chi tiết bài học theo id
router.get('/lessons/:id', async (req: Request, res: Response) => {
  try {
    const lesson = await getLessonDetails(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    return res.json({
      data: formatLessonForResponse(lesson),
      message: 'Lesson retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST: Tạo bài học mới
router.post('/lessons', isAuthenticated, isAdminOrOwner, async (req: Request, res: Response) => {
  try {
    const { course_id, title, description, content, video_url, duration, order_number } = req.body;
    const lesson = await createNewLesson({
      course_id,
      title,
      description,
      content,
      video_url,
      duration,
      order_number,
    });
    return res.status(201).json({
      data: formatLessonForResponse(lesson),
      message: 'Lesson created successfully',
    });
  } catch (error: any) {
    console.error('Error creating lesson:', error);
    return res.status(error.message.includes('required') || error.message.includes('not found') ? 400 : 500).json({
      error: error.message || 'Server error',
    });
  }
});

// PUT: Cập nhật bài học
router.put('/lessons/:id', isAuthenticated, isAdminOrOwner, async (req: Request, res: Response) => {
  try {
    const { title, description, content, video_url, duration, order_number, status } = req.body;
    const lesson = await updateLessonDetails(req.params.id, {
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
      data: formatLessonForResponse(lesson),
      message: 'Lesson updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating lesson:', error);
    return res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message || 'Server error' });
  }
});

// DELETE: Xóa bài học
router.delete('/lessons/:id', isAuthenticated, isAdminOrOwner, async (req: Request, res: Response) => {
  try {
    await deleteLessonService(req.params.id);
    return res.json({
      message: 'Lesson deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting lesson:', error);
    return res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message || 'Server error' });
  }
});

export default router;
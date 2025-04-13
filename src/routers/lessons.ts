// src/routers/lessons.ts
import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator'; // Import thêm query
import {
  getAllLessonsService,
  getLessonsByCourseIdService,
  getLessonDetails,
  createNewLesson,
  updateLessonDetails,
  deleteLessonService,
  formatLessonForResponse,
} from '../services/lessonService';
import { AuthenticatedRequest, isAdminOrOwner, isAuthenticated } from '../middleware/auth'; // Import AuthenticatedRequest

const router = express.Router();

// GET: Lấy tất cả bài học (có thể filter theo course_id, status) - Không cần Auth
router.get(
    '/lessons',
    [ // Optional query validation
        query('course_id').optional().isUUID().withMessage('Invalid course ID format'),
        query('status').optional().isIn(['Published', 'Draft']).withMessage('Invalid status value')
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { course_id, status } = req.query as { course_id?: string; status?: 'Published' | 'Draft' };
            let lessons;
            // Service sẽ xử lý logic lấy theo course_id hoặc status
            lessons = await getAllLessonsService({ course_id, status });

            return res.json({
            // Format lại response nếu cần
            data: lessons.map(lesson => formatLessonForResponse(lesson)),
            message: 'Lessons retrieved successfully',
            });
        } catch (error: any) {
            console.error('Error fetching lessons:', error);
             if (error.message === 'Course not found') { // Lỗi từ service khi check course_id
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Server error fetching lessons' });
        }
});

// GET: Lấy chi tiết bài học theo id - Không cần Auth
router.get(
    '/lessons/:id',
    [param('id').isUUID().withMessage('Invalid lesson ID format')], // Validate ID
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const lesson = await getLessonDetails(req.params.id);
            // Service đã throw error nếu không tìm thấy
            return res.json({
                data: formatLessonForResponse(lesson),
                message: 'Lesson retrieved successfully',
            });
        } catch (error: any) {
            console.error('Error fetching lesson:', error);
            if (error.message === 'Lesson not found') {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Server error fetching lesson' });
        }
});

// POST: Tạo bài học mới - Cần Auth và quyền Admin
router.post(
    '/lessons',
    isAuthenticated,
    isAdminOrOwner,
    [ // === VALIDATION === (Dựa theo PHP Controller, điều chỉnh required nếu cần)
        body('course_id').isUUID().withMessage('Valid Course ID is required'),
        body('title').trim().notEmpty().withMessage('Title is required').isString().isLength({ max: 255 }),
        // PHP validation yêu cầu description, content là string required
        body('description').optional({ nullable: true }).isString().withMessage('Description must be a string'), // Để optional nếu service xử lý được null/undefined
        body('content').optional({ nullable: true }).isString().withMessage('Content must be a string'),       // Tương tự
        body('video_url').optional({ nullable: true }).isURL().withMessage('Invalid video URL format'),
        // PHP validation yêu cầu duration, order_number là integer required
        body('duration').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Duration must be a non-negative integer'), // Để optional nếu service xử lý được null/undefined
        body('order_number').notEmpty().isInt({ min: 0 }).withMessage('Order number must be a non-negative integer'),
        body('status').optional().isIn(['Published', 'Draft']).withMessage('Status must be Published or Draft'),
    ],
    async (req: AuthenticatedRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
             // Lấy data từ body sau khi validate
            const { course_id, title, description, content, video_url, duration, order_number, status } = req.body;
            const lessonData = { course_id, title, description, content, video_url, duration: duration ? parseInt(duration) : undefined, order_number: parseInt(order_number), status };

            const newLesson = await createNewLesson(lessonData);

            return res.status(201).json({
                data: formatLessonForResponse(newLesson),
                message: 'Lesson created successfully',
            });
        } catch (error: any) {
            console.error('Error creating lesson:', error);
            // Trả về lỗi cụ thể từ service
            if (error.message === 'Course not found' || error.message.includes('Order number')) {
                 return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Failed to create lesson' });
        }
    }
);

// PUT: Cập nhật bài học - Cần Auth và quyền Admin
router.put(
    '/lessons/:id',
    isAuthenticated,
    isAdminOrOwner,
    [ // === VALIDATION ===
        param('id').isUUID().withMessage('Invalid lesson ID format'),
        body('title').optional().trim().notEmpty().withMessage('Title cannot be empty if provided').isString().isLength({ max: 255 }),
        body('description').optional({ nullable: true }).isString(),
        body('content').optional({ nullable: true }).isString(),
        body('video_url').optional({ nullable: true }).isURL().withMessage('Invalid video URL format'),
        body('duration').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Duration must be a non-negative integer'),
        body('order_number').optional().isInt({ min: 0 }).withMessage('Order number must be a non-negative integer'),
        body('status').optional().isIn(['Published', 'Draft']).withMessage('Status must be Published or Draft'),
        // Không validate course_id vì không cho phép cập nhật qua service hiện tại
    ],
    async (req: AuthenticatedRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // Lấy các trường có thể cập nhật từ body
             const { title, description, content, video_url, duration, order_number, status } = req.body;
             const updates = { title, description, content, video_url, duration: duration ? parseInt(duration) : undefined, order_number: order_number ? parseInt(order_number): undefined, status };

            const updatedLesson = await updateLessonDetails(req.params.id, updates);
            // Service đã throw error nếu không tìm thấy

            return res.json({
                data: formatLessonForResponse(updatedLesson),
                message: 'Lesson updated successfully',
            });
        } catch (error: any) {
            console.error('Error updating lesson:', error);
             // Trả về lỗi cụ thể từ service
            if (error.message === 'Lesson not found') {
                 return res.status(404).json({ error: error.message });
            }
             if (error.message.includes('Order number')) {
                 return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Failed to update lesson' });
        }
    }
);

// DELETE: Xóa bài học - Cần Auth và quyền Admin
router.delete(
    '/lessons/:id',
    isAuthenticated,
    isAdminOrOwner,
    [ // Validate ID
        param('id').isUUID().withMessage('Invalid lesson ID format')
    ],
    async (req: AuthenticatedRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            await deleteLessonService(req.params.id);
            // Service đã throw error nếu không tìm thấy
            return res.status(200).json({ message: 'Lesson deleted successfully' });
            // Hoặc return res.status(204).send();
        } catch (error: any) {
            console.error('Error deleting lesson:', error);
            // Trả về lỗi cụ thể từ service
            if (error.message === 'Lesson not found') {
                 return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Failed to delete lesson' });
        }
    }
);

export default router;
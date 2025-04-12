import express from 'express';
import { getCourses, getCourseById, getCoursesByCategory } from '../models/course';
import { enrollCourse, formatEnrollmentForResponse } from '../models/enrollment';
import { verifyToken } from '../utils/auth';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

// Middleware xác thực user
const isAuthenticated = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// GET: Lấy danh sách khóa học
router.get('/courses', async (req: express.Request, res: express.Response) => {
  try {
    const courses = await getCourses();
    return res.json({
      data: courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        category_id: course.category_id,
        user_id: course.user_id,
        price: Number(course.price).toFixed(2),
        discount_price: course.discount_price ? Number(course.discount_price).toFixed(2) : null,
        thumbnail_url: course.thumbnail_url,
        duration: course.duration,
        level: course.level,
        requirements: course.requirements,
        objectives: course.objectives,
        status: course.status,
        rating: Number(course.rating).toFixed(2),
        enrollment_count: course.enrollment_count,
        created_at: course.created_at.toISOString().replace('Z', '.000000Z'),
        category: null, 
        user: null,    
        lessons: null  
      })),
      message: 'Courses retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/courses/:id', async (req: express.Request, res: express.Response) => {
  try {
    const course = await getCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    return res.json({
      data: course,
      message: 'Course retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/category/:categoryId', async (req: express.Request, res: express.Response) => {
  try {
    const courses = await getCoursesByCategory(req.params.categoryId);
    return res.json(courses);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST: Đăng ký khóa học
router.post(
  '/courses/:courseId/enroll',
  [
    param('courseId').isUUID().withMessage('Invalid course ID'),
    body('payment_method')
      .optional()
      .isIn(['Momo', 'Bank', 'Paypal', 'Cash'])
      .withMessage('Invalid payment method'),
  ],
  isAuthenticated,
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { courseId } = req.params;
      const userId = (req as any).user.id;
      const { payment_method } = req.body;

      const enrollment = await enrollCourse(courseId, userId, payment_method || null);

      return res.status(201).json({
        data: await formatEnrollmentForResponse(enrollment), 
        message:
          enrollment.payment_status === 'Completed'
            ? 'Đăng ký khóa học thành công'
            : 'Đăng ký khóa học thành công, vui lòng thanh toán để kích hoạt',
      });
    } catch (error: any) {
      console.error('Error enrolling course:', error);
      const code = error.cause || 400;
      return res.status(code).json({ message: error.message });
    }
  }
);

export default router;


import express from 'express';
import {
  enrollCourseService,
  formatEnrollmentForResponse,
  getEnrollmentsByUser,
  cancelEnrollment,
} from '../services/enrollmentService';
import { isAuthenticated } from '../middleware/auth';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

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

      const enrollment = await enrollCourseService(courseId, userId, payment_method || null);

      return res.status(201).json({
        data: await formatEnrollmentForResponse(enrollment),
        message:
          enrollment.payment_status === 'Completed'
            ? 'Đăng ký khóa học thành công'
            : 'Đăng ký khóa học thành công, vui lòng thanh toán để kích hoạt',
      });
    } catch (error: any) {
      console.error('Error enrolling course:', error);
      return res.status(error.cause || 400).json({ error: error.message || 'Server error' });
    }
  }
);

router.get(
  '/enrollments',
  isAuthenticated,
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = (req as any).user.id;
      const enrollments = await getEnrollmentsByUser(userId);

      const formattedEnrollments = await Promise.all(
        enrollments.map((enrollment) => formatEnrollmentForResponse(enrollment))
      );

      return res.status(200).json({
        data: formattedEnrollments,
        message: 'Danh sách khóa học đã đăng ký',
      });
    } catch (error: any) {
      console.error('Error fetching enrollments:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
  '/enrollments/:id/cancel',
  [param('id').isUUID().withMessage('Invalid enrollment ID')],
  isAuthenticated,
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userId = (req as any).user.id;

      const enrollment = await cancelEnrollment(id, userId);

      return res.status(200).json({
        data: await formatEnrollmentForResponse(enrollment),
        message: 'Đã hủy đăng ký khóa học',
      });
    } catch (error: any) {
      console.error('Error cancelling enrollment:', error);
      if (error.message === 'Không tìm thấy thông tin đăng ký') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(error.cause || 400).json({ message: error.message || 'Server error' });
    }
  }
);

export default router;
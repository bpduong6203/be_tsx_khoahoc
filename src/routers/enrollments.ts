// src/routers/enrollments.ts
import express from 'express';
import { body, param, query, validationResult } from 'express-validator'; // Thêm query
import {
  enrollCourseService,
  getUserEnrollmentsService,      // Service mới
  getEnrollmentDetailsService,    // Service mới
  cancelEnrollmentService,        // Service mới
  updateEnrollmentPaymentStatusService // Service mới
} from '../services/enrollmentService';
import { AuthenticatedRequest, isAdminOrOwner, isAuthenticated } from '../middleware/auth';
import { Enrollment } from '../types'; // Import type để dùng cho validation

const router = express.Router();

// === Route cũ: Đăng ký khóa học ===
router.post(
  '/courses/:courseId/enroll',
  isAuthenticated, // Yêu cầu đăng nhập
  [
    param('courseId').isUUID().withMessage('Invalid course ID format'),
    body('payment_method')
      .optional({ nullable: true }) // Cho phép null hoặc không gửi
      .isIn(['Momo', 'Bank', 'Paypal', 'Cash']) // Các phương thức hợp lệ
      .withMessage('Invalid payment method'),
  ],
  async (req: AuthenticatedRequest, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { courseId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
          // Middleware isAuthenticated đáng lẽ đã chặn nếu không có user
          return res.status(401).json({ error: 'User not authenticated properly' });
      }
      // Lấy payment_method từ body, đảm bảo đúng kiểu
      const payment_method = req.body.payment_method as Enrollment['payment_method'] | undefined;

      const enrollment = await enrollCourseService(courseId, userId, payment_method || null);

      return res.status(201).json({
        data: enrollment, // Service trả về đã enrich
        message:
          enrollment.payment_status === 'Completed'
            ? 'Đăng ký khóa học thành công'
            : 'Đăng ký khóa học thành công, vui lòng thanh toán để kích hoạt',
      });
    } catch (error: any) {
      console.error('Error enrolling course:', error);
      // Trả về status code và message từ service nếu có (vd: 404, 400)
      return res.status(error.cause || 400).json({ error: error.message || 'Lỗi khi đăng ký khóa học' });
    }
  }
);

// === Route mới: Lấy danh sách enrollments của user ===
router.get(
    '/enrollments',
    isAuthenticated, // Cần đăng nhập để biết lấy của user nào
    [ // Optional validation cho query param 'status'
        query('status').optional().isIn(['Pending', 'Active', 'Expired', 'Cancelled'])
            .withMessage('Invalid status filter value')
    ],
    async (req: AuthenticatedRequest, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated properly' });
            }
            // Lấy status từ query một cách an toàn
            const status = req.query.status as Enrollment['status'] | undefined;

            const enrollments = await getUserEnrollmentsService(userId, status);
            return res.json({
                data: enrollments, // Service trả về đã enrich
                message: 'Lấy danh sách đăng ký thành công'
            });
        } catch(error: any) {
             console.error('Error fetching user enrollments:', error);
             return res.status(500).json({ error: 'Lỗi khi lấy danh sách đăng ký' });
        }
    }
);

// === Route mới: Lấy chi tiết enrollment ===
router.get(
    '/enrollments/:id',
    isAuthenticated, // Cần đăng nhập để kiểm tra ownership
    [
         param('id').isUUID().withMessage('Invalid enrollment ID format')
    ],
    async (req: AuthenticatedRequest, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated properly' });
            }
            const enrollmentId = req.params.id;

            const enrollment = await getEnrollmentDetailsService(enrollmentId, userId);
            // Service sẽ throw lỗi 404 nếu không tìm thấy hoặc không đúng user

            return res.json({
                data: enrollment, // Service trả về đã enrich
                message: 'Lấy chi tiết đăng ký thành công'
            });
        } catch(error: any) {
             console.error('Error fetching enrollment details:', error);
             if (error.cause === 404) { // Bắt lỗi 404 từ service
                 return res.status(404).json({ error: error.message });
             }
             return res.status(500).json({ error: 'Lỗi khi lấy chi tiết đăng ký' });
        }
    }
);

// === Route mới: Hủy enrollment ===
router.post( // Dùng POST cho hành động thay đổi trạng thái
    '/enrollments/:id/cancel',
    isAuthenticated, // Cần đăng nhập để biết ai hủy
     [
         param('id').isUUID().withMessage('Invalid enrollment ID format')
     ],
    async (req: AuthenticatedRequest, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        try {
             const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated properly' });
            }
            const enrollmentId = req.params.id;

            const cancelledEnrollment = await cancelEnrollmentService(enrollmentId, userId);
             // Service sẽ throw lỗi 404 hoặc 400 nếu không hợp lệ

            return res.json({
                data: cancelledEnrollment, // Service trả về đã enrich
                message: 'Hủy đăng ký thành công'
            });

        } catch (error: any) {
             console.error('Error cancelling enrollment:', error);
             if (error.cause === 404) { // Bắt lỗi 404 từ service
                 return res.status(404).json({ error: error.message });
             }
             if (error.cause === 400) { // Bắt lỗi 400 (nghiệp vụ) từ service
                 return res.status(400).json({ error: error.message });
             }
             return res.status(500).json({ error: 'Lỗi khi hủy đăng ký' });
        }
    }
);


// === Route mới: Cập nhật trạng thái thanh toán (Admin/Webhook) ===
router.put( // Dùng PUT để cập nhật trạng thái
    '/enrollments/:id/payment',
    isAuthenticated, // Yêu cầu xác thực (có thể là admin hoặc webhook token)
    isAdminOrOwner,   // Chỉ admin mới được gọi trực tiếp API này? Cần xem xét lại quyền
    // TODO: Thêm logic kiểm tra Webhook Secret nếu cần cho phép webhook gọi
    [
         param('id').isUUID().withMessage('Invalid enrollment ID format'),
         body('status').isIn(['Pending', 'Completed', 'Failed', 'Refunded']).withMessage('Invalid payment status value'),
         body('transaction_id').optional({nullable: true}).isString().trim()
    ],
     async (req: AuthenticatedRequest, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        // --- Logic kiểm tra Webhook Secret (Ví dụ) ---
        // const webhookSecret = req.headers['x-webhook-secret'];
        // const isAdmin = req.user?.roles?.some(role => role.name === 'admin'); // Kiểm tra role admin từ user object
        // if (!isAdmin && webhookSecret !== process.env.PAYMENT_WEBHOOK_SECRET) {
        //      return res.status(403).json({ error: 'Forbidden: Invalid credentials' });
        // }
        // --- Kết thúc kiểm tra webhook ---

         try {
            const enrollmentId = req.params.id;
            const paymentStatus = req.body.status as Enrollment['payment_status'];
            const transaction_id = req.body.transaction_id; // optional

            const updatedEnrollment = await updateEnrollmentPaymentStatusService(enrollmentId, paymentStatus, transaction_id);
             // Service sẽ throw lỗi 404 nếu không tìm thấy enrollment

             return res.json({
                data: updatedEnrollment, // Service trả về đã enrich
                message: 'Cập nhật trạng thái thanh toán thành công'
            });

         } catch (error: any) {
              console.error('Error updating payment status:', error);
             if (error.cause === 404) { // Bắt lỗi 404 từ service
                 return res.status(404).json({ error: error.message });
             }
             return res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái thanh toán' });
         }
     }
);


export default router;
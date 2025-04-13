// src/routers/courses.ts
import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  getAllCourses, // Tên service đã đổi lại? Cần kiểm tra lại tên service
  getCourseDetails,
  createNewCourse,     // Service mới
  updateCourseDetails, // Service mới
  deleteCourseService, // Service mới
  getUserCoursesService, // Service mới
  formatCourseForResponse, // Giữ lại format nếu cần
} from '../services/courseService';
import { AuthenticatedRequest, isAdminOrOwner, isAuthenticated } from '../middleware/auth';

const router = express.Router();

// GET: Lấy danh sách khóa học (có filter/sort/pagination - cần implement chi tiết)
router.get(
    '/courses',
    [ // Validation cho query params (ví dụ)
        query('category_id').optional().isUUID(),
        query('status').optional().isIn(['Draft', 'Published', 'Archived']),
        query('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'All Levels']),
        query('min_price').optional().isFloat({ min: 0 }),
        query('max_price').optional().isFloat({ min: 0 }),
        query('search').optional().isString(),
        query('sort_by').optional().isString(), // Cần kiểm tra giá trị hợp lệ ở service/model
        query('sort_direction').optional().isIn(['ASC', 'DESC']),
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('perPage').optional().isInt({ min: 1, max: 100 }).toInt(), // Giới hạn perPage
    ],
    async (req: express.Request, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
             // Lấy filters và pagination từ query
            const filters = req.query;
            const page = (req.query.page as any) || 1;
            const perPage = (req.query.perPage as any) || 10; // Default perPage

            // Gọi service (cần điều chỉnh service để nhận pagination)
            const result = await getAllCourses(filters, { page, perPage }); // Giả sử service trả về { courses, total }

            return res.json({
                // data: result.courses.map(course => formatCourseForResponse(course)), // Format nếu cần
                data: result.courses, // Trả về data đã format từ service
                // Thêm thông tin pagination vào response
                // pagination: {
                //     total: result.total,
                //     perPage: perPage,
                //     currentPage: page,
                //     lastPage: Math.ceil(result.total / perPage)
                // },
                message: 'Courses retrieved successfully',
            });
        } catch (error: any) {
            console.error('Error fetching courses:', error);
            return res.status(500).json({ error: 'Server error fetching courses' });
        }
});

// GET: Lấy khóa học theo ID - Không cần Auth
router.get(
    '/courses/:id',
    [param('id').isUUID().withMessage('Invalid course ID format')],
    async (req: express.Request, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const course = await getCourseDetails(req.params.id);
            return res.json({
                // data: formatCourseForResponse(course), // Format nếu cần
                data: course, // Service đã format
                message: 'Course retrieved successfully',
            });
        } catch (error: any) {
            console.error('Error fetching course:', error);
             if (error.message === 'Course not found') {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Server error fetching course' });
        }
});

// === ADD POST ROUTE ===
// POST: Tạo khóa học mới - Cần Auth (và quyền Admin?)
router.post(
    '/courses',
    isAuthenticated, // Chỉ cần đăng nhập? Hay cần cả Admin? => Dùng isAdminOrOwner nếu cần admin
    isAdminOrOwner,  // Giả sử cần admin
    [ // === VALIDATION === (Dựa theo PHP)
        body('title').trim().notEmpty().withMessage('Title is required').isString().isLength({ max: 255 }),
        body('description').optional({ nullable: true }).isString(),
        body('category_id').optional({ nullable: true }).isUUID().withMessage('Invalid category ID format'),
        body('price').notEmpty().withMessage('Price is required').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
        body('discount_price').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Discount price must be a non-negative number'),
        // Bỏ qua 'thumbnail' vì không xử lý file upload
        body('duration').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
        body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).withMessage('Invalid level value'),
        body('requirements').optional({ nullable: true }).isString(),
        body('objectives').optional({ nullable: true }).isString(),
        body('status').optional().isIn(['Draft', 'Published', 'Archived']).withMessage('Invalid status value'), // Thêm Archived nếu type hỗ trợ
    ],
    async (req: AuthenticatedRequest, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const courseData = req.body;
            const userId = req.user?.id; // Lấy ID user từ token
            if (!userId) {
                 return res.status(401).json({ error: 'User ID not found after authentication' });
            }

            const newCourse = await createNewCourse(courseData, userId);

            return res.status(201).json({
                // data: formatCourseForResponse(newCourse), // Format nếu cần
                data: newCourse, // Service đã format
                message: 'Course created successfully',
            });
        } catch (error: any) {
            console.error('Error creating course:', error);
             // Trả về lỗi cụ thể từ service
            if (error.message === 'Category not found' || error.message.includes('Discount price must be less')) {
                 return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Failed to create course' });
        }
    }
);

// === ADD PUT ROUTE ===
// PUT: Cập nhật khóa học - Cần Auth và quyền Admin
router.put(
    '/courses/:id',
    isAuthenticated,
    isAdminOrOwner,
    [ // === VALIDATION ===
        param('id').isUUID().withMessage('Invalid course ID format'),
        body('title').optional().trim().notEmpty().withMessage('Title cannot be empty if provided').isString().isLength({ max: 255 }),
        body('description').optional({ nullable: true }).isString(),
        body('category_id').optional({ nullable: true }).isUUID().withMessage('Invalid category ID format'),
        body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
        body('discount_price').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Discount price must be a non-negative number'),
        // Bỏ qua 'thumbnail'
        body('duration').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
        body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).withMessage('Invalid level value'),
        body('requirements').optional({ nullable: true }).isString(),
        body('objectives').optional({ nullable: true }).isString(),
        body('status').optional().isIn(['Draft', 'Published', 'Archived']).withMessage('Invalid status value'),
    ],
     async (req: AuthenticatedRequest, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const updates = req.body;
            const updatedCourse = await updateCourseDetails(req.params.id, updates);

            return res.json({
                // data: formatCourseForResponse(updatedCourse), // Format nếu cần
                data: updatedCourse, // Service đã format
                message: 'Course updated successfully',
            });
        } catch (error: any) {
            console.error('Error updating course:', error);
             // Trả về lỗi cụ thể từ service
            if (error.message === 'Course not found') {
                 return res.status(404).json({ error: error.message });
            }
             if (error.message === 'Category not found' || error.message.includes('Discount price must be less')) {
                 return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Failed to update course' });
        }
    }
);

// === ADD DELETE ROUTE ===
// DELETE: Xóa khóa học - Cần Auth và quyền Admin
router.delete(
    '/courses/:id',
    isAuthenticated,
    isAdminOrOwner,
    [param('id').isUUID().withMessage('Invalid course ID format')],
    async (req: AuthenticatedRequest, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            await deleteCourseService(req.params.id);
            return res.status(200).json({ message: 'Course deleted successfully' });
             // Hoặc return res.status(204).send();
        } catch (error: any) {
             console.error('Error deleting course:', error);
             if (error.message === 'Course not found') {
                 return res.status(404).json({ error: error.message });
            }
             // Thêm check lỗi nghiệp vụ nếu có (vd: không xóa khóa học đã có người đăng ký?)
            return res.status(500).json({ error: 'Failed to delete course' });
        }
    }
);

// === ADD MY COURSES ROUTE ===
// GET: Lấy các khóa học của tôi - Cần Auth
router.get(
    '/my-courses', // Hoặc một path khác phù hợp hơn, vd /users/me/courses
    isAuthenticated,
    async (req: AuthenticatedRequest, res: express.Response) => {
         try {
            const userId = req.user?.id;
            if (!userId) {
                 return res.status(401).json({ error: 'User ID not found after authentication' });
            }
            const courses = await getUserCoursesService(userId);
             return res.json({
                // data: courses.map(course => formatCourseForResponse(course)), // Format nếu cần
                data: courses, // Service đã format
                message: 'Your courses retrieved successfully',
            });
        } catch (error: any) {
             console.error('Error fetching user courses:', error);
            return res.status(500).json({ error: 'Server error fetching user courses' });
        }
    }
);


export default router;
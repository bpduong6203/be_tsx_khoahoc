// src/routers/categories.ts
import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator'; // Import các hàm validation
import {
  getAllCategories,
  getCategoryDetails,
  createNewCategory,
  updateCategoryDetails,
  deleteCategoryService, // Import service delete
  getAllCategoriesWithCourses,
} from '../services/categoryService';
import { isAuthenticated, isAdminOrOwner } from '../middleware/auth';
import { AuthenticatedRequest } from '../middleware/auth'; // Import kiểu request đã xác thực

const router = Router();

// GET: Lấy danh sách categories (Active) - Không cần Auth
router.get('/categories', async (req: Request, res: Response) => {
  try {
    // Tùy chọn: Thêm filter theo query params nếu muốn (như status, parent_id trong PHP)
    // const { status, parent_id } = req.query;
    const categories = await getAllCategories();
    return res.json({ data: categories, message: 'Categories retrieved successfully' });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Server error fetching categories' });
  }
});

// GET: Lấy category theo ID - Không cần Auth
router.get(
    '/categories/:id',
    [param('id').isUUID().withMessage('Invalid category ID format')], // Validate ID là UUID
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        try {
            const category = await getCategoryDetails(req.params.id);
            // Service đã throw error nếu không tìm thấy, nên không cần check null ở đây nữa
            return res.json({ data: category, message: 'Category retrieved successfully' });
        } catch (error: any) {
            console.error('Error fetching category:', error);
            if (error.message === 'Category not found') {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Server error fetching category' });
        }
});

// POST: Tạo category mới - Cần Auth và quyền Admin
router.post(
    '/categories',
    isAuthenticated,
    isAdminOrOwner,
    [ // === VALIDATION ===
        body('name').trim().notEmpty().withMessage('Category name is required').isString().isLength({ max: 255 }),
        body('description').optional({ nullable: true }).isString(),
        body('parent_id').optional({ nullable: true }).isUUID().withMessage('Invalid parent ID format'),
        // Không cần validate exists(categories,id) ở đây, service/model sẽ xử lý
        body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive')
    ],
    async (req: AuthenticatedRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { name, description, parent_id, status } = req.body;
            // Lấy created_by từ user đã xác thực gắn vào request bởi middleware
            const created_by = req.user?.id;
            if (!created_by) {
                 // Trường hợp middleware chạy đúng thì luôn có user.id, nhưng check cho chắc
                 return res.status(401).json({ error: 'User ID not found after authentication' });
            }

            const categoryData = { name, description, parent_id, status, created_by };
            const category = await createNewCategory(categoryData);

            return res.status(201).json({
                data: category,
                message: 'Category created successfully'
            });
        } catch (error: any) {
            console.error('Error creating category:', error);
             // Trả về lỗi cụ thể nếu có từ service
            if (error.message.includes('Category name already exists') || error.message.includes('Parent category with id')) {
                 return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Failed to create category' });
        }
    }
);

// PUT: Cập nhật category - Cần Auth và quyền Admin
router.put(
    '/categories/:id',
    isAuthenticated,
    isAdminOrOwner,
    [ // === VALIDATION ===
        param('id').isUUID().withMessage('Invalid category ID format'),
        body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty if provided').isString().isLength({ max: 255 }),
        body('description').optional({ nullable: true }).isString(),
        body('parent_id').optional({ nullable: true }).isUUID().withMessage('Invalid parent ID format'),
        body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive')
    ],
    async (req: AuthenticatedRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { name, description, parent_id, status } = req.body;
            const updates = { name, description, parent_id, status };

            const category = await updateCategoryDetails(req.params.id, updates);
            // Service sẽ throw error nếu không tìm thấy hoặc có lỗi khác
            return res.json({
                data: category,
                message: 'Category updated successfully'
            });
        } catch (error: any) {
            console.error('Error updating category:', error);
             // Trả về lỗi cụ thể nếu có từ service
            if (error.message === 'Category not found') {
                 return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('Parent category with id') || error.message.includes('cannot be its own parent')) {
                 return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Failed to update category' });
        }
    }
);

// === ADD DELETE ROUTE ===
// DELETE: Xóa category - Cần Auth và quyền Admin
router.delete(
    '/categories/:id',
    isAuthenticated,
    isAdminOrOwner,
    [ // Validate ID
        param('id').isUUID().withMessage('Invalid category ID format')
    ],
    async (req: AuthenticatedRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            await deleteCategoryService(req.params.id);
            // Service sẽ throw error nếu không tìm thấy hoặc có lỗi nghiệp vụ
            // Trả về 200 OK hoặc 204 No Content đều được
            return res.status(200).json({ message: 'Category deleted successfully' });
            // return res.status(204).send(); // Không gửi body
        } catch (error: any) {
            console.error('Error deleting category:', error);
            // Trả về lỗi cụ thể nếu có từ service
            if (error.message === 'Category not found') {
                 return res.status(404).json({ error: error.message });
            }
             if (error.message.includes('Cannot delete category')) { // Lỗi nghiệp vụ
                 return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Failed to delete category' });
        }
    }
);


// GET: Lấy categories kèm courses - Không cần Auth
router.get('/categories-course', async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategoriesWithCourses();
    return res.json({
      data: categories,
      message: 'All categories with courses retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching categories with courses:', error);
    return res.status(500).json({ error: 'Server error fetching categories with courses' });
  }
});

export default router;
// src/services/categoryService.ts
import { getCourses  } from '../models/course';
import { Category } from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
  getCategories,
  getCategoryById,
  createCategory as createCategoryModel, // Đổi tên để tránh trùng
  updateCategory as updateCategoryModel, // Đổi tên
  deleteCategory as deleteCategoryModel, // Đổi tên
} from '../models/category'; // Import các hàm mới/đã đổi tên

export async function getAllCategories(): Promise<Category[]> {
  // Giữ nguyên, lấy các category 'Active'
  return getCategories('Active');
}

export async function getCategoryDetails(id: string): Promise<Category | null> {
  const category = await getCategoryById(id);
  if (!category) {
      // Service có thể chọn throw Error hoặc trả về null tùy logic mong muốn ở router
      throw new Error('Category not found');
  }
  return category;
}

// Hàm tạo mới Category, kiểm tra logic nghiệp vụ nếu cần
export async function createNewCategory(categoryData: {
  name: string;
  description?: string | null;
  parent_id?: string | null;
  created_by: string; // Lấy từ user đã xác thực
  status?: 'Active' | 'Inactive'; // Thêm status tùy chọn
}): Promise<Category> {
  const id = uuidv4();
  if (!categoryData.name || !categoryData.name.trim()) {
      throw new Error('Category name is required');
  }
    
  // Tùy chọn: Kiểm tra tên category đã tồn tại chưa
  // const existing = await findCategoryByName(categoryData.name);
  // if (existing) throw new Error('Category name already exists');

  try {
      const newCategory = await createCategoryModel({
          id,
          name: categoryData.name.trim(),
          description: categoryData.description,
          parent_id: categoryData.parent_id,
          created_by: categoryData.created_by,
          status: categoryData.status || 'Active', // Mặc định là Active
      });
      return newCategory;
  } catch (error: any) {
      // Xử lý lỗi cụ thể từ model (vd: parent_id không tồn tại)
      if (error.message.includes('Parent category with id')) {
           throw new Error(error.message); // Re-throw lỗi rõ ràng hơn
      }
      console.error("Error in createNewCategory service:", error);
      throw new Error('Failed to create category'); // Lỗi chung
  }
}

// Hàm cập nhật Category
export async function updateCategoryDetails(
  id: string,
  updates: {
    name?: string;
    description?: string | null;
    parent_id?: string | null;
    status?: 'Active' | 'Inactive';
  }
): Promise<Category> { // Luôn trả về Category nếu thành công, throw error nếu thất bại
  const dataToUpdate: { [key: string]: any } = {};
  if (updates.name !== undefined) {
      if (!updates.name.trim()) throw new Error('Category name cannot be empty');
      dataToUpdate.name = updates.name.trim();
  }
  if (updates.description !== undefined) dataToUpdate.description = updates.description;
  if (updates.parent_id !== undefined) {
      if (updates.parent_id === id) throw new Error('Category cannot be its own parent');
      dataToUpdate.parent_id = updates.parent_id; // Model sẽ kiểm tra tồn tại
  }
  if (updates.status !== undefined) dataToUpdate.status = updates.status;

  if (Object.keys(dataToUpdate).length === 0) {
      // Không có gì để cập nhật, trả về category hiện tại
      const currentCategory = await getCategoryById(id);
      if (!currentCategory) throw new Error('Category not found');
      return currentCategory;
      // Hoặc throw lỗi "No changes provided" nếu muốn
  }
  
  // Tùy chọn: Kiểm tra tên mới có trùng với category khác không
  // if (dataToUpdate.name) {
  //    const existing = await findCategoryByName(dataToUpdate.name);
  //    if (existing && existing.id !== id) throw new Error('Category name already exists');
  // }

  try {
      const updatedCategory = await updateCategoryModel(id, dataToUpdate);
      if (!updatedCategory) {
          // Nếu model trả về null nghĩa là id không tồn tại
          throw new Error('Category not found');
      }
      return updatedCategory;
  } catch (error: any) {
       // Xử lý lỗi cụ thể từ model (vd: parent_id không tồn tại)
      if (error.message.includes('Parent category with id')) {
           throw new Error(error.message); // Re-throw lỗi rõ ràng hơn
      }
      console.error(`Error updating category ${id}:`, error);
      throw new Error('Failed to update category'); // Lỗi chung
  }
}

// === BỔ SUNG HÀM DELETE SERVICE ===
export async function deleteCategoryService(id: string): Promise<void> {
   try {
       const deleted = await deleteCategoryModel(id);
       if (!deleted) {
           // Nếu model trả về false nghĩa là id không tồn tại để xóa
           throw new Error('Category not found');
       }
       // Xóa thành công, không cần trả về gì
   } catch (error: any) {
       // Xử lý lỗi nghiệp vụ (vd: không cho xóa category có course/sub-category)
       if (error.message.includes('Cannot delete category')) {
           throw new Error(error.message);
       }
       console.error(`Error deleting category ${id}:`, error);
       throw new Error('Failed to delete category'); // Lỗi chung
   }
}


// Hàm lấy category kèm course, có thể giữ nguyên hoặc điều chỉnh logic join/map từ model nếu cần
export async function getAllCategoriesWithCourses(): Promise<Category[]> {
  const categories = await getCategories('Active'); // Lấy category active

  for (const category of categories) {
      // Lấy các course 'Published' cho mỗi category
      const courses = await getCourses({ category_id: category.id, status: 'Published' }); // Truyền vào 1 object filters
      // Gán vào thuộc tính courses (đảm bảo Category type có định nghĩa optional courses: Course[])
      (category as any).courses = courses;
  }

  // Tùy chọn: SắpAC xếp theo số lượng khóa học giảm dần như trong PHP code
  // categories.sort((a, b) => (b.courses?.length || 0) - (a.courses?.length || 0));

  return categories;
}

// (Helper function nếu cần kiểm tra tên tồn tại)
// async function findCategoryByName(name: string): Promise<Category | null> {
//    const [rows] = await pool.query('SELECT * FROM categories WHERE name = ?', [name]);
//    return (rows as Category[])[0] || null;
// }
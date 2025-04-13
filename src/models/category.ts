// src/models/category.ts
import pool from '../database/db';
import { Category } from '../types'; // Đảm bảo bạn đã định nghĩa Category trong types

// Hàm này để kiểm tra xem category có tồn tại không, dùng nội bộ
async function checkCategoryExists(id: string): Promise<boolean> {
  const [rows] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
  return (rows as any[]).length > 0;
}

export async function getCategories(status: 'Active' | 'Inactive' | 'All' = 'Active'): Promise<Category[]> {
  let query = 'SELECT id, name, description, parent_id, status FROM categories';
  const params: string[] = [];

  if (status !== 'All') {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  const [rows] = await pool.query(query, params);
  // Giả sử Category type không cần trả về created_by, updated_by,...
  return (rows as any[]).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      parent_id: row.parent_id,
      status: row.status,
      // created_at: new Date(row.created_at), // Bỏ đi nếu type không yêu cầu
      // updated_at: new Date(row.updated_at), // Bỏ đi nếu type không yêu cầu
  })) as Category[];
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const [rows] = await pool.query(
    'SELECT id, name, description, parent_id, status FROM categories WHERE id = ?',
    [id]
  );
  const row = (rows as any[])[0];
  if (!row) return null; // Trả về null nếu không tìm thấy
    
  return {
      id: row.id,
      name: row.name,
      description: row.description,
      parent_id: row.parent_id,
      status: row.status,
  } as Category;
}

// Giữ nguyên hàm createCategory đã có vì nó khá tương đồng
export async function createCategory(category: {
  id: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
  created_by: string; // user_id người tạo
  status: 'Active' | 'Inactive';
}): Promise<Category> { // Trả về Category đã tạo
  const { id, name, description, parent_id, created_by, status } = category;
  
  // Kiểm tra parent_id có tồn tại không nếu được cung cấp
  if (parent_id && !(await checkCategoryExists(parent_id))) {
      throw new Error(`Parent category with id ${parent_id} not found`);
  }

  await pool.query(
    'INSERT INTO categories (id, name, description, parent_id, created_by, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [id, name, description || null, parent_id || null, created_by, status]
  );

  // Lấy lại category vừa tạo để trả về (không bao gồm created_by)
  const newCategory = await getCategoryById(id);
  if (!newCategory) {
      // Trường hợp hiếm gặp nhưng vẫn nên xử lý
      throw new Error('Failed to retrieve newly created category');
  }
  return newCategory;
}

// Giữ nguyên hàm updateCategory đã có vì nó khá tương đồng
export async function updateCategory(
  id: string,
  updates: {
    name?: string;
    description?: string | null;
    parent_id?: string | null; // Cho phép cập nhật parent_id
    status?: 'Active' | 'Inactive';
    // updated_at không cần truyền vào từ service, sẽ tự set trong query
  }
): Promise<Category | null> {
   // Kiểm tra xem category cần update có tồn tại không
   const exists = await checkCategoryExists(id);
   if (!exists) {
       return null; // Trả về null nếu không tìm thấy để service xử lý
   }

   // Kiểm tra parent_id mới có tồn tại không nếu được cung cấp
   if (updates.parent_id && !(await checkCategoryExists(updates.parent_id))) {
       throw new Error(`Parent category with id ${updates.parent_id} not found`);
   }
    
   // Xây dựng câu query động
   const updateFields = { ...updates, updated_at: new Date() }; // Thêm updated_at
   const fields = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
   const values = Object.values(updateFields);

   if (values.length === 1) { // Chỉ có updated_at, không có gì khác để update
       return getCategoryById(id); // Trả về category hiện tại
   }

   await pool.query(`UPDATE categories SET ${fields} WHERE id = ?`, [...values, id]);

   return await getCategoryById(id); // Trả về category sau khi cập nhật
}

// === BỔ SUNG HÀM DELETE ===
export async function deleteCategory(id: string): Promise<boolean> {
  // Tùy chọn: Kiểm tra xem có khóa học nào thuộc category này không trước khi xóa
  // const [courses] = await pool.query('SELECT id FROM courses WHERE category_id = ?', [id]);
  // if ((courses as any[]).length > 0) {
  //   throw new Error('Cannot delete category with existing courses.');
  // }
  
  // Tùy chọn: Kiểm tra xem có category con nào không trước khi xóa
  // const [children] = await pool.query('SELECT id FROM categories WHERE parent_id = ?', [id]);
  // if ((children as any[]).length > 0) {
  //    throw new Error('Cannot delete category with existing sub-categories.');
  // }

  const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  // Kiểm tra xem có hàng nào bị ảnh hưởng (xóa thành công) không
  return (result as any).affectedRows > 0;
}
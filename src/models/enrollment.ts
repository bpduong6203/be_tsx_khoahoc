import pool from '../database/db';
import { Enrollment } from '../types';

export async function createEnrollment(enrollment: Enrollment): Promise<Enrollment> {
  const {
    id,
    user_id,
    course_id,
    expiry_date,
    payment_status,
    payment_method,
    transaction_id,
    price,
    status,
    completion_date,
    created_at,
    updated_at,
  } = enrollment;

  await pool.query(
    `INSERT INTO enrollments (
      id, user_id, course_id, expiry_date, payment_status, payment_method, 
      transaction_id, price, status, completion_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      user_id,
      course_id,
      expiry_date,
      payment_status,
      payment_method,
      transaction_id,
      price,
      status,
      completion_date,
      created_at,
      updated_at,
    ]
  );

  const createdEnrollment = await getEnrollmentById(id);
  if (!createdEnrollment) {
    throw new Error('Không thể tạo bản ghi đăng ký');
  }
  return createdEnrollment;
}

export async function getEnrollmentById(id: string): Promise<Enrollment | null> {
  const [rows] = await pool.query(
    `SELECT id, user_id, course_id, expiry_date, payment_status, payment_method, 
            transaction_id, price, status, completion_date, created_at, updated_at 
     FROM enrollments WHERE id = ?`,
    [id]
  );
  const row = (rows as any[])[0];
  if (!row) return null;
  return {
    ...row,
    price: Number(row.price),
    expiry_date: row.expiry_date ? new Date(row.expiry_date) : null,
    completion_date: row.completion_date ? new Date(row.completion_date) : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  } as Enrollment;
}

export async function getCourseForEnrollment(course_id: string): Promise<{
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  user_id: string;
  price: number;
  discount_price: number | null;
  thumbnail_url: string | null;
  duration: number | null;
  level: string | null;
  requirements: string | null;
  objectives: string | null;
  status: string;
  rating: number;
  enrollment_count: number;
  created_at: Date;
  updated_at: Date;
} | null> {
  const [rows] = await pool.query(
    `SELECT id, title, description, category_id, user_id, price, discount_price, 
            thumbnail_url, duration, level, requirements, objectives, status, 
            rating, enrollment_count, created_at, updated_at 
     FROM courses WHERE id = ?`,
    [course_id]
  );
  const row = (rows as any[])[0];
  if (!row) return null;
  return {
    ...row,
    price: Number(row.price),
    discount_price: row.discount_price ? Number(row.discount_price) : null,
    rating: Number(row.rating),
    enrollment_count: Number(row.enrollment_count),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

export async function checkExistingEnrollment(user_id: string, course_id: string): Promise<boolean> {
  const [rows] = await pool.query(
    `SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?`,
    [user_id, course_id]
  );
  return (rows as any[]).length > 0;
}

// === BỔ SUNG HÀM LẤY ENROLLMENTS CỦA USER ===
export async function getUserEnrollments(userId: string, status?: string): Promise<Enrollment[]> {
  let sql = `SELECT id, user_id, course_id, expiry_date, payment_status, payment_method,
                    transaction_id, price, status, completion_date, created_at, updated_at
             FROM enrollments WHERE user_id = ?`;
  const params: string[] = [userId];

  if (status) {
      sql += ' AND status = ?';
      params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  const [rows] = await pool.query(sql, params);
  return (rows as any[]).map(row => ({
      ...row,
      price: Number(row.price),
      expiry_date: row.expiry_date ? new Date(row.expiry_date) : null,
      completion_date: row.completion_date ? new Date(row.completion_date) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
  })) as Enrollment[];
}

// === BỔ SUNG HÀM LẤY CHI TIẾT ENROLLMENT THEO ID VÀ USER ===
// Trả về null nếu không tìm thấy hoặc không thuộc user
export async function getEnrollmentByIdAndUser(id: string, userId: string): Promise<Enrollment | null> {
   const [rows] = await pool.query(
      `SELECT id, user_id, course_id, expiry_date, payment_status, payment_method,
              transaction_id, price, status, completion_date, created_at, updated_at
       FROM enrollments WHERE id = ? AND user_id = ?`,
      [id, userId]
  );
  const row = (rows as any[])[0];
  if (!row) return null;
  return {
      ...row,
      price: Number(row.price),
      expiry_date: row.expiry_date ? new Date(row.expiry_date) : null,
      completion_date: row.completion_date ? new Date(row.completion_date) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
  } as Enrollment;
}


// === BỔ SUNG HÀM CẬP NHẬT TRẠNG THÁI ENROLLMENT ===
export async function updateEnrollmentStatus(
  id: string,
  updates: { // <-- SỬA LẠI TYPE CHO THAM SỐ NÀY
      status?: 'Pending' | 'Active' | 'Expired' | 'Cancelled';
      payment_status?: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
      transaction_id?: string | null;
      completion_date?: Date | null;
      price?: number; // <-- THÊM price vào đây (optional)
      payment_method?: Enrollment['payment_method']; // <-- THÊM payment_method (optional), dùng kiểu từ Enrollment type
  }
): Promise<boolean> {
   const updateFields = { ...updates, updated_at: new Date() };
   // Sửa lại logic filter để bao gồm cả price và payment_method nếu chúng có trong updates
   const fieldsToUpdate = Object.keys(updateFields)
                               .filter(key => key === 'updated_at' || updates[key as keyof typeof updates] !== undefined);

   if (fieldsToUpdate.length === 1 && fieldsToUpdate[0] === 'updated_at') {
       return true; // Không có gì thay đổi thực sự
   }

   // Xử lý transaction_id và payment_method là null nếu cần
    if ('transaction_id' in updates) {
       updateFields.transaction_id = updates.transaction_id || null;
   }
   if ('payment_method' in updates) {
       updateFields.payment_method = updates.payment_method || null;
   }
   // Lọc lại values cho đúng sau khi cập nhật updateFields
    const setClause = fieldsToUpdate.map(key => `${key} = ?`).join(', ');
    const values = fieldsToUpdate.map(key => updateFields[key as keyof typeof updateFields]);


   const [result] = await pool.query(`UPDATE enrollments SET ${setClause} WHERE id = ?`, [...values, id]);
   return (result as any).affectedRows > 0;
}

// === BỔ SUNG HÀM KIỂM TRA ENROLLMENT TỒN TẠI VÀ TRẠNG THÁI (CHO SERVICE DÙNG) ===
export async function findEnrollmentForUpdate(id: string): Promise<Enrollment | null> {
   // Lấy các trường cần thiết cho việc kiểm tra và cập nhật
   const [rows] = await pool.query(
      `SELECT id, user_id, course_id, payment_status, status FROM enrollments WHERE id = ?`,
      [id]
  );
   return (rows as any[])[0] || null; // Trả về bản ghi thô hoặc null
}


// (Hàm getExistingEnrollment có thể cần sửa để trả về cả enrollment nếu tìm thấy)
export async function getExistingEnrollment(user_id: string, course_id: string): Promise<Enrollment | null> {
const [rows] = await pool.query(
  `SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?`, // Lấy tất cả các trường
  [user_id, course_id]
);
 const row = (rows as any[])[0];
  if (!row) return null;
  return { // Map lại cho đúng kiểu trả về
      ...row,
      price: Number(row.price),
      expiry_date: row.expiry_date ? new Date(row.expiry_date) : null,
      completion_date: row.completion_date ? new Date(row.completion_date) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
  } as Enrollment;
}
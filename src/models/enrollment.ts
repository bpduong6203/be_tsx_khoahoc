import pool from '../database/db';
import { v4 as uuidv4 } from 'uuid';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  expiry_date: Date | null;
  payment_status: 'Pending' | 'Completed' | 'Failed';
  payment_method: 'Momo' | 'Bank' | 'Paypal' | 'Cash' | null;
  transaction_id: string | null;
  price: number;
  status: 'Pending' | 'Active' | 'Expired';
  completion_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function enrollCourse(
  course_id: string,
  user_id: string,
  payment_method: 'Momo' | 'Bank' | 'Paypal' | 'Cash' | null
): Promise<Enrollment> {
  // Kiểm tra khóa học tồn tại và lấy price
  const [courseRows] = await pool.query(
    'SELECT id, price, discount_price FROM courses WHERE id = ?',
    [course_id]
  );
  const course = (courseRows as { id: string; price: number; discount_price: number | null }[])[0];
  if (!course) {
    throw new Error('Khóa học không tồn tại');
  }

  // Kiểm tra xem user đã đăng ký khóa học chưa
  const [existingRows] = await pool.query(
    'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
    [user_id, course_id]
  );
  if ((existingRows as any[]).length > 0) {
    throw new Error('Bạn đã đăng ký khóa học này rồi');
  }

  const id = uuidv4();
  const price = course.discount_price || course.price; // Ưu tiên discount_price nếu có
  
  // Tính expiry_date (ví dụ: 1 năm từ hiện tại)
  const expiry_date = new Date();
  expiry_date.setFullYear(expiry_date.getFullYear() + 1);

  const enrollment: Enrollment = {
    id,
    user_id,
    course_id,
    expiry_date,
    payment_status: 'Pending',
    payment_method,
    transaction_id: null,
    price,
    status: 'Pending',
    completion_date: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  await pool.query(
    `INSERT INTO enrollments (
      id, user_id, course_id, expiry_date, payment_status, payment_method, 
      transaction_id, price, status, completion_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      user_id,
      course_id,
      enrollment.expiry_date,
      enrollment.payment_status,
      enrollment.payment_method,
      enrollment.transaction_id,
      enrollment.price,
      enrollment.status,
      enrollment.completion_date,
      enrollment.created_at,
      enrollment.updated_at,
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
    'SELECT id, user_id, course_id, expiry_date, payment_status, payment_method, transaction_id, price, status, completion_date, created_at, updated_at FROM enrollments WHERE id = ?',
    [id]
  );
  return (rows as Enrollment[])[0] || null;
}

// Hàm format Enrollment thành response đúng định dạng
export async function formatEnrollmentForResponse(enrollment: Enrollment): Promise<any> {
  // Lấy thông tin khóa học
  const [courseRows] = await pool.query(
    'SELECT id, title, description, category_id, user_id, price, discount_price, thumbnail_url, duration, level, requirements, objectives, status, rating, enrollment_count, created_at, updated_at FROM courses WHERE id = ?',
    [enrollment.course_id]
  );
  const course = (courseRows as any[])[0] || null;

  return {
    id: enrollment.id,
    user_id: enrollment.user_id,
    course_id: enrollment.course_id,
    expiry_date: enrollment.expiry_date
      ? enrollment.expiry_date.toISOString().replace('Z', '.000000Z')
      : null,
    payment_status: enrollment.payment_status,
    payment_method: enrollment.payment_method,
    transaction_id: enrollment.transaction_id,
    price: Number(enrollment.price).toFixed(2), // Ép kiểu thành number trước khi format
    status: enrollment.status,
    completion_date: enrollment.completion_date
      ? enrollment.completion_date.toISOString().replace('Z', '.000000Z')
      : null,
    created_at: enrollment.created_at.toISOString().replace('Z', '.000000Z'),
    updated_at: enrollment.updated_at.toISOString().replace('Z', '.000000Z'),
    course: course
      ? {
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
          created_at: new Date(course.created_at).toISOString().replace('Z', '.000000Z'),
          updated_at: new Date(course.updated_at).toISOString().replace('Z', '.000000Z'),
        }
      : null,
  };
}
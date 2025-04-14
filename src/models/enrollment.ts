import pool from '../database/db';
import { Enrollment, Course  } from '../types';
import { v4 as uuidv4 } from 'uuid';

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
//progess
export async function getEnrollmentsByUserIdWithCourse(userId: string, status: string = 'Active'): Promise<Enrollment[]> {
  const [rows] = await pool.query(
      `SELECT
          e.id, e.user_id, e.course_id, e.expiry_date, e.payment_status, e.payment_method,
          e.transaction_id, e.price, e.status, e.completion_date, e.created_at, e.updated_at,
          c.id as course_course_id, c.title as course_title, c.thumbnail_url as course_thumbnail_url
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = ? AND e.status = ?`,
      [userId, status]
  );

  return (rows as any[]).map(row => {
       const enrollment: Enrollment = {
           id: row.id,
           user_id: row.user_id,
           course_id: row.course_id,
           expiry_date: row.expiry_date ? new Date(row.expiry_date) : null,
           payment_status: row.payment_status,
           payment_method: row.payment_method,
           transaction_id: row.transaction_id,
           price: Number(row.price),
           status: row.status,
           completion_date: row.completion_date ? new Date(row.completion_date) : null,
           created_at: new Date(row.created_at),
           updated_at: new Date(row.updated_at),
           course: {
                id: row.course_course_id,
                title: row.course_title,
                thumbnail_url: row.course_thumbnail_url,
                description: null,
                category_id: null,
                user_id: '', 
                price: 0,
                discount_price: null,
                duration: null,
                level: null,
                requirements: null,
                objectives: null,
                status: '', 
                rating: 0,
                enrollment_count: 0,
                created_at: new Date(), 
                category: null,
                user: null,
                lessons: []
           }
       };
       return enrollment;
   }) as Enrollment[];
}

export async function verifyEnrollmentOwner(enrollmentId: string, userId: string, requireActive: boolean = true): Promise<Enrollment | null> {
   const statusCondition = requireActive ? 'AND status = ?' : '';
   const params = requireActive ? [enrollmentId, userId, 'Active'] : [enrollmentId, userId];

   const [rows] = await pool.query(
       `SELECT id, user_id, course_id, status FROM enrollments WHERE id = ? AND user_id = ? ${statusCondition} LIMIT 1`,
       params
   );
   const row = (rows as any[])[0];
    if (!row) return null;
     return {
          id: row.id,
          user_id: row.user_id,
          course_id: row.course_id,
          status: row.status,
     } as Enrollment; 
}

export async function updateEnrollmentCompletionStatus(enrollmentId: string, status: 'Completed', completionDate: Date): Promise<boolean> {
  const [result] = await pool.query(
      'UPDATE enrollments SET status = ?, completion_date = ?, updated_at = ? WHERE id = ?',
      [status, completionDate, new Date(), enrollmentId]
  );
  return (result as any).affectedRows > 0;
}
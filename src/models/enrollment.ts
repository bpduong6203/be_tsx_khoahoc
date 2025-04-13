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
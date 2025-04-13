import pool from '../database/db';
import { Course, Lesson } from '../types';

export async function getCourses(): Promise<Course[]> {
  const [rows] = await pool.query('SELECT * FROM courses');
  return (rows as any[]).map(row => ({
    ...row,
    price: Number(row.price) || 0,
    discount_price: row.discount_price ? Number(row.discount_price) : null,
    rating: Number(row.rating) || 0,
    enrollment_count: Number(row.enrollment_count) || 0,
    created_at: row.created_at ? new Date(row.created_at) : new Date(),
  })) as Course[];
}

export async function getCourseById(id: string): Promise<Course | null> {
  const [rows] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
  const row = (rows as any[])[0];
  if (!row) return null;
  return {
    ...row,
    price: Number(row.price) || 0,
    discount_price: row.discount_price ? Number(row.discount_price) : null,
    rating: Number(row.rating) || 0,
    enrollment_count: Number(row.enrollment_count) || 0,
    created_at: row.created_at ? new Date(row.created_at) : new Date(),
  } as Course;
}

export async function getCoursesByCategory(categoryId: string): Promise<Course[]> {
  const [rows] = await pool.query('SELECT * FROM courses WHERE category_id = ?', [categoryId]);
  return (rows as any[]).map(row => ({
    ...row,
    price: Number(row.price) || 0,
    discount_price: row.discount_price ? Number(row.discount_price) : null,
    rating: Number(row.rating) || 0,
    enrollment_count: Number(row.enrollment_count) || 0,
    created_at: row.created_at ? new Date(row.created_at) : new Date(),
  })) as Course[];
}

export async function getCoursesByCategoryId(categoryId: string, status: string = 'Published'): Promise<Course[]> {
  const [rows] = await pool.query(
    `SELECT 
       c.id, 
       c.title, 
       c.description, 
       c.category_id, 
       u.name AS user_name, 
       c.price, 
       c.discount_price, 
       c.thumbnail_url, 
       c.duration, 
       c.level, 
       c.requirements, 
       c.objectives, 
       c.status, 
       c.rating, 
       c.enrollment_count 
     FROM courses c 
     JOIN users u ON c.user_id = u.id 
     WHERE c.category_id = ? AND c.status = ?`,
    [categoryId, status]
  );
  return (rows as any[]).map(row => ({
    ...row,
    price: Number(row.price) || 0,
    discount_price: row.discount_price ? Number(row.discount_price) : null,
    rating: Number(row.rating) || 0,
    enrollment_count: Number(row.enrollment_count) || 0,
  })) as Course[];
}

export async function getCategoryById(categoryId: string): Promise<{ id: string; name: string } | null> {
  const [rows] = await pool.query('SELECT id, name FROM categories WHERE id = ?', [categoryId]);
  return (rows as { id: string; name: string }[])[0] || null;
}

export async function getUserById(userId: string): Promise<{ id: string; name: string } | null> {
  const [rows] = await pool.query('SELECT id, name FROM users WHERE id = ?', [userId]);
  return (rows as { id: string; name: string }[])[0] || null;
}

export async function getLessonsByCourseId(courseId: string): Promise<Lesson[]> {
  const [rows] = await pool.query(
    'SELECT id, title, description, content, video_url, duration, order_number, status FROM lessons WHERE course_id = ? AND status = ? ORDER BY order_number',
    [courseId, 'Published']
  );
  return rows as Lesson[];
}
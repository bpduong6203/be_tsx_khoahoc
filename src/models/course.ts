import pool from '../database/db';
import { Lesson } from './lesson';

export interface Course {
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
  category: { id: string; name: string } | null;
  user: { id: string; name: string } | null;
  lessons: Lesson[];
}

export async function getCourses(): Promise<Course[]> {
  const [rows] = await pool.query('SELECT * FROM courses');
  const courses = rows as Course[];
  for (const course of courses) {
    await enrichCourse(course);
  }
  return courses;
}

export async function getCourseById(id: string): Promise<Course | null> {
  const [rows] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
  const course = (rows as Course[])[0] || null;
  if (course) {
    await enrichCourse(course);
  }
  return course;
}

export async function getCoursesByCategory(categoryId: string): Promise<Course[]> {
  const [rows] = await pool.query('SELECT * FROM courses WHERE category_id = ?', [categoryId]);
  const courses = rows as Course[];
  for (const course of courses) {
    await enrichCourse(course);
  }
  return courses;
}

async function enrichCourse(course: Course): Promise<void> {
  // Lấy category
  if (course.category_id) {
    const [categoryRows] = await pool.query('SELECT id, name FROM categories WHERE id = ?', [
      course.category_id,
    ]);
    course.category = (categoryRows as { id: string; name: string }[])[0] || null;
  } else {
    course.category = null;
  }

  // Lấy user
  if (course.user_id) {
    const [userRows] = await pool.query('SELECT id, name FROM users WHERE id = ?', [course.user_id]);
    course.user = (userRows as { id: string; name: string }[])[0] || null;
  } else {
    course.user = null;
  }

  // Lấy lessons
  const [lessonRows] = await pool.query(
    'SELECT id, title, description, content, video_url, duration, order_number, status FROM lessons WHERE course_id = ? AND status = ? ORDER BY order_number',
    [course.id, 'Published']
  );
  course.lessons = lessonRows as Lesson[];
}

export function formatCourseForResponse(course: Course): any {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    category_id: course.category_id,
    user_id: course.user_id,
    price: course.price.toFixed(2), 
    discount_price: course.discount_price ? course.discount_price.toFixed(2) : null,
    thumbnail_url: course.thumbnail_url,
    duration: course.duration,
    level: course.level,
    requirements: course.requirements,
    objectives: course.objectives,
    status: course.status,
    rating: course.rating.toFixed(2), 
    enrollment_count: course.enrollment_count,
    created_at: course.created_at.toISOString().replace('T', 'T').replace('Z', '.000000Z'),
    category: course.category,
    user: course.user,
    lessons: course.lessons,
  };
}
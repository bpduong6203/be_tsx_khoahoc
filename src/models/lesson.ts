import pool from '../database/db';
import { v4 as uuidv4 } from 'uuid';

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  content: string | null;
  video_url: string | null;
  duration: number | null;
  order_number: number;
  status: 'Published' | 'Draft';
  created_at: Date;
  updated_at: Date;
}

export async function getAllLessons(): Promise<Lesson[]> {
  const [rows] = await pool.query(
    `SELECT id, course_id, title, description, content, video_url, duration, 
            order_number, status, created_at, updated_at 
     FROM lessons 
     WHERE status = ? 
     ORDER BY course_id, order_number`,
    ['Published']
  );
  return rows as Lesson[];
}

export async function getLessonsByCourseId(course_id: string): Promise<Lesson[]> {
  const [rows] = await pool.query(
    `SELECT id, course_id, title, description, content, video_url, duration, 
            order_number, status, created_at, updated_at 
     FROM lessons 
     WHERE course_id = ? AND status = ? 
     ORDER BY order_number`,
    [course_id, 'Published']
  );
  return rows as Lesson[];
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  const [rows] = await pool.query(
    `SELECT id, course_id, title, description, content, video_url, duration, 
            order_number, status, created_at, updated_at 
     FROM lessons 
     WHERE id = ?`,
    [id]
  );
  return (rows as Lesson[])[0] || null;
}

export async function createLesson(lesson: {
  course_id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  video_url?: string | null;
  duration?: number | null;
  order_number: number;
}): Promise<Lesson> {
  const { course_id, title, description, content, video_url, duration, order_number } = lesson;
  const id = uuidv4();

  await pool.query(
    `INSERT INTO lessons (
      id, course_id, title, description, content, video_url, duration, 
      order_number, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [id, course_id, title, description || null, content || null, video_url || null, duration || null, order_number, 'Published']
  );

  const createdLesson = await getLessonById(id);
  if (!createdLesson) {
    throw new Error('Failed to create lesson');
  }
  return createdLesson;
}

export async function updateLesson(
  id: string,
  lesson: {
    title?: string;
    description?: string | null;
    content?: string | null;
    video_url?: string | null;
    duration?: number | null;
    order_number?: number;
    status?: 'Published' | 'Draft';
  }
): Promise<Lesson | null> {
  const { title, description, content, video_url, duration, order_number, status } = lesson;
  const updates: { [key: string]: any } = {};
  if (title) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (content !== undefined) updates.content = content;
  if (video_url !== undefined) updates.video_url = video_url;
  if (duration !== undefined) updates.duration = duration;
  if (order_number !== undefined) updates.order_number = order_number;
  if (status) updates.status = status;
  updates.updated_at = new Date();

  if (Object.keys(updates).length === 0) {
    return null;
  }

  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);

  await pool.query(`UPDATE lessons SET ${fields} WHERE id = ?`, [...values, id]);

  return await getLessonById(id);
}

export async function deleteLesson(id: string): Promise<void> {
  await pool.query('DELETE FROM lessons WHERE id = ?', [id]);
}

export async function isCourseOwner(course_id: string, user_id: string): Promise<boolean> {
  const [rows] = await pool.query('SELECT id FROM courses WHERE id = ? AND user_id = ?', [course_id, user_id]);
  return (rows as any[]).length > 0;
}
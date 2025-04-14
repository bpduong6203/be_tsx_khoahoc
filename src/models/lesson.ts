import pool from '../database/db';
import { Lesson } from '../types';

export async function getAllLessons(): Promise<Lesson[]> {
  const [rows] = await pool.query(
    `SELECT id, course_id, title, description, content, video_url, duration, 
            order_number, status, created_at, updated_at 
     FROM lessons 
     WHERE status = ? 
     ORDER BY course_id, order_number`,
    ['Published']
  );
  return (rows as any[]).map(row => ({
    ...row,
    duration: row.duration ? Number(row.duration) : null,
    order_number: Number(row.order_number),
    created_at: row.created_at ? new Date(row.created_at) : new Date(),
    updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
  })) as Lesson[];
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
  return (rows as any[]).map(row => ({
    ...row,
    duration: row.duration ? Number(row.duration) : null,
    order_number: Number(row.order_number),
    created_at: row.created_at ? new Date(row.created_at) : new Date(),
    updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
  })) as Lesson[];
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  const [rows] = await pool.query(
    `SELECT id, course_id, title, description, content, video_url, duration, 
            order_number, status, created_at, updated_at 
     FROM lessons 
     WHERE id = ?`,
    [id]
  );
  const row = (rows as any[])[0];
  if (!row) return null;
  return {
    ...row,
    duration: row.duration ? Number(row.duration) : null,
    order_number: Number(row.order_number),
    created_at: row.created_at ? new Date(row.created_at) : new Date(),
    updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
  } as Lesson;
}

export async function createLesson(lesson: {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  video_url?: string | null;
  duration?: number | null;
  order_number: number;
  status: 'Published' | 'Draft';
}): Promise<Lesson> {
  const { id, course_id, title, description, content, video_url, duration, order_number, status } = lesson;
  await pool.query(
    `INSERT INTO lessons (
      id, course_id, title, description, content, video_url, duration, 
      order_number, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [id, course_id, title, description || null, content || null, video_url || null, duration || null, order_number, status]
  );

  const createdLesson = await getLessonById(id);
  if (!createdLesson) {
    throw new Error('Failed to create lesson');
  }
  return createdLesson;
}

export async function updateLesson(
  id: string,
  updates: {
    title?: string;
    description?: string | null;
    content?: string | null;
    video_url?: string | null;
    duration?: number | null;
    order_number?: number;
    status?: 'Published' | 'Draft';
    updated_at: Date;
  }
): Promise<Lesson | null> {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);

  await pool.query(`UPDATE lessons SET ${fields} WHERE id = ?`, [...values, id]);

  return await getLessonById(id);
}

export async function deleteLesson(id: string): Promise<void> {
  await pool.query('DELETE FROM lessons WHERE id = ?', [id]);
}

export async function countLessonsByCourseId(courseId: string): Promise<number> {
  const [rows] = await pool.query(
    'SELECT COUNT(*) as count FROM lessons WHERE course_id = ? AND status = ?',
    [courseId, 'Published'] // Chỉ đếm bài học đã publish
  );
  return (rows as any[])[0]?.count || 0;
}

export async function verifyLessonInCourse(lessonId: string, courseId: string): Promise<boolean> {
    const [rows] = await pool.query(
        'SELECT id FROM lessons WHERE id = ? AND course_id = ?',
        [lessonId, courseId]
    );
    return (rows as any[]).length > 0;
}
// src/models/lesson.ts
import pool from '../database/db';
import { Lesson } from '../types'; // Đảm bảo Lesson type đủ các trường cần thiết

// Hàm kiểm tra lesson tồn tại
async function checkLessonExists(id: string): Promise<boolean> {
  const [rows] = await pool.query('SELECT id FROM lessons WHERE id = ?', [id]);
  return (rows as any[]).length > 0;
}

// Hàm lấy tất cả lessons, có thể thêm filter theo status hoặc các trường khác nếu cần
// Hiện tại đang lấy các bài học 'Published'
export async function getAllLessons(filters: { status?: 'Published' | 'Draft' } = {}): Promise<Lesson[]> {
  let sql = `SELECT id, course_id, title, description, content, video_url, duration, 
             order_number, status, created_at, updated_at 
             FROM lessons`;
  const params: string[] = [];

  if (filters.status) {
      sql += ' WHERE status = ?';
      params.push(filters.status);
  } else {
      // Mặc định chỉ lấy Published nếu không có filter status
      sql += ' WHERE status = ?';
      params.push('Published');
  }
  sql += ' ORDER BY course_id, order_number'; // Sắp xếp

  const [rows] = await pool.query(sql, params);
  return (rows as any[]).map(row => ({
    ...row,
    duration: row.duration ? Number(row.duration) : null,
    order_number: Number(row.order_number),
    created_at: row.created_at ? new Date(row.created_at) : new Date(),
    updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
  })) as Lesson[];
}

// Lấy các bài học theo course_id (chỉ lấy Published)
export async function getLessonsByCourseId(course_id: string): Promise<Lesson[]> {
  const [rows] = await pool.query(
    `SELECT id, course_id, title, description, content, video_url, duration,
            order_number, status, created_at, updated_at
     FROM lessons
     WHERE course_id = ? AND status = ?
     ORDER BY order_number`,
    [course_id, 'Published'] // Chỉ lấy Published cho public view
  );
  return (rows as any[]).map(row => ({
    ...row,
    duration: row.duration ? Number(row.duration) : null,
    order_number: Number(row.order_number),
    created_at: row.created_at ? new Date(row.created_at) : new Date(),
    updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
  })) as Lesson[];
}

// Lấy chi tiết một bài học theo ID (lấy cả Draft)
export async function getLessonById(id: string): Promise<Lesson | null> {
  const [rows] = await pool.query(
    `SELECT id, course_id, title, description, content, video_url, duration,
            order_number, status, created_at, updated_at
     FROM lessons
     WHERE id = ?`, // Lấy theo ID không cần check status
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

// Tạo bài học mới
export async function createLesson(lesson: {
  id: string; // ID được tạo từ service
  course_id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  video_url?: string | null;
  duration?: number | null;
  order_number: number;
  status: 'Published' | 'Draft'; // PHP có 'Archived', TS hiện chỉ có 2
}): Promise<Lesson> { // Trả về lesson vừa tạo
  const { id, course_id, title, description, content, video_url, duration, order_number, status } = lesson;
  await pool.query(
    `INSERT INTO lessons (
      id, course_id, title, description, content, video_url, duration,
      order_number, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [id, course_id, title, description || null, content || null, video_url || null, duration || null, order_number, status]
  );

  const createdLesson = await getLessonById(id); // Lấy lại để trả về
  if (!createdLesson) {
    throw new Error('Failed to retrieve newly created lesson');
  }
  return createdLesson;
}

// Cập nhật bài học
export async function updateLesson(
  id: string,
  updates: { // Chỉ chứa các trường có thể cập nhật
    // Không cho phép cập nhật course_id ở đây (khác PHP)
    title?: string;
    description?: string | null;
    content?: string | null;
    video_url?: string | null;
    duration?: number | null;
    order_number?: number;
    status?: 'Published' | 'Draft';
    // updated_at sẽ được thêm tự động
  }
): Promise<Lesson | null> {
   if (!(await checkLessonExists(id))) {
       return null; // Trả về null nếu không tìm thấy lesson
   }

   // Xây dựng query update động
   const updateFields = { ...updates, updated_at: new Date() };
   const fieldsToUpdate = Object.keys(updateFields)
                              .filter(key => updates[key as keyof typeof updates] !== undefined); // Chỉ lấy các key có giá trị được truyền vào (trừ updated_at)

   if (fieldsToUpdate.length === 1 && fieldsToUpdate[0] === 'updated_at') { // Nếu chỉ có updated_at (không có gì thay đổi)
        return getLessonById(id); // Trả về lesson hiện tại
   }

   const setClause = fieldsToUpdate.map(key => `${key} = ?`).join(', ');
   const values = fieldsToUpdate.map(key => updateFields[key as keyof typeof updateFields]);

   await pool.query(`UPDATE lessons SET ${setClause} WHERE id = ?`, [...values, id]);

   return await getLessonById(id); // Trả về lesson sau khi cập nhật
}

// Xóa bài học
export async function deleteLesson(id: string): Promise<boolean> {
  const [result] = await pool.query('DELETE FROM lessons WHERE id = ?', [id]);
  return (result as any).affectedRows > 0; // Trả về true nếu xóa thành công
}
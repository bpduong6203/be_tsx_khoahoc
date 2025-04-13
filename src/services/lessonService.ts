// src/services/lessonService.ts
import { v4 as uuidv4 } from 'uuid';
import {
  getAllLessons as getAllLessonsModel, // Đổi tên
  getLessonsByCourseId as getLessonsByCourseIdModel, // Đổi tên
  getLessonById as getLessonByIdModel, // Đổi tên
  createLesson as createLessonModel, // Đổi tên
  updateLesson as updateLessonModel, // Đổi tên
  deleteLesson as deleteLessonModel, // Đổi tên
} from '../models/lesson';
import { getCourseById } from '../models/course'; // Dùng để kiểm tra course tồn tại
import { Lesson } from '../types';

// Lấy tất cả lessons (có thể thêm filter)
export async function getAllLessonsService(filters: { status?: 'Published' | 'Draft'; course_id?: string } = {}): Promise<Lesson[]> {
    if (filters.course_id) {
        // Nếu có course_id, kiểm tra course tồn tại trước
        const course = await getCourseById(filters.course_id);
        if (!course) {
            throw new Error('Course not found');
        }
        // Gọi hàm lấy lesson theo course (có thể cần điều chỉnh model để nhận status)
        // Tạm thời bỏ qua filter status khi có course_id hoặc điều chỉnh model getLessonsByCourseId
         return getLessonsByCourseIdModel(filters.course_id); // Model này hiện chỉ lấy Published
    }
    // Nếu không có course_id, lấy tất cả theo status filter
    return getAllLessonsModel({ status: filters.status });
}

// Lấy lessons theo course ID
export async function getLessonsByCourseIdService(course_id: string): Promise<Lesson[]> {
  const course = await getCourseById(course_id);
  if (!course) {
    throw new Error('Course not found');
  }
  return getLessonsByCourseIdModel(course_id); // Model này hiện chỉ lấy Published
}

// Lấy chi tiết lesson
export async function getLessonDetails(id: string): Promise<Lesson> { // Trả về Lesson hoặc throw error
  const lesson = await getLessonByIdModel(id);
  if (!lesson) {
    throw new Error('Lesson not found');
  }
  return lesson;
}

// Tạo lesson mới
export async function createNewLesson(lessonData: {
  course_id: string;
  title: string;
  description?: string | null; // Optional theo PHP nhưng validation PHP lại required? => Điều chỉnh validation ở router nếu cần
  content?: string | null;     // Tương tự
  video_url?: string | null;
  duration?: number | null;    // PHP required
  order_number: number;     // PHP required
  status?: 'Published' | 'Draft'; // PHP có thêm Archived
}): Promise<Lesson> {
  // --- Validation Logic ---
  if (!lessonData.title || !lessonData.title.trim()) {
    throw new Error('Title is required');
  }
   // Các validation khác như description, content, duration sẽ do express-validator ở router xử lý type/required

  // Kiểm tra course tồn tại
  const course = await getCourseById(lessonData.course_id);
  if (!course) {
    throw new Error('Course not found');
  }

  // Kiểm tra order_number có bị trùng trong course này không
  const existingLessons = await getLessonsByCourseIdModel(lessonData.course_id); // Lấy hết lesson của course (cần điều chỉnh model nếu muốn check cả Draft)
  if (existingLessons.some(l => l.order_number === lessonData.order_number)) {
    throw new Error(`Order number ${lessonData.order_number} already exists in this course`);
  }
  // --- End Validation ---

  const id = uuidv4(); // Tạo ID ở service

  try {
    const newLesson = await createLessonModel({
      id,
      course_id: lessonData.course_id,
      title: lessonData.title.trim(),
      description: lessonData.description,
      content: lessonData.content,
      video_url: lessonData.video_url,
      duration: lessonData.duration,
      order_number: lessonData.order_number,
      status: lessonData.status || 'Draft', // Mặc định là Draft khi tạo mới? Hoặc 'Published' tùy yêu cầu
    });
    return newLesson;
  } catch (error: any) {
      console.error("Error creating lesson in service:", error);
      throw new Error('Failed to create lesson'); // Lỗi chung
  }
}

// Cập nhật lesson
export async function updateLessonDetails(
  id: string,
  updates: {
    title?: string;
    description?: string | null;
    content?: string | null;
    video_url?: string | null;
    duration?: number | null;
    order_number?: number;
    status?: 'Published' | 'Draft';
    // Không cho update course_id
  }
): Promise<Lesson> { // Trả về Lesson hoặc throw error
  // Lấy lesson hiện tại để kiểm tra tồn tại và order_number
  const existingLesson = await getLessonByIdModel(id);
  if (!existingLesson) {
    throw new Error('Lesson not found');
  }

  // --- Validation Logic ---
   if (updates.title !== undefined && !updates.title.trim()) {
       throw new Error('Title cannot be empty if provided');
   }
   // Các validation khác về type/format sẽ do express-validator ở router xử lý

   // Kiểm tra order_number nếu được cập nhật
   if (updates.order_number !== undefined && updates.order_number !== existingLesson.order_number) {
       // Lấy các lesson khác trong cùng course để kiểm tra trùng order_number
       const otherLessons = await getLessonsByCourseIdModel(existingLesson.course_id); // Model này chỉ lấy Published? Cần xem xét
       if (otherLessons.some(l => l.id !== id && l.order_number === updates.order_number)) {
          throw new Error(`Order number ${updates.order_number} already exists in this course`);
       }
   }
   // --- End Validation ---

   // Lọc ra các trường thực sự có giá trị để update (tránh gửi undefined vào model)
   const dataToUpdate = Object.entries(updates).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key as keyof typeof updates] = value;
        }
        return acc;
    }, {} as typeof updates);


   if (Object.keys(dataToUpdate).length === 0) {
        return existingLesson; // Không có gì thay đổi, trả về lesson hiện tại
   }


   try {
       const updatedLesson = await updateLessonModel(id, dataToUpdate);
       if (!updatedLesson) {
            // Trường hợp này không nên xảy ra nếu checkLessonExists ở model đúng
            throw new Error('Lesson not found after update attempt');
       }
       return updatedLesson;
   } catch (error: any) {
        console.error(`Error updating lesson ${id} in service:`, error);
        throw new Error('Failed to update lesson'); // Lỗi chung
   }
}

// Xóa lesson
export async function deleteLessonService(id: string): Promise<void> {
  try {
      const deleted = await deleteLessonModel(id);
      if (!deleted) {
          throw new Error('Lesson not found'); // Ném lỗi nếu model báo không xóa được
      }
  } catch (error: any) {
       console.error(`Error deleting lesson ${id} in service:`, error);
       // Nếu có lỗi từ DB hoặc nghiệp vụ khác
       throw new Error('Failed to delete lesson');
  }
}

// Hàm format response (giữ nguyên hoặc tùy chỉnh)
export function formatLessonForResponse(lesson: Lesson): any {
  return {
    id: lesson.id,
    course_id: lesson.course_id,
    title: lesson.title,
    description: lesson.description,
    content: lesson.content,
    video_url: lesson.video_url,
    duration: lesson.duration,
    order_number: lesson.order_number,
    status: lesson.status,
    // Format lại date nếu cần
    created_at: lesson.created_at?.toISOString(),
    updated_at: lesson.updated_at?.toISOString(),
  };
}
import { v4 as uuidv4 } from 'uuid';
import {
  getAllLessons,
  getLessonsByCourseId,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
} from '../models/lesson';
import { getCourseById } from '../models/course';
import { Lesson } from '../types';

export async function getAllLessonsService(): Promise<Lesson[]> {
  return getAllLessons();
}

export async function getLessonsByCourseIdService(course_id: string): Promise<Lesson[]> {
  const course = await getCourseById(course_id);
  if (!course) {
    throw new Error('Course not found');
  }
  return getLessonsByCourseId(course_id);
}

export async function getLessonDetails(id: string): Promise<Lesson | null> {
  return getLessonById(id);
}

export async function createNewLesson(lesson: {
  course_id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  video_url?: string | null;
  duration?: number | null;
  order_number: number;
}): Promise<Lesson> {
  const { course_id, title, description, content, video_url, duration, order_number } = lesson;
  if (!title.trim()) {
    throw new Error('Title is required');
  }
  if (order_number < 0) {
    throw new Error('Order number must be non-negative');
  }

  const course = await getCourseById(course_id);
  if (!course) {
    throw new Error('Course not found');
  }

  const existingLessons = await getLessonsByCourseId(course_id);
  if (existingLessons.some(l => l.order_number === order_number)) {
    throw new Error('Order number already exists in this course');
  }

  const id = uuidv4();
  return createLesson({
    id,
    course_id,
    title,
    description,
    content,
    video_url,
    duration,
    order_number,
    status: 'Published',
  });
}

export async function updateLessonDetails(
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
  const updates: {
    title?: string;
    description?: string | null;
    content?: string | null;
    video_url?: string | null;
    duration?: number | null;
    order_number?: number;
    status?: 'Published' | 'Draft';
    updated_at: Date;
  } = {
    updated_at: new Date(), // Khởi tạo updated_at ngay từ đầu
  };

  if (lesson.title) updates.title = lesson.title.trim();
  if (lesson.description !== undefined) updates.description = lesson.description;
  if (lesson.content !== undefined) updates.content = lesson.content;
  if (lesson.video_url !== undefined) updates.video_url = lesson.video_url;
  if (lesson.duration !== undefined) updates.duration = lesson.duration;
  if (lesson.order_number !== undefined) updates.order_number = lesson.order_number;
  if (lesson.status) updates.status = lesson.status;

  if (Object.keys(updates).length === 1) { // Chỉ có updated_at, không có thay đổi khác
    return null;
  }

  const existingLesson = await getLessonById(id);
  if (!existingLesson) {
    throw new Error('Lesson not found');
  }

  if (updates.order_number !== undefined && updates.order_number !== existingLesson.order_number) {
    const lessons = await getLessonsByCourseId(existingLesson.course_id);
    if (lessons.some(l => l.order_number === updates.order_number && l.id !== id)) {
      throw new Error('Order number already exists in this course');
    }
  }

  return updateLesson(id, updates);
}

export async function deleteLessonService(id: string): Promise<void> {
  const lesson = await getLessonById(id);
  if (!lesson) {
    throw new Error('Lesson not found');
  }
  await deleteLesson(id);
}

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
    created_at: lesson.created_at.toISOString().replace('T', 'T').replace('Z', '.000000Z'),
    updated_at: lesson.updated_at.toISOString().replace('T', 'T').replace('Z', '.000000Z'),
  };
}
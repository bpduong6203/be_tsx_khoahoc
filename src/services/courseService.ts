import {
    getCourses,
    getCourseById,
    getCoursesByCategory,
    getCoursesByCategoryId,
    getCategoryById,
    getUserById,
    getLessonsByCourseId,
  } from '../models/course';
  import { Course } from '../types';
  
  async function enrichCourse(course: Course): Promise<void> {
    course.category = course.category_id ? await getCategoryById(course.category_id) : null;
    course.user = course.user_id ? await getUserById(course.user_id) : null;
    course.lessons = await getLessonsByCourseId(course.id);
  }
  
  export async function getAllCourses(): Promise<Course[]> {
    const courses = await getCourses();
    for (const course of courses) {
      await enrichCourse(course);
    }
    return courses;
  }
  
  export async function getCourseDetails(id: string): Promise<Course | null> {
    const course = await getCourseById(id);
    if (course) {
      await enrichCourse(course);
    }
    return course;
  }
  
  export async function getCoursesByCategoryDetails(categoryId: string): Promise<Course[]> {
    const courses = await getCoursesByCategory(categoryId);
    for (const course of courses) {
      await enrichCourse(course);
    }
    return courses;
  }

  
  export function formatCourseForResponse(course: Course): any {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      category_id: course.category_id,
      user_id: course.user_id,
      price: course.price ? course.price.toFixed(2) : '0.00',
      discount_price: course.discount_price ? course.discount_price.toFixed(2) : null,
      thumbnail_url: course.thumbnail_url,
      duration: course.duration,
      level: course.level,
      requirements: course.requirements,
      objectives: course.objectives,
      status: course.status,
      rating: course.rating ? course.rating.toFixed(2) : '0.00',
      enrollment_count: course.enrollment_count || 0,
      created_at: course.created_at
        ? course.created_at.toISOString().replace('T', 'T').replace('Z', '.000000Z')
        : null,
      category: course.category,
      user: course.user,
      lessons: course.lessons,
    };
  }
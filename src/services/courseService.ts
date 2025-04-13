// src/services/courseService.ts
import { v4 as uuidv4 } from 'uuid';
import {
    getCourses as getCoursesModel, // Đổi tên
    getCourseById as getCourseByIdModel, // Đổi tên
    createCourse as createCourseModel, // Đổi tên
    updateCourse as updateCourseModel, // Đổi tên
    deleteCourse as deleteCourseModel, // Đổi tên
    getCoursesByUserId as getCoursesByUserIdModel // Đổi tên
    // Các hàm lấy relations nên import từ model tương ứng
} from '../models/course';
import { getCategoryById } from '../models/category'; // Import từ category model
import { getUserById } from '../models/user';       // Import từ user model
import { getLessonsByCourseId } from '../models/lesson'; // Import từ lesson model
import { Course, Lesson } from '../types'; // Import types

// Hàm làm giàu thông tin course (lấy category, user, lessons)
async function enrichCourse(course: Course): Promise<void> {
    if (course.category_id) {
        // Dùng hàm getCategoryById từ category model
        course.category = await getCategoryById(course.category_id);
    } else {
        course.category = null;
    }
    if (course.user_id) {
         // Dùng hàm getUserById từ user model (chỉ lấy id, name)
        course.user = await getUserById(course.user_id);
         // Hoặc tạo hàm mới trong user model chỉ trả về id, name nếu cần
    } else {
         course.user = null;
    }
    // Dùng hàm getLessonsByCourseId từ lesson model
    course.lessons = await getLessonsByCourseId(course.id); // Chỉ lấy lesson 'Published' theo model hiện tại
}

// Lấy danh sách courses với filter/sort/pagination
export async function getAllCourses(filters: any = {}, pagination: { page?: number, perPage?: number } = {}): Promise<{ courses: Course[], total: number }> { // Cần trả về total để phân trang
    // TODO: Xử lý pagination trong model hoặc ở đây
    const coursesFromDb = await getCoursesModel(filters);

    // Làm giàu thông tin cho từng course
    for (const course of coursesFromDb) {
      await enrichCourse(course);
    }
    // TODO: Implement pagination logic to get 'total' count based on filters
    const total = coursesFromDb.length; // Placeholder - cần query COUNT(*) với filters

    return { courses: coursesFromDb, total };
}

// Lấy chi tiết course
export async function getCourseDetails(id: string): Promise<Course> { // Throw error nếu không tìm thấy
    const course = await getCourseByIdModel(id);
    if (!course) {
        throw new Error('Course not found');
    }
    await enrichCourse(course); // Làm giàu thông tin
    return course;
}

// === BỔ SUNG CREATE SERVICE ===
export async function createNewCourse(courseData: {
    title: string;
    description?: string | null;
    category_id?: string | null;
    price: number;
    discount_price?: number | null;
    thumbnail_url?: string | null; // Nhận URL thay vì file
    duration?: number | null;
    level?: string | null;
    requirements?: string | null;
    objectives?: string | null;
    status?: string;
}, userId: string): Promise<Course> {
    // --- Validation Logic ---
    if (!courseData.title || !courseData.title.trim()) {
        throw new Error('Title is required');
    }
    if (courseData.category_id) {
        const categoryExists = await getCategoryById(courseData.category_id);
        if (!categoryExists) {
            throw new Error('Category not found');
        }
    }
     if (courseData.discount_price && courseData.discount_price >= courseData.price) {
         throw new Error('Discount price must be less than the original price');
     }
    // TODO: Thêm các validation khác nếu cần
    // --- End Validation ---

    const id = uuidv4(); // Tạo ID

    try {
        const fullCourseData = {
            ...courseData,
            id,
            user_id: userId,
            status: courseData.status || 'Draft', // Mặc định status
            level: courseData.level || 'All Levels' // Mặc định level
        };
        const newCourse = await createCourseModel(fullCourseData);
        await enrichCourse(newCourse); // Làm giàu thông tin trước khi trả về
        return newCourse;
    } catch (error: any) {
        console.error("Error creating course in service:", error);
        throw new Error('Failed to create course');
    }
}

// === BỔ SUNG UPDATE SERVICE ===
export async function updateCourseDetails(id: string, updates: any): Promise<Course> {
    // Kiểm tra course tồn tại
    const existingCourse = await getCourseByIdModel(id);
    if (!existingCourse) {
        throw new Error('Course not found');
    }

    // --- Validation Logic ---
    if (updates.title !== undefined && !updates.title.trim()) {
        throw new Error('Title cannot be empty if provided');
    }
    if (updates.category_id) {
        const categoryExists = await getCategoryById(updates.category_id);
        if (!categoryExists) {
            throw new Error('Category not found');
        }
    }
    const currentPrice = updates.price !== undefined ? updates.price : existingCourse.price;
    if (updates.discount_price !== undefined && updates.discount_price >= currentPrice) {
         throw new Error('Discount price must be less than the original price');
     }
    // --- End Validation ---

    // Lọc các trường không hợp lệ hoặc không được phép update
    const allowedUpdates = { ...updates };
    // Xóa các trường không có trong model hoặc không cho phép update (vd: user_id, rating, enrollment_count)
    delete allowedUpdates.id;
    delete allowedUpdates.user_id;
    delete allowedUpdates.rating;
    delete allowedUpdates.enrollment_count;
    delete allowedUpdates.created_at;
    delete allowedUpdates.updated_at;
    // Xóa thumbnail nếu nó là file (vì ta không xử lý upload)
    delete allowedUpdates.thumbnail;

    if (Object.keys(allowedUpdates).length === 0) {
        await enrichCourse(existingCourse);
        return existingCourse; // Không có gì thay đổi
    }

    try {
        // *** Chỗ này xử lý thumbnail_url (nếu bạn có URL string) ***
        // Nếu updates có thumbnail_url mới, có thể cần xóa file cũ (nếu đã implement)
        // const currentThumbnailUrl = existingCourse.thumbnail_url;
        // if (allowedUpdates.thumbnail_url && currentThumbnailUrl) {
        //      // Gọi hàm xóa file(currentThumbnailUrl) nếu đã implement
        // }

        const updatedCourse = await updateCourseModel(id, allowedUpdates);
        if (!updatedCourse) {
             throw new Error('Course not found after update attempt'); // Không nên xảy ra
        }
        await enrichCourse(updatedCourse); // Làm giàu thông tin
        return updatedCourse;
    } catch (error: any) {
         console.error(`Error updating course ${id} in service:`, error);
         throw new Error('Failed to update course');
    }
}

// === BỔ SUNG DELETE SERVICE ===
export async function deleteCourseService(id: string): Promise<void> {
    try {
        const result = await deleteCourseModel(id);
        if (!result.success) {
            throw new Error('Course not found');
        }
        // Nếu thành công và có thumbnailUrl:
        // if (result.thumbnailUrl) {
        //     // *** Gọi hàm xóa file(result.thumbnailUrl) nếu đã implement ***
        // }
    } catch (error: any) {
         console.error(`Error deleting course ${id} in service:`, error);
         if (error.message === 'Course not found') throw error; // Re-throw lỗi cụ thể
         throw new Error('Failed to delete course');
    }
}

// === BỔ SUNG GET USER COURSES SERVICE ===
export async function getUserCoursesService(userId: string): Promise<Course[]> {
    const courses = await getCoursesByUserIdModel(userId);
    for (const course of courses) {
      await enrichCourse(course); // Làm giàu thông tin
    }
    return courses;
}


// Hàm format response (điều chỉnh nếu cần)
export function formatCourseForResponse(course: Course): any {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      category_id: course.category_id,
      user_id: course.user_id,
      price: course.price ? course.price.toFixed(2) : '0.00',
      discount_price: course.discount_price ? course.discount_price.toFixed(2) : null,
      thumbnail_url: course.thumbnail_url, // Chỉ là URL string
      duration: course.duration,
      level: course.level,
      requirements: course.requirements, // Thêm các trường mới nếu đã cập nhật type
      objectives: course.objectives,   // Thêm các trường mới nếu đã cập nhật type
      status: course.status,
      rating: course.rating ? course.rating.toFixed(2) : '0.00',
      enrollment_count: course.enrollment_count || 0,
      created_at: course.created_at?.toISOString(), // Format date
      // Thông tin liên quan đã được enrich
      category: course.category ? { id: course.category.id, name: course.category.name } : null,
      user: course.user ? { id: course.user.id, name: course.user.name } : null, // Chỉ lấy id, name
      lessons: course.lessons?.map(lesson => formatLessonForResponse(lesson)) || [], // Format lessons nếu cần
    };
}

// Tạm thời copy hàm formatLessonForResponse ở đây hoặc import từ lessonService
function formatLessonForResponse(lesson: Lesson): any {
   return {
     id: lesson.id, course_id: lesson.course_id, title: lesson.title,
     // Thêm các trường khác của lesson nếu cần trong response course
   };
}
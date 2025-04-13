import { v4 as uuidv4 } from 'uuid';
import {
  createEnrollment,
  getEnrollmentById,
  getCourseForEnrollment,
  checkExistingEnrollment,
} from '../models/enrollment';
import { Enrollment } from '../types';

export async function enrollCourseService(
  course_id: string,
  user_id: string,
  payment_method: 'Momo' | 'Bank' | 'Paypal' | 'Cash' | null
): Promise<Enrollment> {
  // Kiểm tra khóa học tồn tại
  const course = await getCourseForEnrollment(course_id);
  if (!course) {
    const error = new Error('Khóa học không tồn tại');
    (error as any).cause = 404;
    throw error;
  }

  // Kiểm tra khóa học có Published không
  if (course.status !== 'Published') {
    const error = new Error('Khóa học chưa được phát hành');
    (error as any).cause = 400;
    throw error;
  }

  // Kiểm tra đã đăng ký chưa
  const exists = await checkExistingEnrollment(user_id, course_id);
  if (exists) {
    const error = new Error('Bạn đã đăng ký khóa học này rồi');
    (error as any).cause = 400;
    throw error;
  }

  // Tính giá
  const price = course.discount_price !== null ? course.discount_price : course.price;

  // Tạo expiry_date
  const expiry_date = new Date();
  expiry_date.setFullYear(expiry_date.getFullYear() + 1);

  const enrollment: Enrollment = {
    id: uuidv4(),
    user_id,
    course_id,
    expiry_date,
    payment_status: 'Pending',
    payment_method,
    transaction_id: null,
    price,
    status: 'Pending',
    completion_date: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return createEnrollment(enrollment);
}

export async function getEnrollmentDetails(id: string): Promise<Enrollment | null> {
  return getEnrollmentById(id);
}

export async function formatEnrollmentForResponse(enrollment: Enrollment): Promise<any> {
  const course = await getCourseForEnrollment(enrollment.course_id);

  return {
    id: enrollment.id,
    user_id: enrollment.user_id,
    course_id: enrollment.course_id,
    expiry_date: enrollment.expiry_date
      ? enrollment.expiry_date.toISOString().replace('T', 'T').replace('Z', '.000000Z')
      : null,
    payment_status: enrollment.payment_status,
    payment_method: enrollment.payment_method,
    transaction_id: enrollment.transaction_id,
    price: enrollment.price.toFixed(2),
    status: enrollment.status,
    completion_date: enrollment.completion_date
      ? enrollment.completion_date.toISOString().replace('T', 'T').replace('Z', '.000000Z')
      : null,
    created_at: enrollment.created_at.toISOString().replace('T', 'T').replace('Z', '.000000Z'),
    updated_at: enrollment.updated_at.toISOString().replace('T', 'T').replace('Z', '.000000Z'),
    course: course
      ? {
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
          updated_at: course.updated_at.toISOString().replace('T', 'T').replace('Z', '.000000Z'),
        }
      : null,
  };
}
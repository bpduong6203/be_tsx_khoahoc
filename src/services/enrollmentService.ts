// src/services/enrollmentService.ts
import { v4 as uuidv4 } from 'uuid';
import {
  createEnrollment,
  getEnrollmentById,
  getCourseForEnrollment, // Dùng để enrich
  getExistingEnrollment,     // Dùng để kiểm tra khi đăng ký
  getUserEnrollments as getUserEnrollmentsModel, // Hàm model mới
  getEnrollmentByIdAndUser as getEnrollmentByIdAndUserModel, // Hàm model mới
  updateEnrollmentStatus as updateEnrollmentStatusModel, // Hàm model mới
  findEnrollmentForUpdate as findEnrollmentForUpdateModel // Hàm model mới
} from '../models/enrollment';
import { incrementEnrollmentCount, getCourseById } from '../models/course'; // Import hàm tăng count và getCourseById
// Import payment service nếu cần tạo/update payment đồng thời
// import { createPaymentService, updatePaymentStatusByEnrollmentId } from './paymentService';
import { Enrollment, Course } from '../types'; // Import types

// --- Sửa lại hàm enrollCourseService ---
export async function enrollCourseService(
  course_id: string,
  user_id: string,
  payment_method: Enrollment['payment_method'] // Lấy kiểu từ type
): Promise<Enrollment> {
  // Kiểm tra khóa học tồn tại và trạng thái
  const course = await getCourseById(course_id); // Dùng getCourseById để lấy đủ thông tin price/status
  if (!course) {
    const error = new Error('Khóa học không tồn tại');
    (error as any).cause = 404;
    throw error;
  }
  if (course.status !== 'Published') {
    const error = new Error('Khóa học chưa được phát hành');
    (error as any).cause = 400;
    throw error;
  }

  // Kiểm tra đã đăng ký chưa (và xử lý nếu đã hủy)
  const existingEnrollment = await getExistingEnrollment(user_id, course_id);
  if (existingEnrollment) {
      // *** SỬA Ở ĐÂY: Gán status ra biến tạm để thử fix ts(2367) ***
      const currentStatus = existingEnrollment.status;
      if (currentStatus === 'Cancelled') { // <-- So sánh biến tạm
        // Nếu đã hủy, kích hoạt lại (chuyển thành Pending chờ thanh toán)
        // Cần xác định giá và trạng thái lại phòng trường hợp khóa học thay đổi giá/trạng thái
        const price = course.discount_price !== null ? course.discount_price : course.price;
        const isFree = price === 0;
        const paymentStatus: Enrollment['payment_status'] = isFree ? 'Completed' : 'Pending';
        const enrollmentStatus: Enrollment['status'] = isFree ? 'Active' : 'Pending';

        // Cập nhật lại các trường cần thiết khi reactivate
        // (Giả sử model updateEnrollmentStatus đã được sửa để nhận price, payment_method)
        const updated = await updateEnrollmentStatusModel(existingEnrollment.id, {
            status: enrollmentStatus,
            payment_status: paymentStatus,
            price: price,
            payment_method: payment_method,
        });

        if (updated) {
            if (isFree) {
                await incrementEnrollmentCount(course_id); // Tăng count nếu giờ nó miễn phí
            }
            // Lấy lại thông tin enrollment đã cập nhật
             const reactivatedEnrollment = await getEnrollmentById(existingEnrollment.id);
             if (reactivatedEnrollment) {
                 await enrichEnrollmentWithCourse(reactivatedEnrollment); // Làm giàu TT trả về
                 return reactivatedEnrollment;
             }
        }
        // Nếu không update được hoặc không lấy lại được -> throw lỗi
         throw new Error('Không thể kích hoạt lại đăng ký đã hủy');
      } else {
         // Nếu trạng thái khác Cancelled (Pending, Active, Expired) -> báo lỗi đã đăng ký
         const error = new Error('Bạn đã đăng ký khóa học này rồi');
         (error as any).cause = 400;
         throw error;
      }
  }

  // --- Tạo mới enrollment nếu chưa từng đăng ký hoặc đăng ký đã bị xóa hoàn toàn ---
  const price = course.discount_price !== null ? course.discount_price : course.price;
  const isFree = price === 0;
  const paymentStatus: Enrollment['payment_status'] = isFree ? 'Completed' : 'Pending';
  const enrollmentStatus: Enrollment['status'] = isFree ? 'Active' : 'Pending';

  // Tạo expiry_date (ví dụ 1 năm)
  const expiry_date = new Date();
  expiry_date.setFullYear(expiry_date.getFullYear() + 1);

  const newEnrollmentData: Omit<Enrollment, 'created_at' | 'updated_at' | 'course'> = { // Dùng Omit
    id: uuidv4(),
    user_id,
    course_id,
    expiry_date,
    payment_status: paymentStatus,
    payment_method, // Lưu phương thức thanh toán user chọn
    transaction_id: null,
    price,
    status: enrollmentStatus,
    completion_date: null,
  };

  // Model createEnrollment nên trả về enrollment đã tạo (có thể lấy lại bằng getEnrollmentById)
  const created = await createEnrollment({
    ...newEnrollmentData,
    created_at: new Date(),
    updated_at: new Date()
  });

  // Tăng enrollment count nếu khóa học miễn phí
  if (isFree) {
    await incrementEnrollmentCount(course_id);
  }

  // Trả về enrollment vừa tạo sau khi enrich
  await enrichEnrollmentWithCourse(created);
  return created;
}

// --- Bổ sung các hàm service mới ---

// Lấy danh sách enrollments của user
export async function getUserEnrollmentsService(userId: string, status?: string): Promise<Enrollment[]> {
    const enrollments = await getUserEnrollmentsModel(userId, status);
    // Làm giàu thông tin course cho từng enrollment
    for (const enrollment of enrollments) {
         await enrichEnrollmentWithCourse(enrollment);
    }
    return enrollments;
}

// Lấy chi tiết enrollment của user
export async function getEnrollmentDetailsService(id: string, userId: string): Promise<Enrollment> { // Throw nếu không tìm thấy
    const enrollment = await getEnrollmentByIdAndUserModel(id, userId);
    if (!enrollment) {
        // Đặt mã lỗi vào cause để router có thể bắt
        const error = new Error('Enrollment not found or you do not have access');
        (error as any).cause = 404;
        throw error;
    }
    await enrichEnrollmentWithCourse(enrollment); // Làm giàu thông tin
    // Có thể load thêm lessons, payment nếu cần tương tự PHP
    return enrollment;
}

// Hủy enrollment
export async function cancelEnrollmentService(id: string, userId: string): Promise<Enrollment> { // Throw nếu lỗi
     const enrollment = await getEnrollmentByIdAndUserModel(id, userId); // Kiểm tra tồn tại và ownership
     if (!enrollment) {
         const error = new Error('Enrollment not found or you do not have access');
         (error as any).cause = 404;
         throw error;
     }

     // Chỉ cho hủy nếu chưa thanh toán (Pending)
     if (enrollment.payment_status !== 'Pending') {
         const error = new Error('Cannot cancel an enrollment that is not pending payment');
         (error as any).cause = 400; // Bad request
         throw error;
     }

     // Cập nhật status thành Cancelled
     const updated = await updateEnrollmentStatusModel(id, { status: 'Cancelled' });
     if (!updated) {
          throw new Error('Failed to cancel enrollment'); // Lỗi không mong muốn
     }

      // Lấy lại thông tin enrollment đã cập nhật để trả về
     const cancelledEnrollment = await getEnrollmentById(id);
      if (!cancelledEnrollment) throw new Error('Failed to retrieve cancelled enrollment details'); // Lỗi không mong muốn

     await enrichEnrollmentWithCourse(cancelledEnrollment);
     return cancelledEnrollment;
}

// Cập nhật trạng thái thanh toán (cho Admin/Webhook)
export async function updateEnrollmentPaymentStatusService(
    id: string,
    paymentStatus: Enrollment['payment_status'],
    transactionId?: string | null
): Promise<Enrollment> {
     // Lấy enrollment gốc để kiểm tra và lấy course_id
     const enrollment = await findEnrollmentForUpdateModel(id); // Chỉ lấy các trường cần thiết
     if (!enrollment) {
         const error = new Error('Enrollment not found');
         (error as any).cause = 404;
         throw error;
     }

     const updates: Parameters<typeof updateEnrollmentStatusModel>[1] = { // Lấy kiểu tham số thứ 2 của hàm model
         payment_status: paymentStatus,
         transaction_id: transactionId ?? null // Đảm bảo là null nếu không có
     };
     let shouldIncrementCount = false;

     // Nếu thanh toán thành công -> kích hoạt enrollment và tăng count
     // Chỉ kích hoạt nếu trạng thái hiện tại chưa phải Active
     if (paymentStatus === 'Completed' && enrollment.status !== 'Active') {
         updates.status = 'Active';
         shouldIncrementCount = true; // Đánh dấu để tăng count sau khi update enrollment thành công
     } else if (['Failed', 'Refunded'].includes(paymentStatus)) {
         // Có thể cập nhật status enrollment tương ứng nếu muốn (vd: Pending, Expired)
         // updates.status = 'Pending'; // Hoặc Expired tùy logic
     }


     const updated = await updateEnrollmentStatusModel(id, updates);
     if (!updated) {
         throw new Error('Failed to update enrollment payment status');
     }

     // Tăng count nếu cần (chỉ khi thanh toán thành công LẦN ĐẦU)
     if (shouldIncrementCount && enrollment.course_id) {
         // Kiểm tra lại enrollment vừa update để chắc chắn status là Active
         const finalEnrollment = await getEnrollmentById(id);
         if (finalEnrollment && finalEnrollment.status === 'Active') {
             await incrementEnrollmentCount(enrollment.course_id);
         }
     }

     // *** Tùy chọn: Cập nhật bản ghi Payment liên quan ***
     // try {
     //    // Cần hàm update payment dựa trên enrollmentId
     //    await updatePaymentStatusByEnrollmentId(id, paymentStatus, transactionId);
     // } catch (paymentError) {
     //    console.error(`Failed to update associated payment for enrollment ${id}:`, paymentError);
     // }

     // Lấy lại thông tin enrollment đầy đủ đã cập nhật để trả về
     const updatedEnrollment = await getEnrollmentById(id);
      if (!updatedEnrollment) throw new Error('Failed to retrieve updated enrollment details');

     await enrichEnrollmentWithCourse(updatedEnrollment);
     return updatedEnrollment;
}


// --- Helper làm giàu thông tin enrollment ---
async function enrichEnrollmentWithCourse(enrollment: Enrollment): Promise<void> {
   if (enrollment.course_id) {
       const course = await getCourseForEnrollment(enrollment.course_id); // Hàm này có sẵn trong model enrollment
       (enrollment as any).course = course ? {
           // Chỉ lấy các trường cần thiết của course cho response
           id: course.id,
           title: course.title,
           description: course.description,
           thumbnail_url: course.thumbnail_url,
           price: course.price, // Giữ dạng number
           discount_price: course.discount_price,
           level: course.level,
           rating: course.rating,
           enrollment_count: course.enrollment_count
           // Thêm các trường khác nếu cần
       } : null;
   } else {
        (enrollment as any).course = null;
   }
}

// --- Hàm format cũ có thể không cần nữa nếu enrich đã đủ ---
// export async function formatEnrollmentForResponse(enrollment: Enrollment): Promise<any> { ... }
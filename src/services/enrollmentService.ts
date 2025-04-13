import { v4 as uuidv4 } from 'uuid';
import {
  createEnrollment,
  getEnrollmentById,
  getCourseForEnrollment,
  checkExistingEnrollment,
} from '../models/enrollment';
import { getUserById } from '../models/user'; 
import transporter from '../config/mailer'; 
import { Enrollment, User } from '../types';

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

  const createdEnrollment = await createEnrollment(enrollment);

  const user = await getUserById(user_id);
  if (!user || !user.email) {
    console.warn('User not found or no email:', user_id);
    return createdEnrollment; 
  }

  // Gửi email thông báo
  try {
    if (user.email) {
      await sendEnrollmentEmail(createdEnrollment, course, { id: user.id, email: user.email, name: user.name });
    } else {
      console.warn('Không thể gửi email vì email người dùng không tồn tại.');
    }
  } catch (error) {
    console.error('Error sending enrollment email:', error);
  }

  return createdEnrollment;
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
async function sendEnrollmentEmail(
  enrollment: Enrollment,
  course: { id: string; title: string; price: number; discount_price: number | null },
  user: { id: string; email: string; name?: string }
) {
  const paymentStatusText = enrollment.payment_status === 'Pending' ? 'Chờ thanh toán' : 'Đã hoàn tất';
  const paymentMessage =
    enrollment.payment_status === 'Pending'
      ? 'Vui lòng hoàn tất thanh toán để kích hoạt khóa học của bạn.'
      : 'Chúc mừng bạn đã sẵn sàng bắt đầu hành trình học tập!';
  const buttonText = enrollment.payment_status === 'Pending' ? 'Thanh toán ngay' : 'Bắt đầu học ngay';
  const buttonLink =
    enrollment.payment_status === 'Pending'
      ? 'http://127.0.0.1:3000/cart/cartshopping'
      : `http://127.0.0.1:3000/courses/${course.id}`;

  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: user.email,
    subject: `Xác nhận đăng ký khóa học: ${course.title}`,
    html: `
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; font-family: Arial, sans-serif; border: 1px solid #e0e0e0;">
        <!-- Header -->
        <tr>
          <td align="center" style="padding: 20px 0; background-color: #007BFF;">
            <img src="https://marketplace.canva.com/EAD5ZWq9zKg/1/0/1600w/canva-m%C3%A0u-kem-hoa-c%C3%BAc-v%E1%BB%9Bi-tr%C3%ADch-d%E1%BA%ABn-h%C3%ACnh-n%E1%BB%81n-m%C3%A1y-t%C3%ADnh-YC_KtHtlDG0.jpg" alt="Khóa học Online" style="max-width: 150px;" />
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding: 30px;">
            <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px;">Kính gửi ${user.name || 'Anh/Chị'},</h2>
            <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0 0 15px;">
              Chúng tôi xin xác nhận bạn đã đăng ký thành công khóa học
              <strong style="color: #007BFF;">${course.title}</strong>.
            </p>
            <table border="0" cellpadding="10" cellspacing="0" width="100%" style="background-color: #f4f4f4; border-radius: 5px; margin: 20px 0;">
              <tr>
                <td style="color: #555555; font-size: 14px;"><strong>Giá khóa học:</strong></td>
                <td style="color: #333333; font-size: 14px;">${enrollment.price.toFixed(2)} VND</td>
              </tr>
              <tr>
                <td style="color: #555555; font-size: 14px;"><strong>Trạng thái thanh toán:</strong></td>
                <td style="color: #333333; font-size: 14px;">${paymentStatusText}</td>
              </tr>
              <tr>
                <td style="color: #555555; font-size: 14px;"><strong>Ngày đăng ký:</strong></td>
                <td style="color: #333333; font-size: 14px;">${enrollment.created_at.toLocaleDateString('vi-VN')}</td>
              </tr>
            </table>
            <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
              ${paymentMessage}
            </p>
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center" style="padding: 10px 0;">
                  <a
                    href="${buttonLink}"
                    style="display: inline-block; padding: 12px 30px; background-color: #007BFF; color: #ffffff; text-decoration: none; font-size: 16px; border-radius: 5px;"
                  >
                    ${buttonText}
                  </a>
                </td>
              </tr>
            </table>
            <p style="color: #555555; font-size: 14px; line-height: 1.5; margin: 20px 0 0;">
              Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua
              <a href="mailto:${process.env.MAIL_FROM_ADDRESS}" style="color: #007BFF;">${process.env.MAIL_FROM_ADDRESS}</a>.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td align="center" style="padding: 20px; background-color: #f4f4f4; color: #777777; font-size: 12px;">
            <p style="margin: 0 0 10px;">Trân trọng,<br /><strong>Đội ngũ Khóa học Online</strong></p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Khóa học Online. All rights reserved.</p>
          </td>
        </tr>
      </table>
    `,
  };

  await transporter.sendMail(mailOptions);
}
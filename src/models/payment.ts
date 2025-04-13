import pool from '../database/db';
import { Payment, Enrollment } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function getAllPayments(): Promise<Payment[]> {
  // Giữ nguyên code từ trước
  const [paymentRows] = await pool.query(
    `SELECT 
      p.id,
      p.invoice_code,
      p.enrollment_id,
      p.user_id,
      p.amount,
      p.payment_method,
      p.transaction_id,
      p.status,
      p.billing_info,
      p.created_at AS payment_created_at,
      p.updated_at AS payment_updated_at,
      e.id AS enrollment_id,
      e.user_id AS enrollment_user_id,
      e.course_id,
      e.expiry_date,
      e.payment_status,
      e.payment_method AS enrollment_payment_method,
      e.transaction_id AS enrollment_transaction_id,
      e.price,
      e.status AS enrollment_status,
      e.completion_date,
      e.created_at AS enrollment_created_at,
      e.updated_at AS enrollment_updated_at,
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      u.email_verified_at,
      u.avatar,
      u.created_at AS user_created_at,
      u.updated_at AS user_updated_at
     FROM payments p
     LEFT JOIN enrollments e ON p.enrollment_id = e.id
     JOIN users u ON p.user_id = u.id`
  );

  return (paymentRows as any[]).map(row => ({
    id: row.id,
    invoice_code: row.invoice_code || '',
    enrollment_id: row.enrollment_id,
    user_id: row.user_id,
    amount: parseFloat(row.amount),
    payment_method: row.payment_method,
    transaction_id: row.transaction_id,
    status: row.status,
    billing_info: row.billing_info,
    created_at: new Date(row.payment_created_at),
    updated_at: new Date(row.payment_updated_at),
    enrollment: row.enrollment_id
      ? {
          id: row.enrollment_id,
          user_id: row.enrollment_user_id,
          course_id: row.course_id,
          expiry_date: row.expiry_date ? new Date(row.expiry_date) : null,
          payment_status: row.payment_status,
          payment_method: row.enrollment_payment_method,
          transaction_id: row.enrollment_transaction_id,
          price: parseFloat(row.price),
          status: row.enrollment_status,
          completion_date: row.completion_date ? new Date(row.completion_date) : null,
          created_at: new Date(row.enrollment_created_at),
          updated_at: new Date(row.enrollment_updated_at),
        }
      : null,
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      email_verified_at: row.email_verified_at ? new Date(row.email_verified_at) : null,
      avatar: row.avatar,
      created_at: new Date(row.user_created_at),
      updated_at: new Date(row.user_updated_at),
    },
  })) as Payment[];
}

export async function createPayment(
  enrollmentId: string,
  userId: string,
  paymentMethod: 'Bank',
  billingInfo: string | null
): Promise<Payment> {
  // Kiểm tra enrollment
  const [enrollmentRows] = await pool.query(
    `SELECT id, user_id, course_id, price, status FROM enrollments WHERE id = ?`,
    [enrollmentId]
  );
  const enrollment = (enrollmentRows as any[])[0];
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  const date = new Date().toISOString().slice(8, 10) + new Date().toISOString().slice(5, 7) + new Date().toISOString().slice(0, 4);
  const [lastPayment] = await pool.query<any>(
    `SELECT invoice_code FROM payments WHERE invoice_code LIKE ? ORDER BY invoice_code DESC LIMIT 1`,
    [`HD-${date}%`]
  );
  const sequence = lastPayment && lastPayment[0]
    ? parseInt(lastPayment[0].invoice_code.slice(-4)) + 1
    : 1;
  const invoiceCode = `HD-${date}-${sequence.toString().padStart(4, '0')}`;

  // Tạo payment
  const paymentId = uuidv4();
  const amount = parseFloat(enrollment.price);
  await pool.query(
    `INSERT INTO payments (
      id, invoice_code, enrollment_id, user_id, amount, payment_method, status, billing_info, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      paymentId,
      invoiceCode,
      enrollmentId,
      userId,
      amount,
      paymentMethod,
      'Pending',
      billingInfo,
    ]
  );

  // Lấy payment vừa tạo
  const [newPaymentRows] = await pool.query(
    `SELECT 
      p.id,
      p.invoice_code,
      p.enrollment_id,
      p.user_id,
      p.amount,
      p.payment_method,
      p.transaction_id,
      p.status,
      p.billing_info,
      p.created_at AS payment_created_at,
      p.updated_at AS payment_updated_at,
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      u.email_verified_at,
      u.avatar,
      u.created_at AS user_created_at,
      u.updated_at AS user_updated_at
     FROM payments p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = ?`,
    [paymentId]
  );

  const row = (newPaymentRows as any[])[0];
  return {
    id: row.id,
    invoice_code: row.invoice_code || '',
    enrollment_id: row.enrollment_id,
    user_id: row.user_id,
    amount: parseFloat(row.amount),
    payment_method: row.payment_method,
    transaction_id: row.transaction_id,
    status: row.status,
    billing_info: row.billing_info,
    created_at: new Date(row.payment_created_at),
    updated_at: new Date(row.payment_updated_at),
  } as Payment;
}

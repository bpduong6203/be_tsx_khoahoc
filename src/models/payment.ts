import pool from '../database/db';
import { Payment } from '../types';

export async function getAllPayments(): Promise<Payment[]> {
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
    invoice_code: row.invoice_code || '', // Xử lý invoice_code có thể null
    enrollment_id: row.enrollment_id,
    user_id: row.user_id,
    amount: parseFloat(row.amount), // Đảm bảo number
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
          price: parseFloat(row.price), // Đảm bảo number
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
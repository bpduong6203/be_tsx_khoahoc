import { getAllPayments, createPayment, updatePaymentStatus } from '../models/payment';
import { Payment } from '../types';

export async function getAllPaymentsService(): Promise<Payment[]> {
  return await getAllPayments();
}

export async function createPaymentService(
  enrollmentId: string,
  userId: string,
  paymentMethod: 'Bank',
  billingInfo: string | null
): Promise<Payment> {
  return await createPayment(enrollmentId, userId, paymentMethod, billingInfo);
}

export async function updatePaymentStatusService(
  paymentId: string,
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded',
  transactionId: string | null
): Promise<Payment> {
  return await updatePaymentStatus(paymentId, status, transactionId);
}
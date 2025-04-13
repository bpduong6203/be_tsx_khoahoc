import { getAllPayments } from '../models/payment';
import { Payment } from '../types';

export async function getAllPaymentsService(): Promise<Payment[]> {
  const payments = await getAllPayments();
  return payments; 
}
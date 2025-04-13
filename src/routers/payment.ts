import express, { Response } from 'express';
import { getAllPaymentsService, createPaymentService, updatePaymentStatusService } from '../services/paymentService';
import { AuthenticatedRequest, isAuthenticated, isAdminOrOwner } from '../middleware/auth';
import { QRCodeService } from '../services/qrCodeService';

const router = express.Router();
const qrCodeService = new QRCodeService();

router.get('/payments', isAuthenticated, isAdminOrOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payments = await getAllPaymentsService();
    return res.json({
      data: payments,
      message: 'Payments retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

interface CreatePaymentRequest extends AuthenticatedRequest {
  body: {
    enrollment_id: string;
    payment_method: 'Bank';
    billing_info?: string;
  };
}

router.post('/payments/create', isAuthenticated, async (req: CreatePaymentRequest, res: Response) => {
  try {
    const { enrollment_id, payment_method, billing_info } = req.body;

    if (!enrollment_id || !payment_method) {
      return res.status(400).json({ error: 'enrollment_id and payment_method are required' });
    }
    if (payment_method !== 'Bank') {
      return res.status(400).json({ error: 'Only Bank payment method is supported' });
    }
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const billingInfo = billing_info !== undefined ? billing_info : null;

    const payment = await createPaymentService(
      enrollment_id,
      req.user.id, 
      payment_method,
      billingInfo
    );

    if (payment_method === 'Bank') {
      const hoaDon = {
        invoice_code: payment.invoice_code,
        total_amount: payment.amount,
      };
      const bank = {
        ma_dinh_danh: '23854',
        bank_id: '2400069704360110',
        recipient_account_number: '1025267307',
      };
      const qrImage = await qrCodeService.generateQRCode(hoaDon, bank);

      return res.status(201).json({
        payment,
        qr_code: qrImage.split(',')[1], 
      });
    }

    return res.status(201).json({
      payment,
      message: 'Payment created successfully',
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create payment',
    });
  }
});

interface UpdatePaymentRequest extends AuthenticatedRequest {
  body: {
    status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
    transaction_id?: string;
  };
}

router.put('/payments/:paymentId/status', isAuthenticated, isAdminOrOwner, async (req: UpdatePaymentRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { status, transaction_id } = req.body;

    if (!status || !['Pending', 'Completed', 'Failed', 'Refunded'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Pending, Completed, Failed, or Refunded' });
    }
    if (transaction_id && typeof transaction_id !== 'string') {
      return res.status(400).json({ error: 'transaction_id must be a string' });
    }
    if (transaction_id && transaction_id.length > 100) {
      return res.status(400).json({ error: 'transaction_id must not exceed 100 characters' });
    }

    const payment = await updatePaymentStatusService(paymentId, status, transaction_id || null);

    return res.status(200).json({
      payment,
      message: 'Payment status updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      error: error.message || 'Failed to update payment status',
    });
  }
});

export default router;
import express, { Request, Response } from 'express';
import { getAllPaymentsService } from '../services/paymentService';
import { isAuthenticated, isAdminOrOwner } from '../middleware/auth';

const router = express.Router();

// GET: Lấy tất cả thanh toán (chỉ admin)
router.get('/payments', isAuthenticated, isAdminOrOwner, async (req: Request, res: Response) => {
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

export default router;
import express from 'express';
import {
  createPaymentOrder,
  verifyPaymentAndConfirmTicket,
  downloadPaymentInvoice,
} from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPaymentAndConfirmTicket);
router.get('/:identifier/invoice', authenticate, downloadPaymentInvoice);

export default router;

import express from 'express';
import {
  getClubFinancialSummary,
  requestPayout,
  updatePayoutStatus,
} from '../controllers/settlementController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get(
  '/summary',
  authenticate,
  authorize('club_admin', 'super_admin'),
  getClubFinancialSummary
);

router.post(
  '/request',
  authenticate,
  authorize('club_admin', 'super_admin'),
  requestPayout
);

router.patch(
  '/:payoutId/status',
  authenticate,
  authorize('super_admin'),
  updatePayoutStatus
);

export default router;


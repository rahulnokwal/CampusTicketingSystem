import express from 'express';
import {
  verifyAndCheckInTicket,
  getAttendeeManifest,
  syncOfflineCheckIns,
  getCheckInHistory,
} from '../controllers/checkinController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post(
  '/verify',
  authenticate,
  authorize('volunteer', 'club_admin', 'super_admin'),
  verifyAndCheckInTicket
);

router.get(
  '/manifest/:eventId',
  authenticate,
  authorize('volunteer', 'club_admin', 'super_admin'),
  getAttendeeManifest
);

router.post(
  '/sync-offline',
  authenticate,
  authorize('volunteer', 'club_admin', 'super_admin'),
  syncOfflineCheckIns
);

router.get(
  '/history',
  authenticate,
  authorize('volunteer', 'club_admin', 'super_admin'),
  getCheckInHistory
);

export default router;

import express from 'express';
import {
  submitFeedback,
  getMyFeedbackForRegistration,
  getEventFeedbackReport,
} from '../controllers/feedbackController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, submitFeedback);
router.get('/registration/:registrationId', authenticate, getMyFeedbackForRegistration);
router.get(
  '/event/:eventId/report',
  authenticate,
  authorize('club_admin', 'super_admin'),
  getEventFeedbackReport
);

export default router;


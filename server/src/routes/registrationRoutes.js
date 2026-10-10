import express from 'express';
import {
  registerForEvent,
  getMyTickets,
  getTicketById,
  cancelRegistration,
} from '../controllers/registrationController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, registerForEvent);
router.get('/my-tickets', authenticate, getMyTickets);
router.get('/:id', authenticate, getTicketById);
router.delete('/:id', authenticate, cancelRegistration);

export default router;


import express from 'express';
import {
  downloadCertificate,
  verifyCertificate,
} from '../controllers/certificateController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();


router.get('/:registrationId/download', authenticate, downloadCertificate);


router.get('/verify/:ticketCode', verifyCertificate);

export default router;


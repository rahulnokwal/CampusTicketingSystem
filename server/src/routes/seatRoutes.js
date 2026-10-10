import express from "express";
import {
  getEventSeats,
  holdSeat,
  releaseSeat,
} from "../controllers/seatController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/event/:eventId", authenticate, getEventSeats);
router.post("/hold", authenticate, holdSeat);
router.post("/release/:seatId", authenticate, releaseSeat);

export default router;

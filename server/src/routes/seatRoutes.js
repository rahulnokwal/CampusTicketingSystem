import express from "express";
import {
  getEventSeats,
  holdSeat,
  releaseSeat,
  configureEventSeats,
  updateSeatPrice,
  updateSectionPricing,
} from "../controllers/seatController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/event/:eventId", authenticate, getEventSeats);
router.post("/hold", authenticate, holdSeat);
router.post("/release/:seatId", authenticate, releaseSeat);

router.post(
  "/event/:eventId/configure",
  authenticate,
  authorize("club_admin", "super_admin"),
  configureEventSeats
);

router.patch(
  "/:seatId/price",
  authenticate,
  authorize("club_admin", "super_admin"),
  updateSeatPrice
);

router.patch(
  "/event/:eventId/section-price",
  authenticate,
  authorize("club_admin", "super_admin"),
  updateSectionPricing
);

export default router;

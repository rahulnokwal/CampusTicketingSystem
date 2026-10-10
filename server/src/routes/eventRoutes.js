import express from "express";
import {
  getEvents,
  getEventById,
  getMyClubEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadBannerImage,
  generateDescription,
  exportEventAttendeesCSV,
} from "../controllers/eventController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { uploadBanner } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/", getEvents);
router.get("/:id", getEventById);

router.get(
  "/admin/my-events",
  authenticate,
  authorize("club_admin", "super_admin"),
  getMyClubEvents,
);

router.post(
  "/",
  authenticate,
  authorize("club_admin", "super_admin"),
  createEvent,
);

router.put(
  "/:id",
  authenticate,
  authorize("club_admin", "super_admin"),
  updateEvent,
);

router.delete(
  "/:id",
  authenticate,
  authorize("club_admin", "super_admin"),
  deleteEvent,
);

router.post(
  "/:id/banner",
  authenticate,
  authorize("club_admin", "super_admin"),
  uploadBanner.single("banner"),
  uploadBannerImage,
);

router.post(
  "/ai/description",
  authenticate,
  authorize("club_admin", "super_admin"),
  generateDescription,
);

router.get(
  "/:id/attendees/export",
  authenticate,
  authorize("club_admin", "super_admin", "volunteer"),
  exportEventAttendeesCSV,
);

export default router;

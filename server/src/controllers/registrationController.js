import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { Seat } from "../models/Seat.js";
import { sendTicketConfirmationEmail } from "../services/mailService.js";

const QR_SECRET =
  process.env.JWT_QR_SECRET ||
  "campus_life_qr_payload_secret_key_tamper_proof_32_bytes";

export const registerForEvent = async (req, res) => {
  const { eventId, paymentDetails, seatId } = req.body;
  const studentId = req.user.userId;

  if (!eventId) {
    return res.status(400).json({
      success: false,
      message: "Event ID is required",
    });
  }

  try {
    const existing = await Registration.findOne({
      event: eventId,
      student: studentId,
      status: { $ne: "CANCELLED" },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You have already booked a ticket for this event",
        ticket: existing,
      });
    }

    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: "PUBLISHED",
        $expr: { $lt: ["$registeredCount", "$capacity"] },
      },
      {
        $inc: { registeredCount: 1 },
      },
      {
        new: true,
      },
    );

    if (!event) {
      return res.status(400).json({
        success: false,
        message: "Registration closed. This event has reached full capacity.",
      });
    }

    const ticketCode = `CL-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    const qrPayload = jwt.sign(
      {
        ticketCode,
        eventId: event._id.toString(),
        studentId: studentId.toString(),
        type: "CAMPUS_LIFE_TICKET",
      },
      QR_SECRET,
      { expiresIn: "30d" },
    );

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "H",
      width: 320,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    let seatLabel = "";
    let seatRef = null;
    let heldSeat = null;
    if (seatId) {
      heldSeat = await Seat.findOneAndUpdate(
        { _id: seatId, event: event._id },
        { $set: { status: "RESERVED", heldBy: studentId } },
        { new: true },
      );
      if (heldSeat) {
        seatLabel = heldSeat.seatLabel;
        seatRef = heldSeat._id;
      }
    }

    const registration = await Registration.create({
      event: event._id,
      student: studentId,
      ticketCode,
      qrPayload,
      qrDataUrl,
      seatLabel,
      seat: seatRef,
      status: "BOOKED",
    });

    if (heldSeat) {
      heldSeat.ticket = registration._id;
      await heldSeat.save();
    }

    if (event.price > 0) {
      await Payment.create({
        registration: registration._id,
        student: studentId,
        event: event._id,
        amount: event.price,
        gatewayOrderId: paymentDetails?.gatewayOrderId || `order_${Date.now()}`,
        gatewayPaymentId:
          paymentDetails?.gatewayPaymentId || `pay_${Date.now()}_simulated`,
        status: "SUCCESS",
      });
    }

    const studentUser = await User.findById(studentId);
    if (studentUser) {
      sendTicketConfirmationEmail({
        to: studentUser.email,
        name: studentUser.name,
        eventTitle: event.title,
        eventDate: event.date,
        eventVenue: event.venue,
        ticketCode,
        qrDataUrl,
      }).catch((err) =>
        console.error("[Ticket Email Background Error]:", err.message),
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Ticket confirmed successfully! A copy has been dispatched to your email.",
      ticket: {
        id: registration._id,
        ticketCode,
        qrDataUrl,
        seatLabel: registration.seatLabel,
        status: registration.status,
        event: {
          id: event._id,
          title: event.title,
          venue: event.venue,
          date: event.date,
          price: event.price,
          club: event.club,
          banner: event.banner,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });
      return res.status(409).json({
        success: false,
        message: "You are already registered for this event.",
      });
    }

    console.error("[Registration Controller Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to complete registration",
    });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const tickets = await Registration.find({
      student: studentId,
      status: { $ne: "CANCELLED" },
    })
      .sort({ createdAt: -1 })
      .populate("event");

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("[Get My Tickets Error]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve your tickets",
    });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await Registration.findById(req.params.id)
      .populate("event")
      .populate("student", "name email");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (
      ticket.student._id.toString() !== req.user.userId &&
      req.user.role !== "super_admin" &&
      req.user.role !== "volunteer"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this ticket",
      });
    }

    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve ticket",
    });
  }
};

export const cancelRegistration = async (req, res) => {
  try {
    const ticket = await Registration.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (
      ticket.student.toString() !== req.user.userId &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this registration",
      });
    }

    if (ticket.status === "CHECKED_IN") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a ticket that has already been checked in",
      });
    }

    ticket.status = "CANCELLED";
    await ticket.save();

    await Event.findByIdAndUpdate(ticket.event, {
      $inc: { registeredCount: -1 },
    });

    return res.status(200).json({
      success: true,
      message: "Registration cancelled successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel registration",
    });
  }
};

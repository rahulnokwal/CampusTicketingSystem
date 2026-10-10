import crypto from "crypto";
import Razorpay from "razorpay";
import { Payment } from "../models/Payment.js";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { User } from "../models/User.js";
import { Seat } from "../models/Seat.js";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import { sendTicketConfirmationEmail } from "../services/mailService.js";
import { generateTaxInvoicePDF } from "../services/invoiceService.js";

const QR_SECRET =
  process.env.JWT_QR_SECRET ||
  "campus_life_qr_payload_secret_key_tamper_proof_32_bytes";

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (key_id && key_secret && !key_id.includes("test_campuslife")) {
    try {
      return new Razorpay({ key_id, key_secret });
    } catch (e) {
      console.warn("[Razorpay] Init notice:", e.message);
    }
  }
  return null;
};

export const createPaymentOrder = async (req, res) => {
  try {
    const { eventId, seatId } = req.body;
    const studentId = req.user.userId;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: "This event is currently sold out",
      });
    }

    const existingRegistration = await Registration.findOne({
      event: eventId,
      student: studentId,
      status: { $ne: "CANCELLED" },
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event",
      });
    }

    let seatPrice = event.price;
    if (seatId) {
      const seat = await Seat.findOne({ _id: seatId, event: eventId });
      if (seat && typeof seat.tierPrice === "number") {
        seatPrice = seat.tierPrice;
      }
    }

    const amountInPaise = Math.round(seatPrice * 100);
    const receipt = `rcpt_${Date.now().toString(36)}_${studentId.toString().slice(-4)}`;

    const rzp = getRazorpayInstance();
    let gatewayOrderId;

    if (rzp && seatPrice > 0) {
      try {
        const rzpOrder = await rzp.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt,
          notes: {
            eventId: event._id.toString(),
            studentId: studentId.toString(),
            eventTitle: event.title,
            seatId: seatId ? seatId.toString() : "",
          },
        });
        gatewayOrderId = rzpOrder.id;
      } catch (err) {
        console.warn(
          "[Razorpay Live Order Failed, falling back to Sandbox order]:",
          err.message,
        );
        gatewayOrderId = `order_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      }
    } else {
      gatewayOrderId = `order_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    }

    return res.status(200).json({
      success: true,
      order: {
        gatewayOrderId,
        amount: seatPrice,
        amountInPaise,
        currency: "INR",
        eventTitle: event.title,
        eventId: event._id,
        seatId: seatId || null,
        isFree: seatPrice === 0,
        keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_campuslife123",
      },
    });
  } catch (error) {
    console.error("[Payment Order Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to initialize payment order",
    });
  }
};

export const verifyPaymentAndConfirmTicket = async (req, res) => {
  try {
    const {
      eventId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      seatId,
    } = req.body;

    const studentId = req.user.userId;

    if (!eventId || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification parameters",
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (
      keySecret &&
      !keySecret.includes("test_secret_campuslife") &&
      razorpay_signature
    ) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed: Invalid HMAC signature.",
        });
      }
    }

    const existingRegistration = await Registration.findOne({
      event: eventId,
      student: studentId,
      status: { $ne: "CANCELLED" },
    });

    if (existingRegistration) {
      return res.status(200).json({
        success: true,
        message: "You already hold a confirmed admission pass for this event",
        ticket: {
          id: existingRegistration._id,
          ticketCode: existingRegistration.ticketCode,
          qrDataUrl: existingRegistration.qrDataUrl,
          seatLabel: existingRegistration.seatLabel || null,
          status: existingRegistration.status,
        },
      });
    }

    let heldSeat = null;
    if (seatId) {
      heldSeat = await Seat.findOne({
        _id: seatId,
        event: eventId,
        $or: [
          { status: "HELD", heldBy: studentId },
          { status: "AVAILABLE" },
          { heldBy: studentId, status: { $ne: "RESERVED" } },
        ],
      });

      if (!heldSeat) {
        return res.status(400).json({
          success: false,
          message:
            "Seat hold expired or unavailable. Please select your seat again.",
        });
      }
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
        message: "Event reached capacity during transaction.",
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
      color: { dark: "#1F2937", light: "#FFFFFF" },
    });

    let registration;
    try {
      registration = await Registration.create({
        event: event._id,
        student: studentId,
        ticketCode,
        qrPayload,
        qrDataUrl,
        seatLabel: heldSeat ? heldSeat.seatLabel : "",
        seat: heldSeat ? heldSeat._id : null,
        status: "BOOKED",
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        await Event.findByIdAndUpdate(eventId, {
          $inc: { registeredCount: -1 },
        });
        const existing = await Registration.findOne({
          event: eventId,
          student: studentId,
        });
        return res.status(200).json({
          success: true,
          message: "Ticket already confirmed",
          ticket: existing,
        });
      }
      throw createErr;
    }

    if (heldSeat) {
      await Seat.findByIdAndUpdate(heldSeat._id, {
        status: "RESERVED",
        heldBy: studentId,
        ticket: registration._id,
      });
    }

    const finalPaidAmount =
      heldSeat && typeof heldSeat.tierPrice === "number"
        ? heldSeat.tierPrice
        : event.price;

    let payment = await Payment.findOne({
      gatewayPaymentId: razorpay_payment_id,
    });
    if (!payment) {
      payment = await Payment.create({
        registration: registration._id,
        student: studentId,
        event: event._id,
        amount: finalPaidAmount,
        gatewayOrderId: razorpay_order_id,
        gatewayPaymentId: razorpay_payment_id,
        status: "SUCCESS",
        paymentMethod: "RAZORPAY_GATEWAY",
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
        seatLabel: registration.seatLabel || undefined,
      }).catch((err) => console.error("[Ticket Email Error]:", err.message));
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified & admission pass issued!",
      paymentId: payment._id,
      ticket: {
        id: registration._id,
        ticketCode,
        qrDataUrl,
        seatLabel: registration.seatLabel || null,
        status: registration.status,
        event: {
          id: event._id,
          title: event.title,
          venue: event.venue,
          date: event.date,
          price: finalPaidAmount,
          club: event.club,
          banner: event.banner,
        },
      },
    });
  } catch (error) {
    console.error("[Verify Payment Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
};

export const downloadPaymentInvoice = async (req, res) => {
  try {
    const { identifier } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let payment = await Payment.findById(identifier)
      .populate("student", "name email")
      .populate("event", "title venue date club price")
      .populate("registration", "ticketCode seatLabel");

    if (!payment) {
      payment = await Payment.findOne({ registration: identifier })
        .populate("student", "name email")
        .populate("event", "title venue date club price")
        .populate("registration", "ticketCode seatLabel");
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found for this pass",
      });
    }

    const isOwner = payment.student._id.toString() === userId.toString();
    const isPrivileged = ["super_admin", "club_admin"].includes(userRole);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to download this invoice",
      });
    }

    const invoiceNo = `INV-${payment._id.toString().toUpperCase().slice(-8)}`;

    const pdfBuffer = await generateTaxInvoicePDF({
      invoiceNumber: invoiceNo,
      paymentDate: payment.createdAt,
      studentName: payment.student?.name || "Student Attendee",
      studentEmail: payment.student?.email || "",
      eventTitle: payment.event?.title || "Campus Event",
      eventDate: payment.event?.date || new Date(),
      eventVenue: payment.event?.venue || "Campus Venue",
      clubName: payment.event?.club || "Campus Club",
      seatLabel: payment.registration?.seatLabel || "",
      ticketCode: payment.registration?.ticketCode || "N/A",
      amount: payment.amount,
      gatewayPaymentId: payment.gatewayPaymentId,
      gatewayOrderId: payment.gatewayOrderId,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoiceNo}.pdf"`,
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error) {
    console.error("[Download Invoice Error]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate tax invoice",
    });
  }
};

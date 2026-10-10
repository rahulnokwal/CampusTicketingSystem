import { Payout } from "../models/Payout.js";
import { Event } from "../models/Event.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";

export const getClubFinancialSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let clubName = req.query.club;
    if (!clubName) {
      const user = await User.findById(userId);
      clubName = user?.club;
    }

    if (!clubName && userRole !== "super_admin") {
      return res.status(400).json({
        success: false,
        message: "No associated club found for this administrator account",
      });
    }

    const eventQuery = clubName ? { club: clubName } : {};
    const clubEvents = await Event.find(eventQuery).select(
      "_id title date price club registeredCount",
    );

    const eventIds = clubEvents.map((e) => e._id);

    const successfulPayments = await Payment.find({
      event: { $in: eventIds },
      status: "SUCCESS",
    }).select("event amount createdAt");

    const paymentsByEvent = {};
    let totalGrossRevenue = 0;

    for (const payment of successfulPayments) {
      const evId = payment.event.toString();
      paymentsByEvent[evId] = (paymentsByEvent[evId] || 0) + payment.amount;
      totalGrossRevenue += payment.amount;
    }

    const platformFeeRate = 0.05;
    const totalPlatformFee = totalGrossRevenue * platformFeeRate;
    const totalNetRevenue = totalGrossRevenue - totalPlatformFee;

    const payoutQuery = clubName ? { club: clubName } : {};
    const payouts = await Payout.find(payoutQuery).sort({ createdAt: -1 });

    const totalDisbursed = payouts
      .filter((p) => p.status === "DISBURSED")
      .reduce((sum, p) => sum + p.netAmount, 0);

    const totalPending = payouts
      .filter((p) => p.status === "PENDING" || p.status === "APPROVED")
      .reduce((sum, p) => sum + p.netAmount, 0);

    const availableBalance = Math.max(
      0,
      totalNetRevenue - totalDisbursed - totalPending,
    );

    const eventBreakdown = clubEvents.map((ev) => {
      const gross = paymentsByEvent[ev._id.toString()] || 0;
      const fee = gross * platformFeeRate;
      const net = gross - fee;

      const eventPayout = payouts.find(
        (p) => p.event.toString() === ev._id.toString(),
      );

      return {
        eventId: ev._id,
        title: ev.title,
        date: ev.date,
        ticketsSold: ev.registeredCount,
        grossRevenue: gross,
        platformFee: fee,
        netRevenue: net,
        payoutStatus: eventPayout
          ? eventPayout.status
          : gross > 0
            ? "UNCLAIMED"
            : "NO_SALES",
      };
    });

    return res.status(200).json({
      success: true,
      club: clubName || "All Campus Clubs",
      summary: {
        totalGrossRevenue,
        totalPlatformFee,
        totalNetRevenue,
        totalDisbursed,
        totalPending,
        availableBalance,
      },
      eventBreakdown,
      payouts,
    });
  } catch (error) {
    console.error("[Financial Summary Error]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve financial summary",
    });
  }
};

export const requestPayout = async (req, res) => {
  try {
    const { eventId, accountHolder, accountNumber, ifscCode, bankName } =
      req.body;
    const userId = req.user.userId;

    if (
      !eventId ||
      !accountHolder ||
      !accountNumber ||
      !ifscCode ||
      !bankName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Event selection and complete bank account details are required",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const existingPayout = await Payout.findOne({
      event: eventId,
      status: { $in: ["PENDING", "APPROVED", "DISBURSED"] },
    });

    if (existingPayout) {
      return res.status(400).json({
        success: false,
        message: `A payout for this event is already ${existingPayout.status.toLowerCase()}`,
      });
    }

    const payments = await Payment.find({ event: eventId, status: "SUCCESS" });
    const grossRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    if (grossRevenue <= 0) {
      return res.status(400).json({
        success: false,
        message: "No revenue available to disburse for this event",
      });
    }

    const platformFeeRate = 0.05;
    const platformFee = grossRevenue * platformFeeRate;
    const netAmount = grossRevenue - platformFee;

    const payout = await Payout.create({
      club: event.club,
      requestedBy: userId,
      event: event._id,
      grossRevenue,
      platformFeeRate,
      platformFee,
      netAmount,
      bankDetails: {
        accountHolder,
        accountNumber,
        ifscCode,
        bankName,
      },
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: `Payout request of ₹${netAmount.toFixed(2)} submitted for campus finance approval!`,
      payout,
    });
  } catch (error) {
    console.error("[Request Payout Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit payout request",
    });
  }
};

export const updatePayoutStatus = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { status, transactionReference, notes } = req.body;

    const payout = await Payout.findById(payoutId);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout request not found",
      });
    }

    if (status) payout.status = status;
    if (transactionReference)
      payout.transactionReference = transactionReference;
    if (notes) payout.notes = notes;

    if (status === "DISBURSED") {
      payout.disbursedAt = new Date();
    }

    await payout.save();

    return res.status(200).json({
      success: true,
      message: `Payout status updated to ${payout.status}`,
      payout,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update payout status",
    });
  }
};

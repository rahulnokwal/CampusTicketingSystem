import { Seat } from "../models/Seat.js";
import { Event } from "../models/Event.js";

const generateAuditoriumSeats = async (event) => {
  const basePrice = event.price || 0;
  const vipPrice = basePrice > 0 ? Math.round(basePrice * 1.5) : 150;
  const generalPrice = basePrice > 0 ? basePrice : 100;
  const balconyPrice = basePrice > 0 ? Math.round(basePrice * 0.8) : 80;

  const seatsToCreate = [];

  for (let i = 1; i <= 8; i++) {
    seatsToCreate.push({
      event: event._id,
      seatLabel: `A${i}`,
      row: "A",
      number: i,
      section: "VIP",
      tierPrice: vipPrice,
      status: "AVAILABLE",
    });
  }

  for (let i = 1; i <= 10; i++) {
    seatsToCreate.push({
      event: event._id,
      seatLabel: `B${i}`,
      row: "B",
      number: i,
      section: "General",
      tierPrice: generalPrice,
      status: "AVAILABLE",
    });
  }

  for (let i = 1; i <= 10; i++) {
    seatsToCreate.push({
      event: event._id,
      seatLabel: `C${i}`,
      row: "C",
      number: i,
      section: "General",
      tierPrice: generalPrice,
      status: "AVAILABLE",
    });
  }

  for (let i = 1; i <= 8; i++) {
    seatsToCreate.push({
      event: event._id,
      seatLabel: `D${i}`,
      row: "D",
      number: i,
      section: "Balcony",
      tierPrice: balconyPrice,
      status: "AVAILABLE",
    });
  }

  try {
    await Seat.insertMany(seatsToCreate, { ordered: false });
  } catch (err) {}
};

export const getEventSeats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    await Seat.updateMany(
      {
        event: eventId,
        status: "HELD",
        heldUntil: { $lt: new Date() },
      },
      {
        $set: {
          status: "AVAILABLE",
          heldBy: null,
          heldUntil: null,
        },
      },
    );

    const seatCount = await Seat.countDocuments({ event: eventId });
    if (seatCount === 0) {
      await generateAuditoriumSeats(event);
    }

    const seats = await Seat.find({ event: eventId })
      .sort({ row: 1, number: 1 })
      .lean();

    const currentUserId = req.user ? req.user.userId : null;
    const mappedSeats = seats.map((s) => ({
      ...s,
      isHeldByMe: currentUserId && s.heldBy?.toString() === currentUserId,
    }));

    return res.status(200).json({
      success: true,
      totalSeats: mappedSeats.length,
      seats: mappedSeats,
    });
  } catch (error) {
    console.error("[Get Seats Error]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve event seats",
    });
  }
};

export const holdSeat = async (req, res) => {
  try {
    const { eventId, seatId } = req.body;
    const userId = req.user.userId;

    if (!eventId || !seatId) {
      return res.status(400).json({
        success: false,
        message: "Event ID and Seat ID are required",
      });
    }

    await Seat.updateMany(
      {
        event: eventId,
        heldBy: userId,
        status: "HELD",
        _id: { $ne: seatId },
      },
      {
        $set: {
          status: "AVAILABLE",
          heldBy: null,
          heldUntil: null,
        },
      },
    );

    const holdExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const lockedSeat = await Seat.findOneAndUpdate(
      {
        _id: seatId,
        event: eventId,
        $or: [
          { status: "AVAILABLE" },
          { status: "HELD", heldUntil: { $lt: new Date() } },
          { status: "HELD", heldBy: userId },
        ],
      },
      {
        $set: {
          status: "HELD",
          heldBy: userId,
          heldUntil: holdExpiresAt,
        },
      },
      { new: true },
    );

    if (!lockedSeat) {
      return res.status(409).json({
        success: false,
        message:
          "This seat was just selected by another attendee. Please choose another.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Seat ${lockedSeat.seatLabel} reserved for 5 minutes`,
      seat: lockedSeat,
      expiresAt: lockedSeat.heldUntil,
    });
  } catch (error) {
    console.error("[Hold Seat Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to hold seat",
    });
  }
};

export const releaseSeat = async (req, res) => {
  try {
    const { seatId } = req.params;
    const userId = req.user.userId;

    const seat = await Seat.findOneAndUpdate(
      {
        _id: seatId,
        heldBy: userId,
        status: "HELD",
      },
      {
        $set: {
          status: "AVAILABLE",
          heldBy: null,
          heldUntil: null,
        },
      },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Seat released",
      seat,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to release seat",
    });
  }
};

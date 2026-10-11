import { Seat } from "../models/Seat.js";
import { Event } from "../models/Event.js";

export const generateConfiguredSeats = async (event, customConfig = null) => {
  const config = customConfig || event.seatingConfiguration;

  const seatsToCreate = [];

  if (config && Array.isArray(config.sections) && config.sections.length > 0) {
    for (const section of config.sections) {
      const sectionName = section.name || "General";
      const sectionPrice =
        typeof section.price === "number" ? section.price : event.price || 0;
      const rows = section.rows || [];

      for (const rowData of rows) {
        const rowLabel = rowData.row || "A";
        const seatCount = Number(rowData.seatCount) || 10;
        const startNumber = Number(rowData.startNumber) || 1;

        for (let i = startNumber; i < startNumber + seatCount; i++) {
          seatsToCreate.push({
            event: event._id,
            seatLabel: `${rowLabel}${i}`,
            row: rowLabel,
            number: i,
            section: sectionName,
            tierPrice: sectionPrice,
            status: "AVAILABLE",
          });
        }
      }
    }
  } else {
    const totalCapacity = Number(event.capacity) || 36;
    const basePrice = event.price || 0;
    const vipPrice = basePrice > 0 ? Math.round(basePrice * 1.5) : 150;
    const generalPrice = basePrice > 0 ? basePrice : 100;
    const balconyPrice = basePrice > 0 ? Math.round(basePrice * 0.8) : 80;

    const vipCount = Math.max(1, Math.round(totalCapacity * 0.2));
    const balconyCount = Math.max(1, Math.round(totalCapacity * 0.25));
    const generalCount = Math.max(1, totalCapacity - vipCount - balconyCount);

    let currentNum = 1;
    for (let i = 1; i <= vipCount; i++) {
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

    const genRow1 = Math.ceil(generalCount / 2);
    const genRow2 = generalCount - genRow1;
    for (let i = 1; i <= genRow1; i++) {
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
    for (let i = 1; i <= genRow2; i++) {
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

    for (let i = 1; i <= balconyCount; i++) {
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
  }

  try {
    if (seatsToCreate.length > 0) {
      await Seat.insertMany(seatsToCreate, { ordered: false });
    }
  } catch (err) {
    console.warn("[Seat Generation notice]:", err.message);
  }
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
    if (seatCount === 0 && event.requiresSeatSelection) {
      await generateConfiguredSeats(event);
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
      requiresSeatSelection: Boolean(event.requiresSeatSelection),
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

export const configureEventSeats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sections, requiresSeatSelection } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (
      event.createdBy.toString() !== req.user.userId &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to configure seats for this event",
      });
    }

    const reservedCount = await Seat.countDocuments({
      event: eventId,
      status: "RESERVED",
    });

    if (reservedCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot re-configure entire auditorium: attendees have already reserved seats for this event.",
      });
    }

    await Seat.deleteMany({ event: eventId });

    if (requiresSeatSelection !== undefined) {
      event.requiresSeatSelection = Boolean(requiresSeatSelection);
    }

    if (sections && Array.isArray(sections)) {
      event.seatingConfiguration = { sections };
      let newCapacity = 0;
      for (const sec of sections) {
        for (const row of sec.rows || []) {
          newCapacity += Number(row.seatCount) || 0;
        }
      }
      if (newCapacity > 0) {
        event.capacity = newCapacity;
      }
    }

    await event.save();

    if (event.requiresSeatSelection) {
      await generateConfiguredSeats(event);
    }

    const createdSeats = await Seat.find({ event: eventId })
      .sort({ row: 1, number: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Auditorium seating arrangement updated successfully",
      totalSeats: createdSeats.length,
      seats: createdSeats,
      event,
    });
  } catch (error) {
    console.error("[Configure Seats Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to configure auditorium seats",
    });
  }
};

export const updateSeatPrice = async (req, res) => {
  try {
    const { seatId } = req.params;
    const { tierPrice, section } = req.body;

    if (tierPrice === undefined || Number(tierPrice) < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid seat tier price is required",
      });
    }

    const seat = await Seat.findById(seatId).populate("event");
    if (!seat) {
      return res
        .status(404)
        .json({ success: false, message: "Seat not found" });
    }

    if (
      seat.event.createdBy.toString() !== req.user.userId &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this seat price",
      });
    }

    seat.tierPrice = Number(tierPrice);
    if (section) {
      seat.section = section;
    }
    await seat.save();

    return res.status(200).json({
      success: true,
      message: `Seat ${seat.seatLabel} price updated to ₹${seat.tierPrice}`,
      seat,
    });
  } catch (error) {
    console.error("[Update Seat Price Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update seat price",
    });
  }
};

export const updateSectionPricing = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { section, tierPrice } = req.body;

    if (!section || tierPrice === undefined || Number(tierPrice) < 0) {
      return res.status(400).json({
        success: false,
        message: "Section name and valid price are required",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (
      event.createdBy.toString() !== req.user.userId &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage pricing for this event",
      });
    }

    const result = await Seat.updateMany(
      { event: eventId, section, status: { $ne: "RESERVED" } },
      { $set: { tierPrice: Number(tierPrice) } },
    );

    return res.status(200).json({
      success: true,
      message: `Updated pricing for ${result.modifiedCount} seats in ${section} section to ₹${tierPrice}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("[Update Section Pricing Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update section pricing",
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

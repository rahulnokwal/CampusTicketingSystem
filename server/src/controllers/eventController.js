import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { Seat } from "../models/Seat.js";
import { User } from "../models/User.js";
import { generateEventDescription } from "../services/aiService.js";

export const getEvents = async (req, res) => {
  try {
    const { category, search, club } = req.query;
    const filter = { status: "PUBLISHED" };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (club) {
      filter.club = new RegExp(club, "i");
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { venue: new RegExp(search, "i") },
      ];
    }

    const events = await Event.find(filter)
      .sort({ date: 1 })
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("[Get Events Error]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve events",
    });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve event details",
    });
  }
};

export const getMyClubEvents = async (req, res) => {
  try {
    const filter =
      req.user.role === "super_admin" ? {} : { createdBy: req.user.userId };

    const events = await Event.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve your club events",
    });
  }
};

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      venue,
      date,
      capacity,
      price = 0,
      club,
      banner,
      status = "PUBLISHED",
      requiresSeatSelection = false,
      seatingConfiguration = null,
      registrationDeadline = null,
      volunteers = [],
    } = req.body;

    if (!title || !description || !venue || !date || !capacity) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields (title, description, venue, date, capacity)",
      });
    }

    const clubName = club || req.user.clubName || `${req.user.name}'s Club`;

    const event = await Event.create({
      title,
      description,
      category: category || "Tech",
      venue,
      date: new Date(date),
      capacity: Number(capacity),
      price: Number(price),
      club: clubName,
      createdBy: req.user.userId,
      status,
      banner:
        banner ||
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
      requiresSeatSelection: Boolean(requiresSeatSelection),
      seatingConfiguration: seatingConfiguration || null,
      registrationDeadline: registrationDeadline
        ? new Date(registrationDeadline)
        : null,
      volunteers: Array.isArray(volunteers) ? volunteers : [],
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("[Create Event Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create event",
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (
      event.createdBy.toString() !== req.user.userId &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this event",
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (req.body.price !== undefined) {
      const newBase = Number(req.body.price) || 0;
      const vipPrice = newBase > 0 ? Math.round(newBase * 1.5) : 150;
      const generalPrice = newBase > 0 ? newBase : 100;
      const balconyPrice = newBase > 0 ? Math.round(newBase * 0.8) : 80;

      await Promise.all([
        Seat.updateMany(
          { event: event._id, section: "VIP", status: { $ne: "RESERVED" } },
          { $set: { tierPrice: vipPrice } },
        ),
        Seat.updateMany(
          { event: event._id, section: "General", status: { $ne: "RESERVED" } },
          { $set: { tierPrice: generalPrice } },
        ),
        Seat.updateMany(
          { event: event._id, section: "Balcony", status: { $ne: "RESERVED" } },
          { $set: { tierPrice: balconyPrice } },
        ),
      ]);
    }

    if (req.body.status === "COMPLETED" && event.volunteers?.length > 0) {
      for (const volId of event.volunteers) {
        // Check if volunteer is assigned to any other upcoming PUBLISHED event
        const otherActiveEvents = await Event.countDocuments({
          _id: { $ne: event._id },
          volunteers: volId,
          status: "PUBLISHED",
          date: { $gte: new Date() },
        });

        if (otherActiveEvents === 0) {
          await User.findByIdAndUpdate(volId, { role: "student" });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update event",
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (
      event.createdBy.toString() !== req.user.userId &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this event",
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete event",
    });
  }
};

export const uploadBannerImage = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (
      event.createdBy.toString() !== req.user.userId &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to upload banner for this event",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    const bannerUrl = `/uploads/${req.file.filename}`;
    event.banner = bannerUrl;
    await event.save();

    return res.status(200).json({
      success: true,
      message: "Banner uploaded successfully",
      bannerUrl,
      event,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Banner upload failed",
    });
  }
};

export const generateDescription = async (req, res) => {
  try {
    const { title, category, club, targetAudience, keyHighlights } = req.body;
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Event title is required for AI generation",
      });
    }

    const description = await generateEventDescription({
      title,
      category,
      club: club || req.user?.clubName || "Campus Club",
      targetAudience,
      keyHighlights,
    });

    return res.status(200).json({
      success: true,
      description,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "AI generation failed",
    });
  }
};

export const exportEventAttendeesCSV = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const registrations = await Registration.find({
      event: id,
      status: { $in: ["BOOKED", "CHECKED_IN"] },
    })
      .populate("student", "name email role")
      .sort({ createdAt: 1 });

    const headers = [
      "Ticket Code",
      "Student Name",
      "Student Email",
      "Seat Number",
      "Admission Status",
      "Registration Date",
      "Checked-In Timestamp",
    ];

    const escapeCSV = (str) => {
      if (!str) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = registrations.map((reg) => [
      escapeCSV(reg.ticketCode),
      escapeCSV(reg.student?.name || "Attendee"),
      escapeCSV(reg.student?.email || ""),
      escapeCSV(reg.seatLabel || "General"),
      escapeCSV(reg.status),
      escapeCSV(new Date(reg.createdAt).toLocaleString()),
      escapeCSV(
        reg.checkedInAt
          ? new Date(reg.checkedInAt).toLocaleString()
          : "Not Checked In",
      ),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\r\n");

    const cleanFilename = event.title.replace(/[^a-zA-Z0-9_-]/g, "_");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${cleanFilename}_Attendees.csv"`,
    );

    return res.send(csvContent);
  } catch (error) {
    console.error("[Export CSV Error]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export attendee roster",
    });
  }
};

export const assignVolunteerToEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Volunteer email address is required",
      });
    }

    const event = await Event.findById(id);
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
        message: "Not authorized to manage volunteers for this event",
      });
    }

    const volunteerUser = await User.findOne({ email: email.toLowerCase() });
    if (!volunteerUser) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    if (volunteerUser.role === "student") {
      volunteerUser.role = "volunteer";
      await volunteerUser.save();
    }

    if (
      !event.volunteers.some(
        (v) => v.toString() === volunteerUser._id.toString(),
      )
    ) {
      event.volunteers.push(volunteerUser._id);
      await event.save();
    }

    const populatedEvent = await Event.findById(id).populate(
      "volunteers",
      "name email role",
    );

    return res.status(200).json({
      success: true,
      message: `${volunteerUser.name} assigned as scanner volunteer!`,
      volunteers: populatedEvent.volunteers,
    });
  } catch (error) {
    console.error("[Assign Volunteer Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to assign volunteer",
    });
  }
};

export const removeVolunteerFromEvent = async (req, res) => {
  try {
    const { id, volunteerId } = req.params;

    const event = await Event.findById(id);
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
        message: "Not authorized to manage volunteers for this event",
      });
    }

    event.volunteers = event.volunteers.filter(
      (v) => v.toString() !== volunteerId.toString(),
    );
    await event.save();

    const otherActiveEvents = await Event.countDocuments({
      _id: { $ne: event._id },
      volunteers: volunteerId,
      status: "PUBLISHED",
      date: { $gte: new Date() },
    });

    if (otherActiveEvents === 0) {
      await User.findByIdAndUpdate(volunteerId, { role: "student" });
    }

    const populatedEvent = await Event.findById(id).populate(
      "volunteers",
      "name email role",
    );

    return res.status(200).json({
      success: true,
      message: "Volunteer removed from event and permissions revoked",
      volunteers: populatedEvent.volunteers,
    });
  } catch (error) {
    console.error("[Remove Volunteer Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove volunteer",
    });
  }
};

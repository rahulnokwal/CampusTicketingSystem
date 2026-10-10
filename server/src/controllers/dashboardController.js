import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { Payment } from "../models/Payment.js";
import { CheckIn } from "../models/CheckIn.js";
import { User } from "../models/User.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const { role, userId } = req.user;

    if (role === "student") {
      const totalTickets = await Registration.countDocuments({
        student: userId,
        status: { $ne: "CANCELLED" },
      });

      const checkedInTickets = await Registration.countDocuments({
        student: userId,
        status: "CHECKED_IN",
      });

      const upcomingTickets = await Registration.find({
        student: userId,
        status: "BOOKED",
      })
        .populate("event")
        .sort({ createdAt: -1 })
        .limit(5);

      return res.status(200).json({
        success: true,
        role: "student",
        summary: {
          totalTickets,
          checkedInTickets,
          activeTickets: totalTickets - checkedInTickets,
        },
        recentTickets: upcomingTickets,
      });
    }

    if (role === "club_admin") {
      const myEvents = await Event.find({ createdBy: userId });
      const eventIds = myEvents.map((e) => e._id);

      const totalEvents = myEvents.length;
      const totalRegistrations = await Registration.countDocuments({
        event: { $in: eventIds },
        status: { $ne: "CANCELLED" },
      });

      const totalCheckedIn = await Registration.countDocuments({
        event: { $in: eventIds },
        status: "CHECKED_IN",
      });

      const revenueAgg = await Payment.aggregate([
        { $match: { event: { $in: eventIds }, status: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const totalRevenue = revenueAgg[0]?.total || 0;

      const recentRegistrations = await Registration.find({
        event: { $in: eventIds },
      })
        .populate("student", "name email")
        .populate("event", "title")
        .sort({ createdAt: -1 })
        .limit(8);

      return res.status(200).json({
        success: true,
        role: "club_admin",
        summary: {
          totalEvents,
          totalRegistrations,
          totalCheckedIn,
          totalRevenue,
          attendanceRate:
            totalRegistrations > 0
              ? Math.round((totalCheckedIn / totalRegistrations) * 100)
              : 0,
        },
        recentRegistrations,
        events: myEvents.slice(0, 5),
      });
    }

    if (role === "volunteer") {
      const totalScans = await CheckIn.countDocuments({ scannedBy: userId });
      const validScans = await CheckIn.countDocuments({
        scannedBy: userId,
        result: "VALID",
      });
      const duplicateScans = await CheckIn.countDocuments({
        scannedBy: userId,
        result: "ALREADY_USED",
      });
      const invalidScans = await CheckIn.countDocuments({
        scannedBy: userId,
        result: { $in: ["INVALID", "WRONG_EVENT"] },
      });

      const recentScans = await CheckIn.find({ scannedBy: userId })
        .populate("event", "title")
        .sort({ createdAt: -1 })
        .limit(10);

      return res.status(200).json({
        success: true,
        role: "volunteer",
        summary: {
          totalScans,
          validScans,
          duplicateScans,
          invalidScans,
        },
        recentScans,
      });
    }

    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments({
      status: { $ne: "CANCELLED" },
    });
    const totalCheckedIn = await Registration.countDocuments({
      status: "CHECKED_IN",
    });

    const revenueAgg = await Payment.aggregate([
      { $match: { status: "SUCCESS" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const recentEvents = await Event.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      role: "super_admin",
      summary: {
        totalUsers,
        totalEvents,
        totalRegistrations,
        totalCheckedIn,
        totalRevenue,
      },
      recentEvents,
    });
  } catch (error) {
    console.error("[Dashboard Summary Error]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard metrics",
    });
  }
};

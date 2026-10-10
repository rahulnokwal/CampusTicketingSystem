import { Registration } from "../models/Registration.js";
import { generateParticipationCertificate } from "../services/certificateService.js";

export const downloadCertificate = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const registration = await Registration.findById(registrationId)
      .populate("student", "name email")
      .populate("event", "title venue date club");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration record not found",
      });
    }

    const isOwner = registration.student._id.toString() === userId.toString();
    const isPrivileged = ["super_admin", "club_admin"].includes(userRole);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to download this credential",
      });
    }

    if (registration.status !== "CHECKED_IN") {
      return res.status(400).json({
        success: false,
        message:
          "Certificate is only available for attendees who checked in at the event venue.",
      });
    }

    const verificationUrl = `${req.protocol}://${req.get("host")}/api/certificates/verify/${registration.ticketCode}`;

    const pdfBuffer = await generateParticipationCertificate({
      studentName: registration.student?.name || "Student Attendee",
      eventTitle: registration.event?.title || "Campus Event",
      eventDate: registration.event?.date || new Date(),
      eventVenue: registration.event?.venue || "Campus Auditorium",
      clubName: registration.event?.club || "Campus Student Organization",
      ticketCode: registration.ticketCode,
      verificationUrl,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Certificate-${registration.ticketCode}.pdf"`,
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error) {
    console.error("[Certificate Generation Error]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate certificate PDF",
    });
  }
};

export const verifyCertificate = async (req, res) => {
  try {
    const { ticketCode } = req.params;

    const registration = await Registration.findOne({ ticketCode })
      .populate("student", "name email")
      .populate("event", "title venue date club");

    if (!registration || registration.status !== "CHECKED_IN") {
      return res.status(404).json({
        success: false,
        valid: false,
        message:
          "No verified attendance certificate found for this ticket code.",
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      credential: {
        ticketCode: registration.ticketCode,
        attendeeName: registration.student?.name,
        eventTitle: registration.event?.title,
        eventDate: registration.event?.date,
        eventVenue: registration.event?.venue,
        organizingClub: registration.event?.club,
        verifiedAt: registration.checkedInAt,
        status: "VERIFIED_ATTENDEE",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify credential",
    });
  }
};

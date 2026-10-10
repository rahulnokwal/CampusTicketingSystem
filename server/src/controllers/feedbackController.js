import { Feedback } from "../models/Feedback.js";
import { Registration } from "../models/Registration.js";
import { Event } from "../models/Event.js";
import {
  analyzeSingleFeedbackSentiment,
  generateEventSentimentReport,
} from "../services/aiService.js";

export const submitFeedback = async (req, res) => {
  try {
    const { registrationId, rating, review } = req.body;
    const studentId = req.user.userId;

    if (!registrationId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Registration ID and star rating (1-5) are required",
      });
    }

    const registration = await Registration.findOne({
      _id: registrationId,
      student: studentId,
    }).populate("event");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration pass not found or unauthorized",
      });
    }

    if (registration.status !== "CHECKED_IN") {
      return res.status(400).json({
        success: false,
        message: "Feedback can only be submitted after attending the event.",
      });
    }

    const existingFeedback = await Feedback.findOne({
      registration: registrationId,
    });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted feedback for this event ticket.",
      });
    }

    const sentimentAnalysis = await analyzeSingleFeedbackSentiment(
      review,
      Number(rating),
    );

    const feedback = await Feedback.create({
      event: registration.event._id,
      student: studentId,
      registration: registration._id,
      rating: Number(rating),
      review: review ? review.trim() : "",
      sentiment: sentimentAnalysis.sentiment,
      sentimentSummary: sentimentAnalysis.summary,
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! Your feedback has been recorded.",
      feedback,
    });
  } catch (error) {
    console.error("[Submit Feedback Error]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit event feedback",
    });
  }
};

export const getMyFeedbackForRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const studentId = req.user.userId;

    const feedback = await Feedback.findOne({
      registration: registrationId,
      student: studentId,
    });

    return res.status(200).json({
      success: true,
      hasSubmitted: !!feedback,
      feedback: feedback || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to check feedback status",
    });
  }
};

export const getEventFeedbackReport = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const feedbacks = await Feedback.find({ event: eventId })
      .populate("student", "name email")
      .sort({ createdAt: -1 });

    const sentimentReport = await generateEventSentimentReport(
      event.title,
      feedbacks,
    );

    return res.status(200).json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        club: event.club,
      },
      report: sentimentReport,
      feedbacks,
    });
  } catch (error) {
    console.error("[Feedback Report Error]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate sentiment analysis report",
    });
  }
};

import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
      unique: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    sentiment: {
      type: String,
      enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"],
      default: "NEUTRAL",
    },
    sentimentSummary: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export const Feedback = mongoose.model("Feedback", feedbackSchema);

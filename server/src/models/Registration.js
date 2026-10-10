import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
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
      index: true,
    },
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    qrPayload: {
      type: String,
      required: true,
    },
    qrDataUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "BOOKED", "CHECKED_IN", "CANCELLED"],
      default: "BOOKED",
      index: true,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    seatLabel: {
      type: String,
      default: "",
    },
    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

registrationSchema.index({ event: 1, student: 1 }, { unique: true });

export const Registration = mongoose.model("Registration", registrationSchema);

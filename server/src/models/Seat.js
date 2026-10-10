import mongoose from "mongoose";

const seatSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    seatLabel: {
      type: String,
      required: true,
      trim: true,
    },
    row: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: Number,
      required: true,
    },
    section: {
      type: String,
      enum: ["VIP", "General", "Balcony"],
      default: "General",
    },
    tierPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "HELD", "RESERVED"],
      default: "AVAILABLE",
      index: true,
    },
    heldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    heldUntil: {
      type: Date,
      default: null,
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

seatSchema.index({ event: 1, seatLabel: 1 }, { unique: true });
seatSchema.index({ event: 1, status: 1 });

export const Seat = mongoose.model("Seat", seatSchema);

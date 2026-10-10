import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    club: {
      type: String,
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    grossRevenue: {
      type: Number,
      required: true,
      default: 0,
    },
    platformFeeRate: {
      type: Number,
      default: 0.05,
    },
    platformFee: {
      type: Number,
      required: true,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    bankDetails: {
      accountHolder: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      bankName: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "DISBURSED", "REJECTED"],
      default: "PENDING",
    },
    transactionReference: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    disbursedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const Payout = mongoose.model("Payout", payoutSchema);

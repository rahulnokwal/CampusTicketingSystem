import mongoose from 'mongoose';

const checkInSchema = new mongoose.Schema(
  {
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      default: null,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ticketCode: {
      type: String,
      required: true,
    },
    result: {
      type: String,
      enum: ['VALID', 'ALREADY_USED', 'INVALID', 'WRONG_EVENT'],
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const CheckIn = mongoose.model('CheckIn', checkInSchema);


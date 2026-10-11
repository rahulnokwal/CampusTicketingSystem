import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    category: {
      type: String,
      enum: ['Tech', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Gaming', 'Other'],
      default: 'Tech',
    },
    venue: {
      type: String,
      required: [true, 'Venue location is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date and time is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Event capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    club: {
      type: String,
      required: [true, 'Club name is required'],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'],
      default: 'PUBLISHED',
      index: true,
    },
    banner: {
      type: String,
      default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    },
    requiresSeatSelection: {
      type: Boolean,
      default: false,
    },
    seatingConfiguration: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    registrationDeadline: {
      type: Date,
      default: null,
    },
    volunteers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ date: 1 });
eventSchema.index({ club: 1 });

export const Event = mongoose.model('Event', eventSchema);


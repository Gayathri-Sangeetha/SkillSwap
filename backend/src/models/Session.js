import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    learner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    skill: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      default: 60,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "in-progress"],
      default: "pending",
    },
    // REMOVED meetingLink - not needed since Stream handles calls in-app
    notes: {
      type: String,
      default: "",
    },
    learnerNotes: {
      type: String,
      default: "",
    },
    teacherNotes: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      default: "",
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancellationReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Index for faster queries
sessionSchema.index({ teacher: 1, status: 1 });
sessionSchema.index({ learner: 1, status: 1 });
sessionSchema.index({ scheduledDate: 1 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;
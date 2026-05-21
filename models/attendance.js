const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },       // Format: 'YYYY-MM-DD'
    timeIn: { type: Date, required: true },
    timeOut: { type: Date, default: null },
    duration: { type: Number, default: null },     // in minutes
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Enforce one attendance record per user per day at the DB level
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
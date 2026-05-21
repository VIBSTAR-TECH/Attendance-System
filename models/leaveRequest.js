const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: String, required: true }, // Format: 'YYYY-MM-DD'
    endDate: { type: String, required: true },
    reason: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "denied"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.LeaveRequest || mongoose.model("LeaveRequest", leaveRequestSchema);
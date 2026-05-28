const LeaveRequest = require("../models/LeaveRequest");
const { countLeaveDays, getDatesBetween } = require("../utils/leaveHelpers");

// ─────────────────────────────────────────────
// STAFF CONTROLLERS
// ─────────────────────────────────────────────

/**
 * POST /api/leave/request
 * Staff submits a new leave request
 */
const requestLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;

    const leaveDays = countLeaveDays(startDate, endDate);

    const leaveRequest = await LeaveRequest.create({
      userId: req.user._id,
      startDate,
      endDate,
      reason: reason || "",
      status: "pending",
    });

    res.status(201).json({
      message: "Leave request submitted successfully.",
      data: {
        ...leaveRequest.toObject(),
        totalLeaveDays: leaveDays,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit leave request.", error: error.message });
  }
};

/**
 * GET /api/leave/my-requests
 * Staff views all their own leave requests
 */
const getMyLeaveRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    const data = requests.map((leave) => ({
      ...leave.toObject(),
      totalLeaveDays: countLeaveDays(leave.startDate, leave.endDate),
    }));

    res.status(200).json({ total: data.length, data });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch leave requests.", error: error.message });
  }
};

/**
 * DELETE /api/leave/cancel/:id
 * Staff cancels their own pending leave request
 */
const cancelLeaveRequest = async (req, res) => {
  try {
    const leave = await LeaveRequest.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        message: `Cannot cancel a leave request that has already been ${leave.status}.`,
      });
    }

    await leave.deleteOne();

    res.status(200).json({ message: "Leave request cancelled successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel leave request.", error: error.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN / MANAGER CONTROLLERS
// ─────────────────────────────────────────────

/**
 * GET /api/leave/all
 * Admin/Manager views all leave requests with optional filters
 */
const getAllLeaveRequests = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const requests = await LeaveRequest.find(filter)
      .populate("userId", "name email role")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    const data = requests.map((leave) => ({
      ...leave.toObject(),
      totalLeaveDays: countLeaveDays(leave.startDate, leave.endDate),
    }));

    res.status(200).json({ total: data.length, data });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch leave requests.", error: error.message });
  }
};

/**
 * PATCH /api/leave/approve/:id
 * Admin/Manager approves a leave request
 */
const approveLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        message: `Leave request has already been ${leave.status}.`,
      });
    }

    leave.status = "approved";
    leave.reviewedBy = req.user._id;
    await leave.save();

    res.status(200).json({
      message: "Leave request approved.",
      data: {
        ...leave.toObject(),
        totalLeaveDays: countLeaveDays(leave.startDate, leave.endDate),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to approve leave request.", error: error.message });
  }
};

/**
 * PATCH /api/leave/deny/:id
 * Admin/Manager denies a leave request
 */
const denyLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        message: `Leave request has already been ${leave.status}.`,
      });
    }

    leave.status = "denied";
    leave.reviewedBy = req.user._id;
    await leave.save();

    res.status(200).json({ message: "Leave request denied.", data: leave });
  } catch (error) {
    res.status(500).json({ message: "Failed to deny leave request.", error: error.message });
  }
};

/**
 * DELETE /api/leave/delete/:id
 * Admin/Manager deletes any leave request
 */
const deleteLeaveRequest = async (req, res) => {
  try {
    const leave = await LeaveRequest.findByIdAndDelete(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    res.status(200).json({ message: "Leave request deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete leave request.", error: error.message });
  }
};

module.exports = {
  requestLeave,
  getMyLeaveRequests,
  cancelLeaveRequest,
  getAllLeaveRequests,
  approveLeave,
  denyLeave,
  deleteLeaveRequest,
};
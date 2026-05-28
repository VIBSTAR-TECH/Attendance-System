const express = require("express");
const router = express.Router();

const {
  requestLeave,
  getMyLeaveRequests,
  cancelLeaveRequest,
  getAllLeaveRequests,
  approveLeave,
  denyLeave,
  deleteLeaveRequest,
} = require("../controllers/leaveController");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  validateLeaveDates,
  checkOverlappingLeave,
  checkAttendanceConflict,
} = require("../middleware/leaveMiddleware");

// ── Staff Routes ──────────────────────────────
router.post(
  "/request",
  protect,
  validateLeaveDates,
  checkOverlappingLeave,
  checkAttendanceConflict,
  requestLeave
);
router.get("/my-requests", protect, getMyLeaveRequests);
router.delete("/cancel/:id", protect, cancelLeaveRequest);

// ── Admin / Manager Routes ────────────────────
router.get("/all", protect, adminOnly, getAllLeaveRequests);
router.patch("/approve/:id", protect, adminOnly, approveLeave);
router.patch("/deny/:id", protect, adminOnly, denyLeave);
router.delete("/delete/:id", protect, adminOnly, deleteLeaveRequest);

module.exports = router;
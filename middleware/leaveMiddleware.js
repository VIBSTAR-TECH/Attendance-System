const LeaveRequest = require("../models/LeaveRequest");
const Attendance = require("../models/Attendance");
const { datesOverlap, getDatesBetween, isSunday } = require("../utils/leaveHelpers");

/**
 * Validates the leave request date range:
 * - startDate must not be in the past
 * - endDate must not be before startDate
 * - Range must not be all Sundays
 */
const validateLeaveDates = (req, res, next) => {
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: "startDate and endDate are required." });
  }

  const today = new Date().toISOString().split("T")[0];

  if (startDate < today) {
    return res.status(400).json({ message: "Leave start date cannot be in the past." });
  }

  if (endDate < startDate) {
    return res.status(400).json({ message: "End date cannot be before start date." });
  }

  // Check that the range isn't entirely Sundays
  const dates = getDatesBetween(startDate, endDate);
  const allSundays = dates.every((d) => isSunday(d));
  if (allSundays) {
    return res.status(400).json({ message: "Leave range falls only on Sundays. No working days selected." });
  }

  next();
};

/**
 * Blocks a new leave request if the user already has a
 * pending or approved leave that overlaps with the requested dates
 */
const checkOverlappingLeave = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.user._id;

    const existingLeaves = await LeaveRequest.find({
      userId,
      status: { $in: ["pending", "approved"] },
    });

    const hasOverlap = existingLeaves.some((leave) =>
      datesOverlap(startDate, endDate, leave.startDate, leave.endDate)
    );

    if (hasOverlap) {
      return res.status(400).json({
        message: "You already have a pending or approved leave that overlaps with these dates.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Error checking leave overlap.", error: error.message });
  }
};

/**
 * Blocks a leave request if the user already has an
 * attendance record (clocked in) on any of the requested dates
 */
const checkAttendanceConflict = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.user._id;

    const dates = getDatesBetween(startDate, endDate);

    const conflict = await Attendance.findOne({
      userId,
      date: { $in: dates },
    });

    if (conflict) {
      return res.status(400).json({
        message: `You have an existing attendance record on ${conflict.date}. Leave cannot be requested for a day you already clocked in.`,
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Error checking attendance conflict.", error: error.message });
  }
};

module.exports = { validateLeaveDates, checkOverlappingLeave, checkAttendanceConflict };
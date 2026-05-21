const Attendance = require("../models/Attendance");
const PublicHoliday = require("../models/PublicHoliday");
const { getTodayDate } = require("../utils/attendanceHelpers");

// Blocks clock-in if user already has a record for today
const checkAlreadyClockedIn = async (req, res, next) => {
  try {
    const today = getTodayDate();
    const existing = await Attendance.findOne({ userId: req.user._id, date: today });

    if (existing) {
      const msg =
        existing.status === "completed"
          ? "You have already completed your attendance for today. Re-sign-in is not allowed."
          : "You are already clocked in for today.";
      return res.status(400).json({ message: msg });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error during clock-in check." });
  }
};

// Blocks clock-in on Sundays and public holidays
const checkLeaveDay = async (req, res, next) => {
  try {
    const today = getTodayDate();
    const dayOfWeek = new Date().getDay(); // 0 = Sunday

    if (dayOfWeek === 0) {
      return res.status(400).json({ message: "Today is Sunday. No clock-in required." });
    }

    const holiday = await PublicHoliday.findOne({ date: today });
    if (holiday) {
      return res.status(400).json({
        message: `Today is a public holiday (${holiday.name}). No clock-in required.`,
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error during leave day check." });
  }
};

module.exports = { checkAlreadyClockedIn, checkLeaveDay };
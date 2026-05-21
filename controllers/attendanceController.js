const Attendance = require("../models/attendance");
const LeaveRequest = require("../models/leaveRequest");
const PublicHoliday = require("../models/publicHoliday");
const { getTodayDate, formatDuration, countWorkingDaysInMonth } = require("../utils/attendanceHelpers");

// POST /api/attendance/clock-in
const clockIn = async (req, res) => {
  try {
    const today = getTodayDate();

    const record = await Attendance.create({
      userId: req.user._id,
      date: today,
      timeIn: new Date(),
      status: "active",
    });

    res.status(201).json({ message: "Clock-in successful.", data: record });
  } catch (error) {
    // Handle MongoDB unique index violation (duplicate clock-in)
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already clocked in today." });
    }
    res.status(500).json({ message: "Clock-in failed.", error: error.message });
  }
};

// POST /api/attendance/clock-out
const clockOut = async (req, res) => {
  try {
    const today = getTodayDate();

    const record = await Attendance.findOne({ userId: req.user._id, date: today });

    if (!record) {
      return res.status(400).json({ message: "You have not clocked in today." });
    }

    if (record.status === "completed") {
      return res.status(400).json({
        message: "You have already clocked out. You cannot re-sign in for today.",
      });
    }

    const timeOut = new Date();
    const duration = Math.floor((timeOut - record.timeIn) / (1000 * 60)); // in minutes

    record.timeOut = timeOut;
    record.duration = duration;
    record.status = "completed";
    await record.save();

    res.status(200).json({
      message: "Clock-out successful.",
      data: {
        ...record.toObject(),
        durationFormatted: formatDuration(duration),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Clock-out failed.", error: error.message });
  }
};

// GET /api/attendance/status
// Returns today's attendance status for the logged-in user
const getTodayStatus = async (req, res) => {
  try {
    const today = getTodayDate();
    const record = await Attendance.findOne({ userId: req.user._id, date: today });

    if (!record) {
      return res.status(200).json({ status: "not-clocked-in", data: null });
    }

    res.status(200).json({
      status: record.status,
      data: {
        ...record.toObject(),
        durationFormatted: record.duration ? formatDuration(record.duration) : null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch status.", error: error.message });
  }
};

// GET /api/attendance/summary?year=2025&month=5
// Returns the monthly attendance summary for the logged-in user
const getMonthlySummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const userId = req.user._id;

    const monthStr = String(month).padStart(2, "0");
    const prefix = `${year}-${monthStr}`;

    // Days present (completed records)
    const presentRecords = await Attendance.find({
      userId,
      date: { $regex: `^${prefix}` },
      status: "completed",
    });

    // Approved leave requests overlapping this month
    const approvedLeave = await LeaveRequest.find({
      userId,
      status: "approved",
      startDate: { $lte: `${prefix}-31` },
      endDate: { $gte: `${prefix}-01` },
    });

    // Public holidays in this month
    const publicHolidays = await PublicHoliday.find({
      date: { $regex: `^${prefix}` },
    });

    const workingDays = countWorkingDaysInMonth(year, month);
    const daysPresent = presentRecords.length;
    const leaveDaysTaken = approvedLeave.length;
    const holidayCount = publicHolidays.length;
    const absentDays = workingDays - daysPresent - leaveDaysTaken - holidayCount;

    res.status(200).json({
      year,
      month,
      workingDays,
      daysPresent,
      approvedLeave: leaveDaysTaken,
      publicHolidays: holidayCount,
      absentDays: Math.max(absentDays, 0),
      records: presentRecords,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch summary.", error: error.message });
  }
};

// GET /api/attendance/all  [Admin/Manager only]
// Fetch all attendance records (with optional filters)
const getAllAttendance = async (req, res) => {
  try {
    const { userId, date, month, year } = req.query;
    const filter = {};

    if (userId) filter.userId = userId;
    if (date) filter.date = date;
    else if (year && month) {
      const monthStr = String(month).padStart(2, "0");
      filter.date = { $regex: `^${year}-${monthStr}` };
    }

    const records = await Attendance.find(filter)
      .populate("userId", "name email role")
      .sort({ date: -1 });

    res.status(200).json({ total: records.length, data: records });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch records.", error: error.message });
  }
};

module.exports = { clockIn, clockOut, getTodayStatus, getMonthlySummary, getAllAttendance };
const mongoose = require("mongoose");

const publicHolidaySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: 'YYYY-MM-DD'
  name: { type: String, required: true },
});

module.exports = mongoose.models.PublicHoliday || mongoose.model("PublicHoliday", publicHolidaySchema);
// Returns today's date as 'YYYY-MM-DD'
const getTodayDate = () => new Date().toISOString().split("T")[0];

// Converts minutes to a readable format e.g. "7h 30m"
const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

// Returns the number of Sundays in a given month/year
const countSundaysInMonth = (year, month) => {
  let count = 0;
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    if (date.getDay() === 0) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
};

// Returns the total working days (excluding Sundays) in a month
const countWorkingDaysInMonth = (year, month) => {
  const totalDays = new Date(year, month, 0).getDate();
  const sundays = countSundaysInMonth(year, month);
  return totalDays - sundays;
};

module.exports = { getTodayDate, formatDuration, countSundaysInMonth, countWorkingDaysInMonth };
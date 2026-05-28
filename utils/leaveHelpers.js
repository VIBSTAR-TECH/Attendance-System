/**
 * Generates an array of all date strings ('YYYY-MM-DD')
 * between a start and end date (inclusive)
 */
const getDatesBetween = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/**
 * Checks if a given date string falls on a Sunday
 */
const isSunday = (dateStr) => new Date(dateStr).getDay() === 0;

/**
 * Returns the total number of days in a leave request
 * excluding Sundays
 */
const countLeaveDays = (startDate, endDate) => {
  const dates = getDatesBetween(startDate, endDate);
  return dates.filter((d) => !isSunday(d)).length;
};

/**
 * Checks if two date ranges overlap
 */
const datesOverlap = (start1, end1, start2, end2) => {
  return start1 <= end2 && end1 >= start2;
};

module.exports = { getDatesBetween, isSunday, countLeaveDays, datesOverlap };
const getWorkWeekRange = (inputDate) => {
  const date = new Date(inputDate);
  const dayOfWeek = date.getDay();

  // Calculate the offset to the previous Friday
  const fridayOffset = dayOfWeek >= 5 ? dayOfWeek - 5 : 7 - (5 - dayOfWeek);

  // Calculate the offset to the following Thursday
  const thursdayOffset = dayOfWeek >= 5 ? 7 - (dayOfWeek - 4) : 4 - dayOfWeek;

  const friday = new Date(date);
  friday.setDate(date.getDate() - fridayOffset);

  const thursday = new Date(date);
  thursday.setDate(date.getDate() + thursdayOffset);

  const startDate = friday.toISOString();

  const endDate = thursday.toISOString();

  const range = { startDate, endDate };

  return range;
};

function arrayToObject(results) {
  const object = {};
  results.forEach((result) => {
    object[result._id] = {
      shifts: result.shifts,
      totalHours: result.totalHours,
    };
  });
  return object;
}

module.exports = { getWorkWeekRange };

const { Run } = require("../models/runModels");
const { JobItem, Job } = require("../models/jobModels");
const { TimeBlock } = require("../models/timeBlockModels");

const { getWorkWeekRange } = require("../modules/common");

const getUserScheduleWorkWeek = async (req, res) => {
  const date = req.params.date;
  const userId = req.params.userId;

  const { startDate, endDate } = getWorkWeekRange(date);

  console.log(`${startDate} - ${endDate}`);

  try {
    const shifts = await TimeBlock.find({
      itemId: userId,
      $or: [
        { start: { $gte: startDate, $lte: endDate } },
        { end: { $gte: startDate, $lte: endDate } },
        { start: { $lte: startDate }, end: { $gte: endDate } },
      ],
    }).select("start end contextType contextKey");

    // Enhance shifts with additional data
    const enhancedShifts = shifts.map((shift) => {
      const start = new Date(shift.start);
      const end = new Date(shift.end);

      // Calculate the length in hours
      const length = (end - start) / (1000 * 60 * 60);

      // Format start date as YYYY-MM-DD
      const date = start.toISOString().substring(0, 10);

      // Get the day name
      const day = start.toLocaleString("en-US", { weekday: "long" });

      // Return the enhanced shift object
      return {
        ...shift.toObject(), // Convert Mongoose document to plain object
        date,
        day,
        length,
      };
    });

    res.status(200).send(enhancedShifts);
  } catch (error) {
    console.error("Error retrieving availability from time blocks:", error);
    res.status(400).send("Error retrieving availability from time blocks");
  }
};

const getScheduleWorkWeek = async (req, res) => {
  const date = req.params.date;

  // Assuming getWorkWeekRange returns strings formatted as "YYYY-MM-DD"
  const { startDate, endDate } = getWorkWeekRange(date);

  console.log(`${startDate} - ${endDate}`);

  try {
    const pipeline = [
      {
        $match: {
          $or: [
            { contextType: "shopShift" },
            { contextType: "runShift" },
            { contextType: "jobShift" },
            { contextType: "timeOff" },
          ],
          $or: [
            { start: { $gte: new Date(startDate), $lte: new Date(endDate) } },
            { end: { $gte: new Date(startDate), $lte: new Date(endDate) } },
            {
              start: { $lte: new Date(startDate) },
              end: { $gte: new Date(endDate) },
            },
          ],
        },
      },
      {
        $project: {
          itemId: 1,
          start: 1,
          end: 1,
          contextType: 1,
          date: { $dateToString: { format: "%Y-%m-%d", date: "$start" } },
          day: {
            $switch: {
              branches: [
                {
                  case: { $eq: [{ $dayOfWeek: "$start" }, 1] },
                  then: "Sunday",
                },
                {
                  case: { $eq: [{ $dayOfWeek: "$start" }, 2] },
                  then: "Monday",
                },
                {
                  case: { $eq: [{ $dayOfWeek: "$start" }, 3] },
                  then: "Tuesday",
                },
                {
                  case: { $eq: [{ $dayOfWeek: "$start" }, 4] },
                  then: "Wednesday",
                },
                {
                  case: { $eq: [{ $dayOfWeek: "$start" }, 5] },
                  then: "Thursday",
                },
                {
                  case: { $eq: [{ $dayOfWeek: "$start" }, 6] },
                  then: "Friday",
                },
                {
                  case: { $eq: [{ $dayOfWeek: "$start" }, 7] },
                  then: "Saturday",
                },
              ],
              default: "Unknown",
            },
          },
          shiftLength: {
            $divide: [{ $subtract: ["$end", "$start"] }, 3600000],
          },
        },
      },
      {
        $group: {
          _id: "$itemId",
          shifts: {
            $push: {
              start: "$start",
              end: "$end",
              contextType: "$contextType",
              date: "$date",
              day: "$day",
              shiftLength: "$shiftLength",
            },
          },
          totalHours: {
            $sum: {
              $cond: {
                if: { $ne: ["$contextType", "timeOff"] },
                then: "$shiftLength",
                else: 0,
              },
            },
          },
        },
      },
    ];

    const results = await TimeBlock.aggregate(pipeline);

    function getDayName(date) {
      return date.toLocaleString("en-US", { weekday: "long" }); // or any other locale you prefer
    }

    const processShifts = (data) => {
      const processedData = data.map((item) => {
        const processedShifts = item.shifts.flatMap((shift) => {
          if (shift.contextType === "timeOff" && shift.shiftLength > 24) {
            const segments = [];
            let start = new Date(shift.start);
            const end = new Date(shift.end);

            while (start < end) {
              const nextDay = new Date(start);
              nextDay.setDate(nextDay.getDate() + 1);
              nextDay.setHours(0, 0, 0, 0); // Midnight, start of the next day

              const segmentEnd = nextDay > end ? end : nextDay;
              const durationHours = Math.min(
                24,
                (segmentEnd - start) / (1000 * 3600)
              );
              const dayName = getDayName(start);

              segments.push({
                ...shift,
                start: new Date(start),
                end: new Date(segmentEnd),
                day: dayName, // Update day name based on the start date
                shiftLength: durationHours,
              });

              start = segmentEnd;
            }
            return segments;
          } else {
            // Update day name for non-split shifts as well
            return {
              ...shift,
              day: getDayName(new Date(shift.start)),
            };
          }
        });

        // Recalculate total hours excluding timeOff
        const totalHours = processedShifts.reduce((sum, curr) => {
          return sum + (curr.contextType !== "timeOff" ? curr.shiftLength : 0);
        }, 0);

        return {
          ...item,
          shifts: processedShifts,
          totalHours,
        };
      });

      return processedData;
    };

    const processedShifts = processShifts(results);
    // console.log(processedShifts);

    function transformResultsToMap(results) {
      const resultsMap = {};
      results.forEach((result) => {
        resultsMap[result._id] = {
          shifts: result.shifts,
          totalHours: result.totalHours,
        };
      });
      return resultsMap;
    }

    const processedObject = transformResultsToMap(processedShifts);
    const objResults = transformResultsToMap(results);
    // console.log(objResults);

    res.status(200).send(processedObject);
  } catch (error) {
    console.error("Error during aggregation:", error);
    res.status(400).send("Error retrieving availability from time blocks");
  }
};

module.exports = {
  getUserScheduleWorkWeek,
  getScheduleWorkWeek,
};

const { encodedCredentials } = require("../modules/credentials");
const axios = require("axios");
const { Run, Operation } = require("../models/runModels");
const { TimeBlock } = require("../models/timeBlockModels");
const { runFilemakerScript } = require("../modules/filemakerModules");

const getRunData = async (req, res) => {
  const date = new Date(req.params.date);

  try {
    const aggregatedData = await TimeBlock.aggregate([
      {
        $match: {
          contextType: "runShift", // Filter TimeBlocks where contextType is 'runShift'
          start: { $gte: date },
        },
      },
      {
        $lookup: {
          from: "runs", // This should match the MongoDB collection name for runs
          localField: "contextKey", // This should match the runNumber in the Run collection
          foreignField: "runNumber",
          as: "runDetails", // The output array field that will contain the joined documents
        },
      },
      {
        $unwind: {
          path: "$runDetails", // Unwind the runDetails to not work with arrays
          preserveNullAndEmptyArrays: true, // Keep TimeBlocks even if there are no matching Runs
        },
      },
      {
        $group: {
          _id: "$contextKey", // Group by contextKey which is the runNumber
          totalShifts: { $sum: 1 }, // Count the number of TimeBlocks per Run
          runs: { $first: "$runDetails" }, // Get the first runDetail since all are identical for one group
          shifts: {
            $push: {
              itemId: "$itemId",
              start: "$start",
              end: "$end",
              locationId: "$locationId",
            },
          }, // Collect all TimeBlocks information in an array
        },
      },
    ]);

    // const result = await TimeBlock.find({
    //   contextType: "runShift",
    //   start: { $gt: date },
    // });

    // if (!result) {
    //   console.log("no items found");
    //   return;
    // }

    console.log(aggregatedData);
    res.status(200).send(aggregatedData);
  } catch (error) {
    console.log(error);
    res.status(400).send("error retriving records");
  }
};

const runExport = async (req, res) => {
  const runData = req.body;
  const { runNumber, data, fmRecordId } = runData;
  const { start, end, crewType, date, vehicles, operations, shifts } = data;

  try {
    const run = await Run.findOneAndUpdate(
      { fmRecordId: fmRecordId },
      { $set: { runNumber, date, start, end, crewType, vehicles } },
      { new: true, upsert: true }
    );

    const runId = run._id;

    if (operations) {
      await Promise.all(
        operations.map(async (op) => {
          await Operation.findOneAndUpdate(
            { fmRecordId: op.fmRecordId },
            {
              $set: {
                operation: op.operation,
                arrival: op.arrival,
                departure: op.departure,
                jobNumber: op.jobNumber,
                runNumber,
              },
            },
            { new: true, upsert: true }
          );
        })
      );
    }

    if (shifts) {
      await Promise.all(
        shifts.map(async (shift) => {
          await TimeBlock.findOneAndUpdate(
            { fmRecordId: shift.fmRecordId },
            {
              $set: {
                itemId: null,
                start: shift.timeIn,
                end: shift.timeOut,
                contextKey: runId,
                contextType: "runShift",
                // locationId:
                //   shift.meetLocation !== "null" ? shift.meetLocation : null,
              },
            },
            { new: true, upsert: true }
          );
        })
      );
    }

    console.log("run");
    res.status(200).send("Successfully exported data");
  } catch (error) {
    console.log(shifts, error);
    res.status(500).send("data export failed");
  }
};

const runExportTimeblock = async (req, res) => {
  const runData = req.body;
  const { runNumber, data, fmRecordId } = runData;
  const { start, end, crewType, vehicles, operations, shifts } = data;

  try {
    await Run.findOneAndUpdate(
      { fmRecordId: fmRecordId },
      { $set: { runNumber, crewType, vehicles } },
      { new: true, upsert: true }
    );
    await TimeBlock.findOneAndUpdate(
      { fmRecordId: fmRecordId },
      {
        $set: {
          itemId: null,
          start: start,
          end: end,
          contextKey: runNumber,
          contextType: "run",
          locationId: null,
        },
      },
      { new: true, upsert: true }
    );

    if (operations) {
      await Promise.all(
        operations.map(async (op) => {
          await Operation.findOneAndUpdate(
            { fmRecordId: op.fmRecordId },
            {
              $set: {
                operation: op.operation,
                jobNumber: op.jobNumber,
                runNumber,
              },
            },
            { new: true, upsert: true }
          );
          await TimeBlock.findOneAndUpdate(
            { fmRecordId: op.fmRecordId },
            {
              $set: {
                itemId: null,
                start: op.arrival,
                end: op.departure,
                contextKey: runNumber,
                contextType: "operation",
                locationId: null,
              },
            },
            { new: true, upsert: true }
          );
        })
      );
    }

    if (shifts) {
      await Promise.all(
        shifts.map(async (shift) => {
          await TimeBlock.findOneAndUpdate(
            { fmRecordId: shift.fmRecordId },
            {
              $set: {
                itemId: shift.userId,
                start: shift.timeIn,
                end: shift.timeOut,
                contextKey: runNumber,
                contextType: "runShift",
                locationId: shift.meetLocation,
              },
            },
            { new: true, upsert: true }
          );
        })
      );
    }

    console.log("run exported");
    res.status(200).send("Successfully exported data");
  } catch (error) {
    console.log(error);
    res.status(500).send("data export failed");
  }
};

const deleteAll = async (req, res) => {
  try {
    const runResult = await Run.deleteMany({});
    const opResult = await Operation.deleteMany({});
    const shiftResult = await TimeBlock.deleteMany({ contextType: "runShift" });
    res.status(200).send(
      `${runResult.deletedCount} runs deleted,
    ${opResult.deletedCount} operations deleted,
    ${shiftResult.deletedCount} runShifts deleted
    `
    );
  } catch (error) {
    res.status(500).send(error);
  }
};

const triggerRunExport = async (req, res) => {
  try {
    const data = await runFilemakerScript(
      "Crew_Hours",
      "RunData_Export_to_Mongo_Bulk"
    );

    res.status(200).send(data);
  } catch (error) {
    res.status(400).send(error);
  }
};

const getJobWindowFromOperations = async (req, res) => {
  const { jobNumber } = req.params;

  try {
    const operations = await Operation.find({ jobNumber });

    if (operations.length === 0) {
      return res
        .status(404)
        .json({ message: "No operations found for this job number" });
    }

    let earliestArrival = null;
    let latestDeparture = null;

    operations.forEach((operation) => {
      const arrival = new Date(operation.arrival);
      let departure = operation.departure
        ? new Date(operation.departure)
        : null;

      if (!earliestArrival || arrival < earliestArrival) {
        earliestArrival = arrival;
      }

      if (!departure) {
        // If departure is null, add 1 hour to arrival
        departure = new Date(arrival.getTime() + 1 * 60 * 60 * 1000);
      }

      if (!latestDeparture || departure > latestDeparture) {
        latestDeparture = departure;
      }
    });

    res.status(200).json({
      jobNumber,
      earliestArrival,
      latestDeparture,
    });
  } catch (error) {
    console.log("error fetching job operations", error);
    res.status(500).send("Internal server error");
  }
};

module.exports = { getJobWindowFromOperations };

module.exports = {
  getRunData,
  runExport,
  deleteAll,
  triggerRunExport,
  getJobWindowFromOperations,
};

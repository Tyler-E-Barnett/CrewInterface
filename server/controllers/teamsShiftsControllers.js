require("dotenv").config({ path: "../.env" });
const axios = require("axios");
const { msGraphId } = require("../modules/credentials");
const { msToken } = require("../modules/msGetToken");
const { TimeBlock } = require("../models/timeBlockModels");
const { msIdToStaffIdScript } = require("../modules/filemakerModules");

const getShopShifts = async (req, res) => {
  const teamId = process.env.TECH_TEAM_ID;
  const date = new Date();
  const today = date.toISOString();

  console.log(teamId);

  try {
    const token = await msToken();

    const config = {
      method: "get",
      url: `https://graph.microsoft.com/v1.0/teams/${teamId}/schedule/shifts?$filter=sharedShift/startDateTime ge ${today}`,
      headers: {
        "MS-APP-ACTS-AS": msGraphId,
        Authorization: `Bearer ${token}`,
      },
    };

    // Fetch all shifts data
    const response = await axios(config);

    console.log(response);

    // // Filter shifts by theme and start date
    const shopShifts = response.data.value.filter((shift) => {
      return shift.sharedShift.theme === "blue";
    });

    res.status(200).send(shopShifts);
  } catch (error) {
    console.error(error.response.data.error);
    res.status(500).send("An error occurred while fetching shifts data.");
  }
};

const shopShiftsToTimeBlock = async (req, res) => {
  const teamId = process.env.TECH_TEAM_ID;

  const dateParam = req.params.date;
  const date = new Date(dateParam);
  const isoDate = date.toISOString();

  console.log(teamId);

  try {
    const token = await msToken();

    const config = {
      method: "get",
      url: `https://graph.microsoft.com/v1.0/teams/${teamId}/schedule/shifts?$filter=sharedShift/startDateTime ge ${isoDate}`,
      headers: {
        "MS-APP-ACTS-AS": msGraphId,
        Authorization: `Bearer ${token}`,
      },
    };

    // Fetch all shifts data
    const response = await axios(config);

    // Filter shifts by theme and start date
    const shopShifts = response.data.value.filter((shift) => {
      return shift.sharedShift.theme === "blue";
    });

    // console.log(shopShifts);

    async function createAndCountTimeBlocks(shopShifts) {
      let count = 0; // This will keep track of successfully updated or created time blocks

      const results = await Promise.all(
        shopShifts.map(async (shift) => {
          try {
            const itemId = await msIdToStaffIdScript(shift.userId); // Assuming this returns an ID or throws an error if not found
            const update = {
              $set: {
                itemId: itemId,
                start: shift.sharedShift.startDateTime,
                end: shift.sharedShift.endDateTime,
                contextType: "shopShift",
                locationId: "Warehouse",
              },
            };
            const options = { upsert: true, new: true };

            // Using updateOne with upsert to either update existing document or create a new one
            const result = await TimeBlock.updateOne(
              { contextKey: shift.id },
              update,
              options
            );
            if (result.upsertedCount > 0 || result.nModified > 0) {
              console.log(
                `TimeBlock for shift ID ${shift.id} has been created or updated`
              );
              return true;
            }
            return false;
          } catch (error) {
            console.error(
              `Failed to save TimeBlock for shift ID ${shift.id}: ${error}`
            );
            return false;
          }
        })
      );

      console.log(results);
      // Count the number of true values returned to determine the number of successful operations
      count = results.filter((result) => result === true).length;
      console.log(`Successfully created/updated ${count} TimeBlock(s).`);

      return count; // Return the count of successful operations
    }

    const count = await createAndCountTimeBlocks(shopShifts);

    res.status(200).send(`${count} timeblocks created from shop shifts`);
  } catch (error) {
    console.error(error);
    res
      .status(400)
      .send(
        "An error occurred while converting shifts data to timeblocks.",
        error
      );
  }
};

const getTimeOffs = async (req, res) => {
  const teamId = process.env.TECH_TEAM_ID;
  const graphUrl = "https://graph.microsoft.com/v1.0/teams/";

  try {
    const token = await msToken();
    const date = new Date();
    const today = date.toISOString();

    const toConfig = {
      method: "get",
      url: `${graphUrl}${teamId}/schedule/timesOff?$filter=sharedTimeOff/startDateTime ge ${today}`,
      headers: {
        "MS-APP-ACTS-AS": msGraphId,
        Authorization: `Bearer ${token}`,
      },
    };

    const reasonConfig = (rId) => ({
      method: "get",
      url: `https://graph.microsoft.com/v1.0/teams/${teamId}/schedule/timeOffReasons/${rId}`,
      headers: {
        "MS-APP-ACTS-AS": msGraphId,
        Authorization: `Bearer ${token}`,
      },
    });

    const nameConfig = (userId) => ({
      method: "get",
      url: `https://graph.microsoft.com/v1.0/users/${userId}`,
      headers: {
        "MS-APP-ACTS-AS": msGraphId,
        Authorization: `Bearer ${token}`,
      },
    });

    // let timeOffs;

    const result = await axios(toConfig);

    const timeOffData = result.data.value;
    console.log(timeOffData);

    // should start and end be new Date?

    const timeOffs = timeOffData.map((t) => ({
      shiftId: t.id,
      userId: t.userId,
      userName: "",
      approvedBy: t.lastModifiedBy.user.displayName,
      start: new Date(t.sharedTimeOff.startDateTime),
      end: new Date(t.sharedTimeOff.endDateTime),
      duration:
        (new Date(t.sharedTimeOff.endDateTime) -
          new Date(t.sharedTimeOff.startDateTime)) /
        86400000,
      timeOffReasonId: t.sharedTimeOff.timeOffReasonId,
      timeOffReason: "",
    }));

    console.log(timeOffs);

    const toData = async () => {
      const promises = timeOffs.map(async (item) => {
        // Fetch reason and name concurrently for each item
        const [reasonResult, nameResult] = await Promise.all([
          axios(reasonConfig(item.timeOffReasonId)).catch(() => ({
            data: { displayName: "Unlisted" },
          })),
          axios(nameConfig(item.userId)).catch(() => ({
            data: { displayName: "Unlisted" },
          })),
        ]);

        // Assign fetched or default values
        item.timeOffReason = reasonResult.data.displayName;
        item.userName = nameResult.data.displayName;

        // Filter and return items where userName is not "Unlisted"
        return item.userName !== "Unlisted" ? item : null;
      });

      // Resolve all promises and filter out nulls
      const results = await Promise.all(promises);
      return results.filter((item) => item !== null);
    };

    const toDataFinal = await toData();
    console.log(toDataFinal);
    res.status(200).send(toDataFinal);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const timeOffsToTimeBlock = async (req, res) => {
  const teamId = process.env.TECH_TEAM_ID;
  const dateParam = req.params.date;

  try {
    const token = await msToken();
    const date = new Date(dateParam);
    const isoDate = date.toISOString();

    const config = {
      method: "get",
      url: `https://graph.microsoft.com/v1.0/teams/${teamId}/schedule/timesOff?$filter=sharedTimeOff/startDateTime ge ${isoDate}`,
      headers: {
        "MS-APP-ACTS-AS": msGraphId,
        Authorization: `Bearer ${token}`,
      },
    };

    const result = await axios(config);

    const timeOffData = result.data.value;
    console.log(timeOffData);

    async function createAndCountTimeBlocks(data) {
      let count = 0; // This will keep track of successfully updated or created time blocks

      const results = await Promise.all(
        data.map(async (shift) => {
          try {
            const itemId = await msIdToStaffIdScript(shift.userId); // Assuming this returns an ID or throws an error if not found
            const update = {
              $set: {
                itemId: itemId,
                start: shift.sharedTimeOff.startDateTime,
                end: shift.sharedTimeOff.endDateTime,
                contextType: "timeOff",
                locationId: "Out of Office",
              },
            };
            const options = { upsert: true, new: true };

            // Using updateOne with upsert to either update existing document or create a new one
            const result = await TimeBlock.updateOne(
              { contextKey: shift.id },
              update,
              options
            );
            if (result.upsertedCount > 0 || result.nModified > 0) {
              console.log(
                `TimeBlock for shift ID ${shift.id} has been created or updated`
              );
              return true;
            }
            return false;
          } catch (error) {
            console.error(
              `Failed to save TimeBlock for shift ID ${shift.id}: ${error}`
            );
            return false;
          }
        })
      );

      //   console.log(results);
      // Count the number of true values returned to determine the number of successful operations
      count = results.filter((result) => result === true).length;
      console.log(`Successfully created/updated ${count} TimeBlock(s).`);

      return count; // Return the count of successful operations
    }

    const count = await createAndCountTimeBlocks(timeOffData);
    console.log(`${count} Time Off TimeBlocks created`);
    res.status(200).send(`${count} Time Off TimeBlocks created`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getShopShifts,
  getTimeOffs,
  shopShiftsToTimeBlock,
  timeOffsToTimeBlock,
};

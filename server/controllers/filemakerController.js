require("dotenv").config({ path: "../.env" });
const axios = require("axios");
const { FMLogin, FMLogout } = require("../modules/FileMakerLoginAndOut");
const { TimeBlock } = require("../models/timeBlockModels");
const { Assembly, Equipment } = require("../models/inventoryModels");
const {
  encodedCredentials,
  oDataUrl,
  fmServer,
} = require("../modules/credentials");

const ScriptResults = async (req, res) => {
  const { database, script } = req.body;

  try {
    // console.log(sessionId);

    const config = {
      url: `${oDataUrl}${database}/Script.${script}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
    };

    const scriptResponse = await axios(config);
    const data = scriptResponse.data.scriptResult.resultParameter;
    console.log(scriptResponse.data.scriptResult.resultParameter);

    console.log(scriptResponse);

    res.status(200).send(data);
  } catch (error) {
    console.error("Error running FileMaker script:", error);
    res.status(500).send("Error running FileMaker script");
  }
};

const CrewShifts = async (req, res) => {
  const database = "Crew_Hours";
  const script = "Crew_API_Shifts";
  const date = req.params.date;

  try {
    const config = {
      url: `${oDataUrl}${database}/Script.${script}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
      data: {
        scriptParameterValue: date,
      },
    };

    const result = await axios(config);

    const data = JSON.parse(result.data.scriptResult.resultParameter);

    // console.log(data);

    const totals = Object.keys(data).reduce((acc, initials) => {
      const totalShiftLength = data[initials].shifts.reduce(
        (sum, shift) => sum + (shift ? shift.shiftLength : 0),
        0
      );
      acc[initials] = totalShiftLength;
      return acc;
    }, {});

    const dataWithTotals = Object.keys(data).map(
      (item) => (data[item].totalHours = totals[item])
    );

    // console.log(data);

    res.send(data);
  } catch (error) {
    console.error("Error running FileMaker script:", error);
    res.status(500).send("Error running FileMaker script");
  }
};

const CrewPersonnel = async (req, res) => {
  const database = "Crew_Hours";
  const layout = "Personnel Crew Tech";

  // console.log("grabbing data...");

  try {
    const sessionId = await FMLogin(database, "Personnel");

    const data = {
      query: [{ "Flag Crew Tech": 1 }],
    };

    const config = {
      url: `https://${fmServer}/fmi/data/v1/databases/${database}/layouts/${layout}/_find`,
      method: "POST",
      maxBodyLength: Infinity,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionId}`,
      },
      data: data,
    };

    const response = await axios(config);

    const logOut = await FMLogout(database, sessionId);

    res.send(response.data.response);
  } catch (error) {
    console.error("Error grabbing crew data:", error.response.data.messages);
    res.status(500).send("Error fetching crew data");
  }
};

const getTimeBlocks = async (req, res) => {
  const database = req.params.database;
  const table = req.params.table;

  const filter = "?$filter=timeStampStart ge 2024-04-20T00:00:00Z";

  const config = {
    url: `${oDataUrl}/${database}/${table}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
  };

  try {
    const result = await axios(config);
    const data = result.data.value;

    const groupedData = data.reduce((acc, item) => {
      // If the itemId already exists in the accumulator, push the item to the existing array
      if (acc[item.itemId]) {
        acc[item.itemId].push(item);
      } else {
        // If the itemId does not exist, create a new array with the item
        acc[item.itemId] = [item];
      }
      return acc;
    }, {});

    // Convert the grouped data object to an array of objects
    const groupedDataArray = Object.keys(groupedData).map((itemId) => {
      return {
        itemId: itemId,
        items: groupedData[itemId],
      };
    });

    // console.log(groupedDataArray);

    res.status(200).send(groupedDataArray);
  } catch (error) {
    console.error("Error grabbing crew data:", error.response.data.messages);
    res.status(500).send("Error fetching timeBlocks");
  }
};

const getCrew = async (req, res) => {
  const filter = `?$filter="Flag Crew Tech" eq '1'`;
  const config = {
    url: `${oDataUrl}Personnel/Personnel${filter}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
  };

  try {
    const result = await axios(config);
    const data = result.data.value;
    console.log(data);
    res.status(200).send(data);
  } catch (error) {
    console.error("Error grabbing crew data:", error.response.data.messages);
    res.status(500).send("Error fetching crew data");
  }
};

const getPersonnel = async (req, res) => {
  const { id } = req.query;
  const filter = `?$filter=id eq ${id}`;
  const config = {
    url: `${oDataUrl}Personnel/Personnel${filter}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
  };

  try {
    const result = await axios(config);
    const data = result.data.value;
    console.log(data);
    res.status(200).send(data);
  } catch (error) {
    console.error("Error grabbing crew data:", error.response.data.messages);
    res.status(500).send("Error fetching personnel data");
  }
};

const getFacility = async (req, res) => {
  const { id } = req.query;
  const filter = `?$filter=id eq ${id}`;
  const config = {
    url: `${oDataUrl}EMS/facilities${filter}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
  };

  console.log(filter);
  try {
    const result = await axios(config);
    const data = result.data.value;
    console.log(data);
    res.status(200).send(data);
  } catch (error) {
    console.error("Error grabbing crew data:", error.response.data.error);
    res.status(500).send("Error fetching facility");
  }
};

const getEquipment = async (req, res) => {
  const { id, manufacturer, description } = req.query;

  const conditions = [];

  // Add conditions dynamically based on provided query parameters
  if (id) conditions.push(`"Inventory ID" eq ${id}`);
  if (manufacturer) conditions.push(`Manufacturer eq '${manufacturer}'`);
  if (description) conditions.push(`Description eq '${description}'`);

  // Join conditions with 'and' only if more than one condition exists
  const filter = conditions.length
    ? `?$filter=${conditions.join(" and ")}`
    : "";

  const config = {
    url: `${oDataUrl}Equipment_Inv/equipment${filter}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
  };

  console.log(filter);
  try {
    const result = await axios(config);
    const data = result.data.value;

    const filteredData = data.map((item) => ({
      id: item["Inventory ID"],
      description: item.Description,
      manufacturer: item.Manufacturer,
      modelNumber: item["Model #"],
      serialNumber: item["Serial #"],
      category: item["Category Department"],
    }));

    // console.log(filteredData);
    res.status(200).send(filteredData);
  } catch (error) {
    console.error("Error grabbing crew data:", error.response.data.error);
    res.status(500).send("Error fetching equipment");
  }
};

module.exports = {
  ScriptResults,
  CrewPersonnel,
  CrewShifts,
  getTimeBlocks,
  getPersonnel,
  getFacility,
  getEquipment,
  getCrew,
};

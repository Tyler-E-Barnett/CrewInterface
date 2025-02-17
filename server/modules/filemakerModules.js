const axios = require("axios");
const { encodedCredentials, oDataUrl } = require("./credentials");

const msIdToStaffId = async (userId) => {
  const filter = `?$filter=id eq ${userId}`;
  const config = {
    url: `${oDataUrl}Personnel/Personnel/${filter}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
  };
  try {
    const result = await axios(config);
    return result;
  } catch (error) {
    console.log("error converting msId to staffId", error);
  }
};

const msIdToStaffIdScript = async (userId) => {
  const config = {
    url: `${oDataUrl}Personnel/Script.msToStaffId`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    data: {
      scriptParameterValue: userId,
    },
  };
  try {
    const result = await axios(config);
    const data = JSON.parse(result.data.scriptResult.resultParameter);
    return data;
  } catch (error) {
    console.log("error converting msId to staffId", error.response.data.error);
    throw ("error converting msId to staffId", error.response.data.error);
  }
};

const runFilemakerScript = async (database, script) => {
  try {
    const config = {
      url: `${oDataUrl}${database}/Script.${script}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
    };

    console.log(database, script);

    const scriptResponse = await axios(config);
    const data = scriptResponse.data.scriptResult.resultParameter;

    console.log(scriptResponse);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = { msIdToStaffId, msIdToStaffIdScript, runFilemakerScript };

const {
  encodedCredentials,
  oDataUrl,
  msGraphId,
} = require("../modules/credentials");
const { TimeBlock } = require("../models/timeBlockModels");
const axios = require("axios");
const { msToken } = require("../modules/msGetToken");

const getUsername = async (req, res) => {
  const userId = req.params.userId;
  console.log(userId);
  try {
    const filter = `?$filter=id eq ${userId}`;
    const config = {
      url: `${oDataUrl}Personnel/Personnel/${filter}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
    };

    const result = await axios(config);
    const data = result.data.value[0]["Name First Last"];

    res.status(200).send(data);
  } catch (error) {
    console.log(error);
    res.status(400).send("error grabbing username from personnel");
  }
};

const getCrew = async (req, res) => {
  try {
    const config = {
      url: `${oDataUrl}Personnel/Script.crewList`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
    };

    const result = await axios(config);
    console.log(result);
    const data = result.data.scriptResult.resultParameter;
    const json = JSON.parse(data);

    res.status(200).send(json);
  } catch (error) {
    console.log(error);
    res.status(400).send("error getting crew from peronnel");
  }
};

const getNameFromMsId = async (req, res) => {
  const { userId } = req.params;

  console.log(userId);
  const token = await msToken();

  const config = {
    method: "get",
    url: `https://graph.microsoft.com/v1.0/users/${userId}`,
    headers: {
      "MS-APP-ACTS-AS": msGraphId,
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const result = await axios(config);
    res.status(200).send(result.data);
  } catch (error) {
    console.error(error.response.data.error);
    res.status(500).send("server Error");
  }
};

module.exports = { getUsername, getCrew, getNameFromMsId };

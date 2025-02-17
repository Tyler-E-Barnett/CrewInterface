require("dotenv").config({ path: "../.env" });
const { msAuthClientId } = require("../modules/credentials");
const axios = require("axios");

const msAuthUUID = (req, res) => {
  res.json({ uuid: msAuthClientId });
};

module.exports = { msAuthUUID };

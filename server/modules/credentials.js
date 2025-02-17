require("dotenv").config({ path: "../.env" });
const base64 = require("base-64");

const fmServerUrl = process.env.FM_SERVER_URL;
const fmServer = process.env.FM_SERVER;
const oDataUrl = process.env.FM_ODATA_URL;
const msGraphId = process.env.MS_GRAPH_ID;
const username = process.env.FM_USER;
const password = process.env.FM_PASSWORD;
const msAuthClientId = process.env.MS_AUTH_CLIENT_ID;

const encodedCredentials = base64.encode(`${username}:${password}`);

module.exports = {
  encodedCredentials,
  oDataUrl,
  msGraphId,
  fmServerUrl,
  fmServer,
  msAuthClientId,
};

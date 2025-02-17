require("dotenv").config({ path: "../.env" });
const axios = require("axios");

const tenantId = process.env.MS_TENANT_ID;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const msToken = async () => {
  try {
    const msLoginConfig = {
      method: "post",
      url: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      headers: {
        Host: "login.microsoftonline.com",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: {
        client_id: clientId,
        scope: "https://graph.microsoft.com/.default",
        client_secret: clientSecret,
        grant_type: "client_credentials",
      },
    };

    const result = await axios(msLoginConfig);
    const token = result.data.access_token;

    return token;
  } catch (error) {
    console.log("error fetching token");
    throw error;
  }
};

module.exports = { msToken };

const { encodedCredentials, fmServerUrl } = require("./credentials");
const axios = require("axios");

async function FMLogin(database, external) {
  const data = external
    ? {
        fmDataSource: [
          { database: external, username: username, password: password },
        ],
      }
    : null;

  try {
    // Authenticate with the FileMaker Data API

    const loginConfig = {
      url: `${fmServerUrl}/fmi/data/v1/databases/${database}/sessions`,
      method: "POST",
      maxBodyLength: Infinity,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
      ...data,
    };

    const authResponse = await axios(loginConfig);
    const sessionId = authResponse.data.response.token;

    return sessionId;
  } catch (error) {
    console.error("Error retrieving token", error.response.data.messages);
    throw ("token Error:", error);
  }
}

async function FMLogout(database, sessionId) {
  try {
    // Close the session
    await axios.delete(
      `${fmServerUrl}/fmi/data/v1/databases/${database}/sessions/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      }
    );
    console.log("Logged Out");
  } catch (error) {
    console.error(
      "Error logging out from FM Session: ",
      error.response.data.messages
    );
    throw error;
  }
}

module.exports = { FMLogin, FMLogout };

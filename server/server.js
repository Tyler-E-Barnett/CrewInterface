require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { apiRouter } = require("./routes");
const port = 3000; // You can choose any port that's not in use

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/api", apiRouter);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`, process.version);
});

require("dotenv").config();
const mongoose = require("mongoose");

const ldb = mongoose.createConnection(process.env.MONGO_URI_LOGISTICS, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
ldb.on(
  "error",
  console.error.bind(console, "connection error with logistics database:")
);
ldb.once("open", () => {
  console.log("Connected to logistics database");
});

const sdb = mongoose.createConnection(process.env.MONGO_URI_STAFFING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
sdb.on(
  "error",
  console.error.bind(console, "connection error with staffing database:")
);
sdb.once("open", () => {
  console.log("Connected to staffing database");
});

module.exports = { ldb, sdb };

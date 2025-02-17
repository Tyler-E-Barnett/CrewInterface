const mongoose = require("mongoose");
const { sdb } = require("../database");
const punchSchema = new mongoose.Schema({
  emsId: String,
  userId: String,
  name: String,
  timeStampIn: String,
  dateIn: String,
  timeIn: String,
  timeStampOut: String,
  dateOut: String,
  timeOut: String,
  runNumber: Number,
  locationIn: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  locationOut: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
});

// Check in Model
const Punch = sdb.model("Punch", punchSchema);

module.exports = { Punch };

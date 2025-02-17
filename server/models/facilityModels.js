const mongoose = require("mongoose");
const { ldb } = require("../database");

const FacilitySchema = new mongoose.Schema(
  {
    fmRecordId: { type: String, required: true },
    facilityName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    phone: { type: String, required: true },
    type: { type: String, required: true },
    zone: { type: String, required: true },
  },
  { timestamps: true }
);

const Facility = ldb.model("Facility", FacilitySchema);

module.exports = { Facility };

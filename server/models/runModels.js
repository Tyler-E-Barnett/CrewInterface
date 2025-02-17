const mongoose = require("mongoose");
const { ldb } = require("../database");

const RunSchema = new mongoose.Schema(
  {
    fmRecordId: { type: String, required: false },
    runNumber: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    date: { type: Date, required: true },
    crewType: { type: String, required: true },
    vehicles: [{ type: String, required: false }],
  },
  { timestamps: true }
);

const OperationSchema = new mongoose.Schema(
  {
    fmRecordId: { type: String, required: false },
    operation: { type: String, required: true },
    arrival: { type: Date, required: false },
    departure: { type: Date, required: false },
    jobNumber: { type: String, required: false },
    runNumber: { type: String, required: true },
  },
  { timestamps: true }
);

// use these if runs and operations should be timeblocks
// const RunSchema = new mongoose.Schema(
//   {
//     fmRecordId: { type: String, required: false },
//     runNumber: { type: String, required: true },
//     crewType: { type: String, required: true },
//     vehicles: [{ type: String, required: false }],
//   },
//   { timestamps: true }
// );

// const OperationSchema = new mongoose.Schema(
//   {
//     fmRecordId: { type: String, required: false },
//     operation: { type: String, required: true },
//     jobNumber: { type: String, required: false },
//   },
//   { timestamps: true }
// );

const Run = ldb.model("Run", RunSchema);
const Operation = ldb.model("Operation", OperationSchema);

module.exports = { Run, Operation };

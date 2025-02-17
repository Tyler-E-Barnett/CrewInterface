const mongoose = require("mongoose");
const { ldb } = require("../database");

const JobSchema = new mongoose.Schema(
  {
    fmRecordId: { type: String, required: true },
    jobId: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: { type: String, required: true },
    typeEvent: { type: String, required: true },
    clientId: { type: String, required: true },
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: true,
    },
    // facilityId: { type: String, required: true },
  },
  { timestamps: true }
);

JobSchema.statics.findByDateRange = async function (start, end) {
  return await this.find({
    $or: [
      {
        start: { $lte: new Date(end) }, // Time block starts on or before the end of the range
        end: { $gte: new Date(start) },
      },
    ],
  });
};

const JobItemsSchema = new mongoose.Schema(
  {
    codeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemCode",
      required: true,
    },

    quantity: { type: Number, required: true },
    pricing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PricingLevel",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
  },
  { timestamps: true }
);
// const JobItemsSchema = new mongoose.Schema(
//   {
//     codeId: { type: String, required: true },
//     // details: { type: String, required: true }, // populates on retrieval api/jobData/itemDetails
//     quantity: { type: Number, required: true },
//     pricing: { type: String, required: true },
//     jobId: { type: String, required: true },
//     // priceLevels: { type: Array, required: true }, // populates on retrieval api/pricelevel/id
//   },
//   { timestamps: true }
// );

const Job = ldb.model("Job", JobSchema);
const JobItem = ldb.model("JobItem", JobItemsSchema);

module.exports = { Job, JobItem };

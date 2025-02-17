const mongoose = require("mongoose");
const { ldb } = require("../database");

const TimeBlockSchema = new mongoose.Schema(
  {
    fmRecordId: { type: String, required: true },
    // Context Type refers to the type of Timeblock. This is critical as it is used to define the contextKey and itemId
    // Examples include runShift, jobShift and assignedEquipment
    contextType: { type: String, required: true },
    contextKey: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // This field won't have a ref because the reference type depends on contextType
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // This field won't have a ref because the reference type depends on contextType
    },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: false,
    },
    // locationId: { type: String, required: false },
  },
  { timestamps: true }
);

TimeBlockSchema.statics.findByItemId = function (id) {
  return this.findOne({ itemId: id });
};

TimeBlockSchema.statics.findByContext = async function (contextType, itemId) {
  return await this.find({ contextType, itemId });
};

TimeBlockSchema.statics.findByContextId = async function (
  contextType,
  contextKey
) {
  return await this.find({ contextType, contextKey });
};

TimeBlockSchema.statics.findByContextAndRange = async function (
  contextType,
  itemId,
  start,
  end
) {
  return await this.find({
    contextType,
    itemId,
    $or: [
      {
        start: { $lte: new Date(end) }, // Time block starts on or before the end of the range
        end: { $gte: new Date(start) }, // Time block ends on or after the start of the range
      },
    ],
  });
};

const TimeBlock = ldb.model("TimeBlock", TimeBlockSchema);

module.exports = { TimeBlock };

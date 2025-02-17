const mongoose = require("mongoose");
const { ldb } = require("../database");

const AssemblySchema = new mongoose.Schema(
  {
    fmRecordId: { type: String, required: true },
    id: { type: String, required: true },
    assemblyId: { type: String, required: true },
    description: { type: String, required: true },
    assemblyType: { type: String, required: true },
    status: { type: String, required: false },
    incidentals: { type: String, required: false },
    locaiton: { type: String, required: false },
    aisleOrArea: { type: String, required: false },
    bay: { type: String, required: false },
    shelfOrBin: { type: String, required: false },
    statusNotes: { type: String, required: false },
    notes: { type: String, required: false },
  },
  { timestamps: true }
);

AssemblySchema.statics.findByAssemblyType = function (assemblyType) {
  return this.find({ assemblyType });
};

const EquipmentSchema = new mongoose.Schema(
  {
    fmRecordId: { type: String, required: true },
    id: { type: String, required: true },
    assemblyId: { type: String, required: false },
    description: { type: String, required: true },
    status: { type: String, required: true },
    manufacturer: { type: String, required: true },
    model: { type: String, required: false },
    serialNumber: { type: String, required: false },
    catagory: { type: String, required: true },
    notes: { type: String, required: false },
    dimensions: { type: String, required: false },
    quantity: { type: Number, required: false },
  },
  { timestamps: true }
);

EquipmentSchema.statics.findByAssemblyId = function (assemblyId) {
  return this.find({ assemblyId });
};
EquipmentSchema.statics.findById = function (assemblyId) {
  return this.find({ assemblyId });
};

const EquipmentMapSchema = new mongoose.Schema(
  {
    fmRecordId: { type: String, required: true },
    genericId: { type: String, required: true },
    specificId: { type: String, required: true },
  },
  { timestamps: true }
);

const EquipmentMap = ldb.model("EquipmentMap", EquipmentMapSchema);
const Assembly = ldb.model("Assembly", AssemblySchema);
const Equipment = ldb.model("Equipment", EquipmentSchema);

module.exports = { Assembly, Equipment, EquipmentMap };

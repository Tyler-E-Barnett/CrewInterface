const mongoose = require("mongoose");
const { ldb } = require("../database");

// const ItemCodeSchema = new mongoose.Schema(
//   {
//     code: { type: String, required: true },
//     type: { type: String, required: true },
//     codeType: { type: String, required: true },
//     category: { type: String, required: true },
//     costingDepartment: { type: String, required: true },
//     contractDescription: { type: String, required: true },
//     clientNotes: { type: String, required: true },
//     tags: [{ type: String, required: true }],
//     subItems: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "SubItemCode",
//         required: true,
//       },
//     ],
//   },
//   { timestamps: true }
// );

// this will account for quantity of sub items but will need to address this
// in api calls that call item codes
//  will change to subItems[1].subItem and subItems[1].quantity
const ItemCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    type: { type: String, required: true },
    codeType: { type: String, required: true },
    category: { type: String, required: true },
    costingDepartment: { type: String, required: true },
    contractDescription: { type: String, required: true },
    clientNotes: { type: String, required: true },
    tags: [{ type: String, required: true }],
    subItems: [
      {
        subItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SubItemCode",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

const SubItemCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    category: { type: String, required: true },
    tags: [{ type: String, required: true }],
    assemblyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assembly",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

const PricingLevelNameSchema = new mongoose.Schema(
  {
    levelName: { type: String, required: true },
  },
  { timestamps: true }
);

// modified so level name would pull automatically
// modified so itemId is now _id ref for ItemCode
const PricingLevelSchema = new mongoose.Schema(
  {
    unitPriceCents: { type: Number, required: true }, // Store the price in cents
    basePrice: { type: Number, required: false }, // Store the price in cents
    baseAdjust: { type: Number, required: true }, // Store the price in cents
    baseDiscount: { type: Number, required: true }, // Store the price in cents
    unitAdjust: { type: Number, required: true }, // Store the price in cents
    unitDiscount: { type: Number, required: true }, // Store the price in cents
    defaultQuantity: { type: Number, required: true },
    minimumQuantity: { type: Number, required: false },
    maximumQuantity: { type: Number, required: false },
    clientDescription: { type: String, required: true },
    termFactor: {
      type: Map,
      of: Number,
      required: true,
      default: {
        "2D": 1,
        "3D": 1,
        BW: 1,
        FW: 1,
        "10D": 1,
        M: 1,
      },
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemCode",
      required: true,
    },
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PricingLevelName",
      required: true,
    },
  },
  { timestamps: true }
);
// const PricingLevelSchema = new mongoose.Schema(
//   {
//     unitPriceCents: { type: Number, required: true }, // Store the price in cents
//     defaultQuantity: { type: Number, required: true },
//     minimumQuantity: { type: Number, required: false },
//     itemId: { type: String, required: true },
//     level: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// Virtual for getting the unit price in dollars
PricingLevelSchema.virtual("unitPrice").get(function () {
  return (this.unitPriceCents / 100).toFixed(2);
});

// Virtual for setting the unit price in dollars
PricingLevelSchema.virtual("unitPrice").set(function (value) {
  this.unitPriceCents = value * 100;
});

// Ensure virtual fields are serialized
PricingLevelSchema.set("toJSON", { virtuals: true });
PricingLevelSchema.set("toObject", { virtuals: true });

const ItemCode = ldb.model("ItemCode", ItemCodeSchema);
const SubItemCode = ldb.model("SubItemCode", SubItemCodeSchema);
const PricingLevel = ldb.model("PricingLevel", PricingLevelSchema);
const PricingLevelName = ldb.model("PricingLevelName", PricingLevelNameSchema);

module.exports = { ItemCode, SubItemCode, PricingLevel, PricingLevelName };

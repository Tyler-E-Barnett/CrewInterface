const mongoose = require("mongoose");
const { JobItem, Job } = require("../models/jobModels");
const { TimeBlock } = require("../models/timeBlockModels");
const {
  ItemCode,
  SubItemCode,
  PricingLevel,
  PricingLevelName,
} = require("../models/itemCodeModels");
const { Assembly } = require("../models/inventoryModels");
const { Facility } = require("../models/facilityModels");
const axios = require("axios");
const ObjectId = mongoose.Types.ObjectId;

const jobExport = async (req, res) => {
  const jobData = req.body;

  const {
    fmRecordId,
    jobId,
    start,
    end,
    status,
    typeEvent,
    clientId,
    facilityId, // This is the facilityId which matches fmRecordId in Facility schema
    items,
    shifts,
  } = jobData;

  console.log(jobData);

  try {
    // Look up the facility using the facilityId (fmRecordId)
    const facility = await Facility.findOne({ fmRecordId: facilityId });
    if (!facility) {
      return res.status(404).send("Facility not found");
    }

    const facilityObjectId = facility._id;

    // Update the job record with the found facilityObjectId
    await Job.findOneAndUpdate(
      { fmRecordId },
      {
        $set: {
          jobId,
          start,
          end,
          status,
          typeEvent,
          clientId,
          facilityId: facilityObjectId,
        },
      },
      { new: true, upsert: true }
    );

    if (shifts) {
      await Promise.all(
        shifts.map(async (shift) => {
          await TimeBlock.findOneAndUpdate(
            { fmRecordId: shift.fmRecordId },
            {
              $set: {
                itemId: shift.id,
                start: shift.start,
                end: shift.end,
                contextKey: jobId,
                contextType: "jobShift",
                locationId: facilityObjectId, // Use the facilityObjectId here
              },
            },
            { new: true, upsert: true }
          );
        })
      );
    }

    res.status(200).send("Job data successfully exported and updated");
  } catch (error) {
    console.log("Error exporting job data", error);
    res.status(500).send("Error exporting job data");
  }
};

const deleteAll = async (req, res) => {
  try {
    const jobResult = await Job.deleteMany({});
    const itemResult = await JobItem.deleteMany({});
    const shiftResult = await TimeBlock.deleteMany({ contextType: "jobShift" });
    res.status(200).send(
      `${jobResult.deletedCount} jobs deleted,
    ${itemResult.deletedCount} items deleted,
    ${shiftResult.deletedCount} jobShifts deleted
    `
    );
  } catch (error) {
    res.status(500).send(error);
  }
};

const findJobItemsAssigned = async (req, res) => {
  const { contextType, contextKey } = req.params;

  console.log("Searching job items");

  // Determine the collection in the 'Inventory' database based on contextType
  const targetCollection =
    contextType === "jobAssembly" ? "assemblies" : "equipment";

  try {
    const result = await TimeBlock.aggregate([
      {
        $match: {
          contextKey: contextKey,
          contextType: contextType,
        },
      },
      {
        $lookup: {
          from: targetCollection, // Using the fully qualified namespace
          localField: "itemId",
          foreignField: "id",
          as: "details",
        },
      },
      {
        $unwind: {
          path: "$details",
          preserveNullAndEmptyArrays: true, // To keep items that do not match any document
        },
      },
      {
        $project: {
          // Optional: Customize output
          _id: 0,
          fmRecordId: 1,
          itemId: 1,
          start: 1,
          end: 1,
          details: 1,
        },
      },
    ]);

    res.status(200).send(result);
  } catch (error) {
    console.error("Error retrieving data:", error);
    res.status(500).send("Error retrieving data");
  }
};

// this uses params
const findJobsByDateRange = async (req, res) => {
  try {
    const jobs = await Job.findByDateRange(req.params.start, req.params.end);
    if (jobs.length === 0) {
      return res.status(200).send("No jobs found.");
    }
    res.status(200).send(jobs);
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
};

// make this master job lookup.  modify queries as needed.
// currently its just a date lookup

// const jobLookup = async (req, res) => {
//   try {
//     const { start, end, jobId } = req.query;

//     // Build the query object
//     const query = {};

//     console.log(start, end);

//     // Convert start and end to UTC dates
//     const startDate = new Date(start);
//     const endDate = new Date(end);

//     // Adjust the dates to cover the entire range for the specified date
//     startDate.setUTCHours(0, 0, 0, 0);
//     endDate.setUTCHours(23, 59, 59, 999);

//     // this finds any job that overlaps the range.
//     if (start && end) {
//       query.start = { $lte: endDate };
//       query.end = { $gte: startDate };
//     }

//     if (jobId) {
//       query.jobId = jobId;
//     }

//     // Find jobs based on the query and populate the facilityId field
//     const jobs = await Job.find(query).populate("facilityId");

//     res.status(200).json(jobs);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

const jobLookup = async (req, res) => {
  try {
    const { start, end, jobId } = req.query;

    // Convert start and end to UTC dates
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Adjust the dates to cover the entire range for the specified date
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    // Build the match query for jobs
    const matchQuery = {};

    if (start && end) {
      matchQuery.start = { $lte: endDate };
      matchQuery.end = { $gte: startDate };
    }

    if (jobId) {
      matchQuery.jobId = jobId;
    }

    // Aggregate to find jobs and their associated timeblocks
    const result = await Job.aggregate([
      { $match: matchQuery },
      // Lookup to populate the facilityId field
      {
        $lookup: {
          from: "facilities",
          localField: "facilityId",
          foreignField: "_id",
          as: "facility",
        },
      },
      { $unwind: "$facility" }, // Unwind the facility to get a single object
      // Lookup to find associated timeblocks
      {
        $lookup: {
          from: "timeblocks",
          localField: "_id",
          foreignField: "contextKey", // Assuming contextKey in TimeBlock refers to Job _id
          as: "timeblocks",
        },
      },
    ]);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// this may be too specialized.
// this is used in "old" item code entry which is too convoluted
const submitItemCodes = async (req, res) => {
  const {
    code,
    type,
    category,
    costingDepartment,
    contractDescription,
    tags,
    subItems,
  } = req.body;

  const normalizedCode = code.toLowerCase();

  try {
    // Check if ItemCode with the given code already exists
    let itemCode = await ItemCode.findOne({ code: normalizedCode });

    if (itemCode) {
      // Update existing ItemCode
      itemCode.type = type;
      itemCode.category = category;
      itemCode.costingDepartment = costingDepartment;
      itemCode.contractDescription = contractDescription;
      itemCode.tags = tags;

      // Handle subItems updates and creations
      const updatedSubItemIds = await Promise.all(
        subItems.map(async (subItem) => {
          let existingSubItem = await SubItemCode.findOne({
            code: subItem.code.toLowerCase(),
          });
          if (existingSubItem) {
            // Update existing SubItemCode
            existingSubItem.category = subItem.category;
            existingSubItem.tags = subItem.tags;
            existingSubItem.assemblyIds = subItem.assemblyIds;
            await existingSubItem.save();
            return existingSubItem._id;
          } else {
            // Create new SubItemCode
            const newSubItem = new SubItemCode({
              ...subItem,
              code: subItem.code.toLowerCase(),
            });
            const savedSubItem = await newSubItem.save();
            return savedSubItem._id;
          }
        })
      );

      itemCode.subItems = updatedSubItemIds;
      await itemCode.save();
    } else {
      // Create new ItemCode
      const subItemIds = await Promise.all(
        subItems.map(async (subItem) => {
          let existingSubItem = await SubItemCode.findOne({
            code: subItem.code.toLowerCase(),
          });
          if (existingSubItem) {
            // Update existing SubItemCode
            existingSubItem.category = subItem.category;
            existingSubItem.tags = subItem.tags;
            existingSubItem.assemblyIds = subItem.assemblyIds;
            await existingSubItem.save();
            return existingSubItem._id;
          } else {
            // Create new SubItemCode
            const newSubItem = new SubItemCode({
              ...subItem,
              code: subItem.code.toLowerCase(),
            });
            const savedSubItem = await newSubItem.save();
            return savedSubItem._id;
          }
        })
      );

      itemCode = new ItemCode({
        code: normalizedCode,
        type,
        category,
        costingDepartment,
        contractDescription,
        tags,
        subItems: subItemIds,
      });

      await itemCode.save();
    }

    res.status(200).json(itemCode);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error });
  }
};

const putItemCode = async (req, res) => {
  const {
    code,
    type,
    codeType,
    category,
    costingDepartment,
    contractDescription,
    clientNotes,
    tags,
    subItems,
  } = req.body;

  console.log(req.body);

  const normalizedCode = code.toLowerCase();

  try {
    const newCode = await ItemCode.findOneAndUpdate(
      { code },
      {
        $set: {
          code: normalizedCode,
          type,
          codeType,
          category,
          costingDepartment,
          contractDescription,
          clientNotes,
          tags,
          subItems,
        },
      },
      { new: true, upsert: true }
    );
    res.status(200).send(newCode);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error creating or updating item code");
  }
};

const putSubItemCode = async (req, res) => {
  const { code, category, tags, assemblyIds } = req.body;

  const normalizedCode = code.toLowerCase();

  console.log(normalizedCode);

  try {
    const newCode = await SubItemCode.findOneAndUpdate(
      { code },
      {
        $set: {
          code: normalizedCode,
          category,
          tags,
          assemblyIds,
        },
      },
      { new: true, upsert: true }
    );
    res.status(200).send(newCode);
  } catch (error) {
    res.status(500).send("Error creating or updating item code", error);
  }
};

const deleteItemCode = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItemCode = await ItemCode.findByIdAndDelete(id);

    if (!deletedItemCode) {
      return res.status(404).send("ItemCode not found");
    }

    // Delete associated PricingLevels
    await PricingLevel.deleteMany({ itemId: id });

    res.status(200).send(deletedItemCode);
  } catch (error) {
    res.status(500).send("Error deleting item code: " + error.message);
  }
};

const deleteSubItemCode = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSubItemCode = await SubItemCode.findByIdAndDelete(id);
    if (!deletedSubItemCode) {
      return res.status(404).send("SubItemCode not found");
    }
    res.status(200).send(deletedSubItemCode);
  } catch (error) {
    res.status(500).send("Error deleting sub-item code: " + error.message);
  }
};

const itemCodeLookup = async (req, res) => {
  const { itemCode } = req.params;
  const normalizedCode = itemCode.toLowerCase();

  try {
    // Find the item code and populate the subItems field with the corresponding sub-item documents
    const item = await ItemCode.findOne({ code: normalizedCode }).populate({
      path: "subItems",
      model: SubItemCode,
    });

    if (!item) {
      return res.status(404).send("Item doesn't exist");
    }

    res.status(200).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error });
  }
};

const itemCodeLookupById = async (req, res) => {
  const { id } = req.params;

  try {
    const objectId = new mongoose.Types.ObjectId(id);

    // Find the item code by its _id and populate the subItems field with the corresponding sub-item documents
    const item = await ItemCode.findById(objectId).populate({
      path: "subItems",
      model: SubItemCode,
    });

    if (!item) {
      return res.status(404).send("Item doesn't exist");
    }

    res.status(200).json(item);
  } catch (error) {
    console.error("Error fetching item by _id:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};

const subItemCodeLookup = async (req, res) => {
  const { id } = req.params;
  // console.log(id);
  try {
    const item = await SubItemCode.findById(id);

    if (!item) {
      return res.status(404).send("Item doesn't exist");
    }

    res.status(200).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error });
  }
};

const getAllItemCodes = async (req, res) => {
  try {
    const codes = await ItemCode.find();

    if (!codes) {
      return res.status(404).send("no item codes exist");
    }

    res.status(200).json(codes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error });
  }
};

const addPriceLevelName = async (req, res) => {
  try {
    const { levelName } = req.params;
    if (!levelName) {
      return res.status(400).json({ error: "LevelName is required" });
    }

    const newLevelName = new PricingLevelName({ levelName });
    await newLevelName.save();

    res.status(201).json(newLevelName);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getPriceLevelName = async (req, res) => {
  try {
    const { id, levelName } = req.query;

    let pricingLevel;
    if (id) {
      pricingLevel = await PricingLevelName.findById(id);
    } else if (levelName) {
      pricingLevel = await PricingLevelName.findOne({ levelName });
    } else {
      pricingLevel = await PricingLevelName.find(); // Return all pricing levels if no query is given
    }

    if (
      !pricingLevel ||
      (Array.isArray(pricingLevel) && pricingLevel.length === 0)
    ) {
      return res.status(404).json({ error: "PricingLevelName not found" });
    }

    res.status(200).json(pricingLevel);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// const priceLevelLookup = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const priceLevels = await PricingLevel.aggregate([
//       {
//         $match: { itemId: id },
//       },
//       {
//         $addFields: {
//           levelObjectId: { $toObjectId: "$level" },
//         },
//       },
//       {
//         $lookup: {
//           from: "pricinglevelnames",
//           localField: "levelObjectId",
//           foreignField: "_id",
//           as: "levelDetails",
//         },
//       },
//       {
//         $unwind: "$levelDetails",
//       },
//       {
//         $project: {
//           unitPriceCents: 1,
//           defaultQuantity: 1,
//           minimumQuantity: 1,
//           itemId: 1,
//           level: "$levelDetails._id",
//           levelName: "$levelDetails.levelName",
//         },
//       },
//     ]);

//     res.status(200).json(priceLevels);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Server Error: " + error);
//   }
// };

// modified 7/11/2024 for more concise lookup
const priceLevelLookup = async (req, res) => {
  const { id } = req.params;

  try {
    const priceLevels = await PricingLevel.find({ itemId: id }).populate({
      path: "level",
      select: "levelName",
    });

    // Transform the populated documents if needed
    // const transformedPriceLevels = priceLevels.map((priceLevel) => ({
    //   unitPriceCents: priceLevel.unitPriceCents,
    //   defaultQuantity: priceLevel.defaultQuantity,
    //   minimumQuantity: priceLevel.minimumQuantity,
    //   itemId: priceLevel.itemId,
    //   level: priceLevel.level._id,
    //   levelName: priceLevel.level.levelName,
    // }));

    // res.status(200).json(transformedPriceLevels);
    res.status(200).json(priceLevels);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error: " + error);
  }
};

const priceLevelDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await PricingLevel.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(200).json({ message: "Item deleted successfully", deletedItem });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const priceLevelDeleteMany = async (req, res) => {
  try {
    const { ids } = req.body; // expecting an array of IDs in the request body

    console.log("deleting pricing", ids);

    const deleteResult = await PricingLevel.deleteMany({ _id: { $in: ids } });

    if (deleteResult.deletedCount === 0) {
      console.log("no items found to delete");
      return res.status(404).json({ error: "No items found" });
    }

    console.log("item codes deleted: ", deleteResult);
    res
      .status(200)
      .json({ message: "Items deleted successfully", deleteResult });
  } catch (error) {
    console.error("Error deleting items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// updates/creates new pricing level.
// uses the pricing level name, looks up if it has an id then enters the pricing level with that id
// if there is no id, then it sends back an error.
// a pricinglevelname record must be created first
// const enterPriceLevel = async (req, res) => {
//   const pricingDataArray = req.body;

//   try {
//     const updatedPricingLevels = await Promise.all(
//       pricingDataArray.map(async (pricingData) => {
//         const { unitPrice, defaultQuantity, minimumQuantity, itemId, level } =
//           pricingData;

//         const pricingLevel = await PricingLevelName.findById(level);

//         if (!pricingLevel) {
//           throw new Error(`PricingLevelName '${level}' not found`);
//         }

//         const levelId = pricingLevel.id;

//         const newPricing = await PricingLevel.findOneAndUpdate(
//           { itemId, level },
//           {
//             $set: {
//               unitPriceCents: unitPrice * 100, // Convert unitPrice to unitPriceCents
//               defaultQuantity,
//               minimumQuantity,
//               itemId,
//               levelId,
//             },
//           },
//           { new: true, upsert: true }
//         );

//         return newPricing;
//       })
//     );

//     res.status(200).send(updatedPricingLevels);
//   } catch (error) {
//     console.error(error);
//     if (error.message.includes("PricingLevelName")) {
//       res.status(404).send({ error: error.message });
//     } else {
//       res.status(500).send({ error: "Internal server error" });
//     }
//   }
// };

const enterPriceLevel = async (req, res) => {
  const pricingDataArray = req.body;

  try {
    const updatedPricingLevels = await Promise.all(
      pricingDataArray.map(async (pricingData) => {
        const {
          unitPrice,
          defaultQuantity,
          minimumQuantity,
          itemId,
          level,
          basePrice,
          baseAdjust,
          baseDiscount,
          unitAdjust,
          unitDiscount,
          maximumQuantity,
          termFactor,
          clientDescription,
        } = pricingData;

        const newPricing = await PricingLevel.findOneAndUpdate(
          { itemId, level },
          {
            $set: {
              unitPriceCents: unitPrice * 100, // Convert unitPrice to unitPriceCents
              basePrice: basePrice * 100, // Convert basePrice to basePrice in cents
              baseAdjust: baseAdjust * 100, // Convert baseAdjust to baseAdjust in cents
              baseDiscount: baseDiscount * 100, // Convert baseDiscount to baseDiscount in cents
              unitAdjust: unitAdjust * 100, // Convert unitAdjust to unitAdjust in cents
              unitDiscount: unitDiscount * 100, // Convert unitDiscount to unitDiscount in cents
              defaultQuantity,
              minimumQuantity,
              maximumQuantity,
              termFactor,
              itemId,
              level,
              clientDescription,
            },
          },
          { new: true, upsert: true }
        );

        return newPricing;
      })
    );

    res.status(200).send(updatedPricingLevels);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
};

const getItemCodes = async (req, res) => {
  const { category, tags } = req.query;
  const query = {};

  if (category) {
    query.category = category;
  }

  if (tags) {
    const tagsArray = tags.split(",").map((tag) => tag.trim().toLowerCase());
    query.tags = { $all: tagsArray };
  }

  try {
    // If no category and tags are provided, return all item codes
    const itemCodes =
      Object.keys(query).length === 0
        ? await ItemCode.find().populate("subItems")
        : await ItemCode.find(query).populate("subItems");

    if (!itemCodes || itemCodes.length === 0) {
      return res.status(404).json({ error: "No item codes found" });
    }

    res.status(200).json(itemCodes);
  } catch (error) {
    console.error("Error fetching item codes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getSubItemCodes = async (req, res) => {
  const { category } = req.query;
  const query = {};

  if (category) {
    query.category = category;
  }

  try {
    // If no category and tags are provided, return all item sub codes
    const subItemCodes =
      Object.keys(query).length === 0
        ? await SubItemCode.find()
        : await SubItemCode.find(query);

    if (!subItemCodes || subItemCodes.length === 0) {
      return res.status(404).json({ error: "No item codes found" });
    }

    res.status(200).json(subItemCodes);
  } catch (error) {
    console.error("Error fetching item codes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// const getItemDetails = async (req, res) => {
//   const id = req.params.id;

//   try {
//     // Step 1: Find the ItemCode document by its ID
//     const item = await ItemCode.findById(id);
//     if (!item) {
//       return res.status(404).json({ message: "ItemCode not found" });
//     }

//     // Step 2: Aggregate to find all associated SubItemCodes and their assemblies
//     const result = await ItemCode.aggregate([
//       { $match: { _id: item._id } },
//       // Lookup to populate subItems from SubItemCode
//       {
//         $lookup: {
//           from: "subitemcodes",
//           localField: "subItems",
//           foreignField: "_id",
//           as: "subItems",
//         },
//       },
//       // Unwind the subItems array to handle each subItem separately
//       { $unwind: { path: "$subItems", preserveNullAndEmptyArrays: true } },
//       // Unwind the assemblyIds array in subItems to handle each ID separately
//       {
//         $unwind: {
//           path: "$subItems.assemblyIds",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       // Convert assemblyIds to ObjectId
//       {
//         $addFields: {
//           "subItems.assemblyIds": { $toObjectId: "$subItems.assemblyIds" },
//         },
//       },
//       // Lookup to populate assemblies from Assembly collection using assemblyIds
//       {
//         $lookup: {
//           from: "assemblies",
//           localField: "subItems.assemblyIds",
//           foreignField: "_id",
//           as: "subItems.assemblies",
//         },
//       },
//       // Group by subItem to collect all assemblies
//       {
//         $group: {
//           _id: "$subItems._id",
//           subItemCode: { $first: "$subItems.code" },
//           subItemCategory: { $first: "$subItems.category" },
//           subItemTags: { $first: "$subItems.tags" },
//           assemblies: { $push: "$subItems.assemblies" },
//           subItemCreatedAt: { $first: "$subItems.createdAt" },
//           subItemUpdatedAt: { $first: "$subItems.updatedAt" },
//           itemId: { $first: "$_id" },
//           itemCode: { $first: "$code" },
//           itemType: { $first: "$type" },
//           itemCategory: { $first: "$category" },
//           itemCostingDepartment: { $first: "$costingDepartment" },
//           itemContractDescription: { $first: "$contractDescription" },
//           itemTags: { $first: "$tags" },
//           itemCreatedAt: { $first: "$createdAt" },
//           itemUpdatedAt: { $first: "$updatedAt" },
//         },
//       },
//       // Group to collect all subItems back into the ItemCode document
//       {
//         $group: {
//           _id: "$itemId",
//           code: { $first: "$itemCode" },
//           type: { $first: "$itemType" },
//           category: { $first: "$itemCategory" },
//           costingDepartment: { $first: "$itemCostingDepartment" },
//           contractDescription: { $first: "$itemContractDescription" },
//           tags: { $first: "$itemTags" },
//           subItems: {
//             $push: {
//               _id: "$_id",
//               code: "$subItemCode",
//               category: "$subItemCategory",
//               tags: "$subItemTags",
//               assemblies: "$assemblies",
//               createdAt: "$subItemCreatedAt",
//               updatedAt: "$subItemUpdatedAt",
//             },
//           },
//           createdAt: { $first: "$itemCreatedAt" },
//           updatedAt: { $first: "$itemUpdatedAt" },
//         },
//       },
//     ]).exec();

//     if (!result.length) {
//       return res
//         .status(404)
//         .json({ message: "No sub-items or assemblies found" });
//     }

//     res.json(result[0]);
//   } catch (error) {
//     console.error("Error fetching item with assemblies:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// added 8-1-2024
const getItemDetails = async (req, res) => {
  const id = req.params.id;

  try {
    // Step 1: Find the ItemCode document by its ID and populate subItems and their assemblies
    const item = await ItemCode.findById(id)
      .populate({
        path: "subItems.subItem",
        populate: {
          path: "assemblyIds",
          model: "Assembly",
        },
      })
      .exec();

    if (!item) {
      return res.status(404).json({ message: "ItemCode not found" });
    }

    // Prepare the result in the required format
    const result = {
      _id: item._id,
      code: item.code,
      type: item.type,
      category: item.category,
      costingDepartment: item.costingDepartment,
      contractDescription: item.contractDescription,
      tags: item.tags,
      subItems: item.subItems.map((subItem) => ({
        _id: subItem.subItem._id,
        code: subItem.subItem.code,
        category: subItem.subItem.category,
        tags: subItem.subItem.tags,
        assemblies: subItem.subItem.assemblyIds,
        quantity: subItem.quantity,
        createdAt: subItem.subItem.createdAt,
        updatedAt: subItem.subItem.updatedAt,
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching item with assemblies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// const getSubItemDetails = async (req, res) => {
//   const id = req.params.id;

//   console.log(id);

//   try {
//     const objectId = new mongoose.Types.ObjectId(id);

//     const result = await SubItemCode.aggregate([
//       // Match the SubItemCode by its _id
//       { $match: { _id: objectId } },
//       // Unwind the assemblyIds array to handle each ID separately
//       { $unwind: { path: "$assemblyIds", preserveNullAndEmptyArrays: true } },
//       // Convert assemblyIds to ObjectId
//       {
//         $addFields: {
//           assemblyObjectId: { $toObjectId: "$assemblyIds" },
//         },
//       },
//       // Lookup to populate assemblies from Assembly collection using assemblyObjectId
//       {
//         $lookup: {
//           from: "assemblies",
//           localField: "assemblyObjectId",
//           foreignField: "_id",
//           as: "assemblyDetails",
//         },
//       },
//       // Group back to reassemble subItems and include assemblies
//       {
//         $group: {
//           _id: "$_id",
//           code: { $first: "$code" },
//           category: { $first: "$category" },
//           tags: { $first: "$tags" },
//           assemblies: { $push: { $arrayElemAt: ["$assemblyDetails", 0] } },
//           createdAt: { $first: "$createdAt" },
//           updatedAt: { $first: "$updatedAt" },
//         },
//       },
//     ]).exec(); // Execute the aggregation and return a promise

//     if (!result.length) {
//       return res.status(404).json({ message: "SubItemCode not found" });
//     }

//     res.json(result[0]);
//   } catch (error) {
//     console.error("Error fetching sub item with assemblies:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const getSubItemDetails = async (req, res) => {
  const id = req.params.id;

  console.log(id);

  try {
    const result = await SubItemCode.findById(id)
      .populate("assemblyIds")
      .exec();

    if (!result) {
      return res.status(404).json({ message: "SubItemCode not found" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching sub item with assemblies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getSubItemDetailsByCode = async (req, res) => {
  const code = req.params.code; // Assume code is passed as a URL parameter

  try {
    const result = await SubItemCode.aggregate([
      // Match the SubItemCode by its code
      { $match: { code: code } },
      // Unwind the assemblyIds array to handle each ID separately
      { $unwind: { path: "$assemblyIds", preserveNullAndEmptyArrays: true } },
      // Convert assemblyIds to ObjectId
      {
        $addFields: {
          assemblyObjectId: { $toObjectId: "$assemblyIds" },
        },
      },
      // Lookup to populate assemblies from Assembly collection using assemblyObjectId
      {
        $lookup: {
          from: "assemblies",
          localField: "assemblyObjectId",
          foreignField: "_id",
          as: "assemblyDetails",
        },
      },
      // Group back to reassemble subItems and include assemblies
      {
        $group: {
          _id: "$_id",
          code: { $first: "$code" },
          category: { $first: "$category" },
          tags: { $first: "$tags" },
          assemblyIds: { $first: "$assemblyIds" },
          assemblies: { $push: { $arrayElemAt: ["$assemblyDetails", 0] } },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
        },
      },
      // Remove empty objects in the assemblies array
      {
        $addFields: {
          assemblies: {
            $filter: {
              input: "$assemblies",
              as: "assembly",
              cond: { $ne: ["$$assembly", {}] },
            },
          },
        },
      },
    ]);

    if (!result.length) {
      return res.status(404).json({ message: "SubItemCode not found" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error fetching sub item with assemblies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 7-17-2024 added jobStart and jobEnd for overlap range
// start and end are now used to specify entire search range for timeblocks
// only those that overlap the jobStart and jobEnd will register as overlapped
// this is much faster
// const getItemDetailsWithTimeblocks = async (req, res) => {
//   const { id, start, end, jobStart, jobEnd, contextType, contextKey } =
//     req.body;

//   const startDate = new Date(start);
//   const endDate = new Date(end);
//   const jobStartDate = new Date(jobStart);
//   const jobEndDate = new Date(jobEnd);

//   console.log("Body Parameters:", {
//     id,
//     startDate,
//     endDate,
//     contextType,
//     contextKey,
//   });

//   try {
//     // Step 1: Find the ItemCode document by its ID
//     const item = await ItemCode.findById(id);
//     if (!item) {
//       return res.status(404).json({ message: "ItemCode not found" });
//     }

//     // Step 2: Aggregate to find all associated SubItemCodes, their assemblies, and timeblocks
//     const result = await ItemCode.aggregate([
//       { $match: { _id: item._id } },
//       // Lookup to populate subItems from SubItemCode
//       {
//         $lookup: {
//           from: "subitemcodes",
//           localField: "subItems",
//           foreignField: "_id",
//           as: "subItems",
//         },
//       },
//       // Unwind the subItems array to handle each subItem separately
//       { $unwind: { path: "$subItems", preserveNullAndEmptyArrays: true } },
//       // Unwind the assemblyIds array in subItems to handle each ID separately
//       {
//         $unwind: {
//           path: "$subItems.assemblyIds",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       // Convert assemblyIds to ObjectId
//       {
//         $addFields: {
//           "subItems.assemblyIds": { $toObjectId: "$subItems.assemblyIds" },
//         },
//       },
//       // Lookup to populate assemblies from Assembly collection using assemblyIds
//       {
//         $lookup: {
//           from: "assemblies",
//           localField: "subItems.assemblyIds",
//           foreignField: "_id",
//           as: "subItems.assemblies",
//         },
//       },
//       // Unwind the assemblies array to flatten it
//       {
//         $unwind: {
//           path: "$subItems.assemblies",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       // Lookup to populate timeblocks from TimeBlock collection using assembly _id
//       {
//         $lookup: {
//           from: "timeblocks",
//           let: { assemblyId: "$subItems.assemblies._id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$itemId", { $toString: "$$assemblyId" }] },
//                     { $eq: ["$contextType", contextType] },
//                     { $lte: ["$start", endDate] },
//                     { $gte: ["$end", startDate] },
//                   ],
//                 },
//               },
//             },
//           ],
//           as: "subItems.assemblies.timeblocks",
//         },
//       },
//       // Group by subItem to collect all assemblies and their timeblocks
//       {
//         $group: {
//           _id: "$subItems._id",
//           subItemCode: { $first: "$subItems.code" },
//           subItemCategory: { $first: "$subItems.category" },
//           subItemTags: { $first: "$subItems.tags" },
//           assemblies: { $push: "$subItems.assemblies" },
//           subItemCreatedAt: { $first: "$subItems.createdAt" },
//           subItemUpdatedAt: { $first: "$subItems.updatedAt" },
//           itemId: { $first: "$_id" },
//           itemCode: { $first: "$code" },
//           itemType: { $first: "$type" },
//           itemCategory: { $first: "$category" },
//           itemCostingDepartment: { $first: "$costingDepartment" },
//           itemContractDescription: { $first: "$contractDescription" },
//           itemTags: { $first: "$tags" },
//           itemCreatedAt: { $first: "$createdAt" },
//           itemUpdatedAt: { $first: "$updatedAt" },
//         },
//       },
//       // Group to collect all subItems back into the ItemCode document
//       {
//         $group: {
//           _id: "$itemId",
//           code: { $first: "$itemCode" },
//           type: { $first: "$itemType" },
//           category: { $first: "$itemCategory" },
//           costingDepartment: { $first: "$itemCostingDepartment" },
//           contractDescription: { $first: "$itemContractDescription" },
//           tags: { $first: "$itemTags" },
//           subItems: {
//             $push: {
//               _id: "$_id",
//               code: "$subItemCode",
//               category: "$subItemCategory",
//               tags: "$subItemTags",
//               assemblies: "$assemblies",
//               createdAt: "$subItemCreatedAt",
//               updatedAt: "$subItemUpdatedAt",
//             },
//           },
//           createdAt: { $first: "$itemCreatedAt" },
//           updatedAt: { $first: "$itemUpdatedAt" },
//         },
//       },
//     ]).exec();

//     if (!result.length) {
//       return res
//         .status(404)
//         .json({ message: "No sub-items or assemblies found" });
//     }

//     let itemDetails = result[0];
//     itemDetails.subItems = itemDetails.subItems.map((subItem) => {
//       const totalAssemblies = subItem.assemblies.length;
//       const availableAssemblies = subItem.assemblies.filter((assembly) => {
//         const isStatusValid = ["Working", "Usable"].includes(assembly.status);
//         const isTimeBlockValid = !assembly.timeblocks.some((block) => {
//           const blockStart = new Date(block.start);
//           const blockEnd = new Date(block.end);
//           const isOverlap =
//             blockStart < jobEndDate &&
//             blockEnd > jobStartDate &&
//             // blockStart < endDate &&
//             // blockEnd > startDate &&
//             block.contextKey !== contextKey;
//           return isOverlap;
//         });
//         return isStatusValid && isTimeBlockValid;
//       }).length;

//       const unavailableAssemblies = subItem.assemblies
//         .filter((assembly) => {
//           const reasons = [];
//           if (!["Working", "Usable"].includes(assembly.status)) {
//             reasons.push("Invalid status");
//           }
//           assembly.timeblocks.forEach((block) => {
//             const blockStart = new Date(block.start);
//             const blockEnd = new Date(block.end);
//             const isOverlap =
//               blockStart < jobEndDate &&
//               blockEnd > jobStartDate &&
//               // blockStart < endDate &&
//               // blockEnd > startDate &&
//               block.contextKey !== contextKey;
//             if (isOverlap) {
//               reasons.push(
//                 `Overlap with contextKey ${block.contextKey} from ${block.start} to ${block.end}`
//               );
//             }
//           });
//           return reasons.length > 0 ? { ...assembly, reasons } : null;
//         })
//         .filter(Boolean);

//       return {
//         ...subItem,
//         availability: {
//           totalAssemblies,
//           availableAssemblies,
//           unavailableAssemblies: totalAssemblies - availableAssemblies,
//           unavailableDetails: unavailableAssemblies,
//         },
//       };
//     });

//     // Sort subItems by code in alphabetical order
//     itemDetails.subItems.sort((a, b) => a.code.localeCompare(b.code));

//     res.json(itemDetails);
//   } catch (error) {
//     console.error("Error fetching item availability:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// from 8/4. modified to account for subItemchange
// subItems was array of ids not its array of objects where subItems.subitem is the id and subItems.quantity is quantity
const getItemDetailsWithTimeblocks = async (req, res) => {
  const { id, start, end, jobStart, jobEnd, contextType, contextKey } =
    req.body;

  const startDate = new Date(start);
  const endDate = new Date(end);
  const jobStartDate = new Date(jobStart);
  const jobEndDate = new Date(jobEnd);

  console.log("Body Parameters:", {
    id,
    startDate,
    endDate,
    contextType,
    contextKey,
  });

  try {
    // Step 1: Find the ItemCode document by its ID
    const item = await ItemCode.findById(id);
    if (!item) {
      return res.status(404).json({ message: "ItemCode not found" });
    }

    // Step 2: Aggregate to find all associated SubItemCodes, their assemblies, and timeblocks
    const result = await ItemCode.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      // Unwind the subItems array to handle each subItem separately and preserve the quantity field
      { $unwind: { path: "$subItems", preserveNullAndEmptyArrays: true } },
      // Add the quantity from subItems to a new field in the root level of the document
      {
        $addFields: {
          subItemId: "$subItems.subItem",
          subItemQuantity: "$subItems.quantity", // Preserve the quantity field
        },
      },
      // Lookup to populate subItems from SubItemCode
      {
        $lookup: {
          from: "subitemcodes",
          localField: "subItemId",
          foreignField: "_id",
          as: "subItemDetails",
        },
      },
      {
        $unwind: { path: "$subItemDetails", preserveNullAndEmptyArrays: true },
      },
      // Unwind the assemblyIds array in subItemDetails to handle each ID separately
      {
        $unwind: {
          path: "$subItemDetails.assemblyIds",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Convert assemblyIds to ObjectId
      {
        $addFields: {
          "subItemDetails.assemblyIds": {
            $toObjectId: "$subItemDetails.assemblyIds",
          },
        },
      },
      // Lookup to populate assemblies from Assembly collection using assemblyIds
      {
        $lookup: {
          from: "assemblies",
          localField: "subItemDetails.assemblyIds",
          foreignField: "_id",
          as: "subItemDetails.assemblies",
        },
      },
      // Unwind the assemblies array to flatten it
      {
        $unwind: {
          path: "$subItemDetails.assemblies",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup to populate timeblocks from TimeBlock collection using assembly _id
      {
        $lookup: {
          from: "timeblocks",
          let: { assemblyId: "$subItemDetails.assemblies._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$itemId", "$$assemblyId"] },
                    { $eq: ["$contextType", contextType] },
                    { $lte: ["$start", endDate] },
                    { $gte: ["$end", startDate] },
                  ],
                },
              },
            },
            // Lookup to populate facilities from Facility collection using locationId
            {
              $lookup: {
                from: "facilities",
                localField: "locationId",
                foreignField: "_id",
                as: "location",
              },
            },
            {
              $unwind: { path: "$location", preserveNullAndEmptyArrays: true },
            },
          ],
          as: "subItemDetails.assemblies.timeblocks",
        },
      },
      // Group by subItem to collect all assemblies and their timeblocks, including the quantity
      {
        $group: {
          _id: "$subItemDetails._id",
          subItemCode: { $first: "$subItemDetails.code" },
          subItemCategory: { $first: "$subItemDetails.category" },
          subItemTags: { $first: "$subItemDetails.tags" },
          subItemQuantity: { $first: "$subItemQuantity" }, // Include quantity here
          assemblies: { $push: "$subItemDetails.assemblies" },
          subItemCreatedAt: { $first: "$subItemDetails.createdAt" },
          subItemUpdatedAt: { $first: "$subItemDetails.updatedAt" },
          itemId: { $first: "$_id" },
          itemCode: { $first: "$code" },
          itemType: { $first: "$type" },
          itemCategory: { $first: "$category" },
          itemCostingDepartment: { $first: "$costingDepartment" },
          itemContractDescription: { $first: "$contractDescription" },
          itemTags: { $first: "$tags" },
          itemCreatedAt: { $first: "$createdAt" },
          itemUpdatedAt: { $first: "$updatedAt" },
        },
      },
      // Group to collect all subItems back into the ItemCode document
      {
        $group: {
          _id: "$itemId",
          code: { $first: "$itemCode" },
          type: { $first: "$itemType" },
          category: { $first: "$itemCategory" },
          costingDepartment: { $first: "$itemCostingDepartment" },
          contractDescription: { $first: "$itemContractDescription" },
          tags: { $first: "$itemTags" },
          subItems: {
            $push: {
              _id: "$_id",
              code: "$subItemCode",
              category: "$subItemCategory",
              tags: "$subItemTags",
              quantity: "$subItemQuantity", // Include quantity in the final result
              assemblies: "$assemblies",
              createdAt: "$subItemCreatedAt",
              updatedAt: "$subItemUpdatedAt",
            },
          },
          createdAt: { $first: "$itemCreatedAt" },
          updatedAt: { $first: "$itemUpdatedAt" },
        },
      },
    ]).exec();

    if (!result.length) {
      return res
        .status(404)
        .json({ message: "No sub-items or assemblies found" });
    }

    let itemDetails = result[0];
    itemDetails.subItems = itemDetails.subItems.map((subItem) => {
      const totalAssemblies = subItem.assemblies.length;
      const availableAssemblies = subItem.assemblies.filter((assembly) => {
        const isStatusValid = ["Working", "Usable"].includes(assembly.status);
        const isTimeBlockValid = !assembly.timeblocks.some((block) => {
          if (!block.contextKey) return false; // Check if contextKey is null
          const blockStart = new Date(block.start);
          const blockEnd = new Date(block.end);
          const isOverlap =
            blockStart < jobEndDate &&
            blockEnd > jobStartDate &&
            block.contextKey.toString() !== contextKey.toString();
          return isOverlap;
        });
        return isStatusValid && isTimeBlockValid;
      }).length;

      const unavailableAssemblies = subItem.assemblies
        .filter((assembly) => {
          const reasons = [];
          if (!["Working", "Usable"].includes(assembly.status)) {
            reasons.push("Invalid status");
          }
          assembly.timeblocks.forEach((block) => {
            if (!block.contextKey) return; // Check if contextKey is null
            const blockStart = new Date(block.start);
            const blockEnd = new Date(block.end);
            const isOverlap =
              blockStart < jobEndDate &&
              blockEnd > jobStartDate &&
              block.contextKey.toString() !== contextKey.toString();
            if (isOverlap) {
              reasons.push(
                `Overlap with contextKey ${block.contextKey} from ${block.start} to ${block.end}`
              );
            }
          });
          return reasons.length > 0 ? { ...assembly, reasons } : null;
        })
        .filter(Boolean);

      return {
        ...subItem,
        availability: {
          totalAssemblies,
          availableAssemblies,
          unavailableAssemblies: totalAssemblies - availableAssemblies,
          unavailableDetails: unavailableAssemblies,
        },
      };
    });

    // Sort subItems by code in alphabetical order
    itemDetails.subItems.sort((a, b) => a.code.localeCompare(b.code));

    res.json(itemDetails);
  } catch (error) {
    console.error("Error fetching item availability:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// newer version that utilizes populate.  much shorter

// const getItemDetailsWithTimeblocks = async (req, res) => {
//   const { id, start, end, jobStart, jobEnd, contextType, contextKey } =
//     req.body;

//   const startDate = new Date(start);
//   const endDate = new Date(end);
//   const jobStartDate = new Date(jobStart);
//   const jobEndDate = new Date(jobEnd);

//   console.log("Body Parameters:", {
//     id,
//     startDate,
//     endDate,
//     contextType,
//     contextKey,
//   });

//   try {
//     // Step 1: Find the ItemCode document by its ID and populate subItems.subItem and assemblyIds
//     const item = await ItemCode.findById(id)
//       .populate({
//         path: "subItems.subItem",
//         populate: {
//           path: "assemblyIds",
//           model: "Assembly",
//         },
//       })
//       .exec();

//     if (!item) {
//       return res.status(404).json({ message: "ItemCode not found" });
//     }

//     // Step 2: Retrieve and attach timeblocks for each assembly
//     const subItemsWithTimeblocks = await Promise.all(
//       item.subItems.map(async ({ subItem, quantity }) => {
//         if (!subItem) return { quantity };

//         const assemblyIds = subItem.assemblyIds.map((a) => a._id);

//         const timeblocks = await TimeBlock.find({
//           itemId: { $in: assemblyIds },
//           contextType: contextType,
//           start: { $lte: endDate },
//           end: { $gte: startDate },
//         })
//           .populate("locationId")
//           .exec();

//         const assembliesWithTimeblocks = subItem.assemblyIds.map(
//           (assembly) => ({
//             ...assembly.toObject(),
//             timeblocks: timeblocks.filter(
//               (tb) => tb.itemId.toString() === assembly._id.toString()
//             ),
//           })
//         );

//         const totalAssemblies = assembliesWithTimeblocks.length;
//         const availableAssemblies = assembliesWithTimeblocks.filter(
//           (assembly) => {
//             const isStatusValid = ["Working", "Usable"].includes(
//               assembly.status
//             );
//             const isTimeBlockValid = !assembly.timeblocks.some((block) => {
//               if (!block.contextKey) return false; // Check if contextKey is null
//               const blockStart = new Date(block.start);
//               const blockEnd = new Date(block.end);
//               const isOverlap =
//                 blockStart < jobEndDate &&
//                 blockEnd > jobStartDate &&
//                 (contextType !== "jobAssembly" ||
//                   block.contextKey.toString() !== contextKey.toString());
//               return isOverlap;
//             });
//             return isStatusValid && isTimeBlockValid;
//           }
//         ).length;

//         const unavailableAssemblies = assembliesWithTimeblocks
//           .filter((assembly) => {
//             const reasons = [];
//             if (!["Working", "Usable"].includes(assembly.status)) {
//               reasons.push("Invalid status");
//             }
//             assembly.timeblocks.forEach((block) => {
//               if (!block.contextKey) return; // Check if contextKey is null
//               const blockStart = new Date(block.start);
//               const blockEnd = new Date(block.end);
//               const isOverlap =
//                 blockStart < jobEndDate &&
//                 blockEnd > jobStartDate &&
//                 (contextType !== "jobAssembly" ||
//                   block.contextKey.toString() !== contextKey.toString());
//               if (isOverlap) {
//                 reasons.push(
//                   `Overlap with contextKey ${block.contextKey} from ${block.start} to ${block.end}`
//                 );
//               }
//             });
//             return reasons.length > 0 ? { ...assembly, reasons } : null;
//           })
//           .filter(Boolean);

//         return {
//           ...subItem.toObject(),
//           quantity,
//           assemblies: assembliesWithTimeblocks,
//           availability: {
//             totalAssemblies,
//             availableAssemblies,
//             unavailableAssemblies: totalAssemblies - availableAssemblies,
//             unavailableDetails: unavailableAssemblies,
//           },
//         };
//       })
//     );

//     const itemDetails = {
//       ...item.toObject(),
//       subItems: subItemsWithTimeblocks,
//     };

//     // Sort subItems by code in alphabetical order if code exists
//     itemDetails.subItems.sort((a, b) => {
//       if (!a.code) return 1;
//       if (!b.code) return -1;
//       return a.code.localeCompare(b.code);
//     });

//     res.json(itemDetails);
//   } catch (error) {
//     console.error("Error fetching item availability:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const itemCodeAvailability = async (req, res) => {
  const { id, start, end, contextType, contextKey } = req.body;

  const startDate = new Date(start);
  const endDate = new Date(end);

  console.log("Body Parameters:", {
    id,
    startDate,
    endDate,
    contextType,
    contextKey,
  });

  try {
    // Step 1: Find the ItemCode document by its ID
    const item = await ItemCode.findById(id);
    if (!item) {
      return res.status(404).json({ message: "ItemCode not found" });
    }

    // Step 2: Aggregate to find all associated SubItemCodes, their assemblies, and timeblocks
    const result = await ItemCode.aggregate([
      { $match: { _id: item._id } },
      // Lookup to populate subItems from SubItemCode
      {
        $lookup: {
          from: "subitemcodes",
          localField: "subItems",
          foreignField: "_id",
          as: "subItems",
        },
      },
      // Unwind the subItems array to handle each subItem separately
      { $unwind: { path: "$subItems", preserveNullAndEmptyArrays: true } },
      // Unwind the assemblyIds array in subItems to handle each ID separately
      {
        $unwind: {
          path: "$subItems.assemblyIds",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Convert assemblyIds to ObjectId
      {
        $addFields: {
          "subItems.assemblyIds": { $toObjectId: "$subItems.assemblyIds" },
        },
      },
      // Lookup to populate assemblies from Assembly collection using assemblyIds
      {
        $lookup: {
          from: "assemblies",
          localField: "subItems.assemblyIds",
          foreignField: "_id",
          as: "subItems.assemblies",
        },
      },
      // Unwind the assemblies array to flatten it
      {
        $unwind: {
          path: "$subItems.assemblies",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup to populate timeblocks from TimeBlock collection using assembly _id
      {
        $lookup: {
          from: "timeblocks",
          let: { assemblyId: "$subItems.assemblies._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$itemId", { $toString: "$$assemblyId" }] },
                    { $eq: ["$contextType", contextType] },
                    { $lte: ["$start", endDate] },
                    { $gte: ["$end", startDate] },
                  ],
                },
              },
            },
          ],
          as: "subItems.assemblies.timeblocks",
        },
      },
      // Group by subItem to collect all assemblies and their timeblocks
      {
        $group: {
          _id: "$subItems._id",
          subItemCode: { $first: "$subItems.code" },
          subItemCategory: { $first: "$subItems.category" },
          subItemTags: { $first: "$subItems.tags" },
          assemblies: { $push: "$subItems.assemblies" },
          subItemCreatedAt: { $first: "$subItems.createdAt" },
          subItemUpdatedAt: { $first: "$subItems.updatedAt" },
          itemId: { $first: "$_id" },
          itemCode: { $first: "$code" },
          itemType: { $first: "$type" },
          itemCategory: { $first: "$category" },
          itemCostingDepartment: { $first: "$costingDepartment" },
          itemContractDescription: { $first: "$contractDescription" },
          itemTags: { $first: "$tags" },
          itemCreatedAt: { $first: "$createdAt" },
          itemUpdatedAt: { $first: "$updatedAt" },
        },
      },
      // Group to collect all subItems back into the ItemCode document
      {
        $group: {
          _id: "$itemId",
          code: { $first: "$itemCode" },
          type: { $first: "$itemType" },
          category: { $first: "$itemCategory" },
          costingDepartment: { $first: "$itemCostingDepartment" },
          contractDescription: { $first: "$itemContractDescription" },
          tags: { $first: "$itemTags" },
          subItems: {
            $push: {
              _id: "$_id",
              code: "$subItemCode",
              category: "$subItemCategory",
              tags: "$subItemTags",
              assemblies: "$assemblies",
              createdAt: "$subItemCreatedAt",
              updatedAt: "$subItemUpdatedAt",
            },
          },
          createdAt: { $first: "$itemCreatedAt" },
          updatedAt: { $first: "$itemUpdatedAt" },
        },
      },
    ]).exec();

    if (!result.length) {
      return res
        .status(404)
        .json({ message: "No sub-items or assemblies found" });
    }

    const itemDetails = result[0];
    const availabilityReport = itemDetails.subItems.map((subItem) => {
      const totalAssemblies = subItem.assemblies.length;
      const availableAssemblies = subItem.assemblies.filter((assembly) => {
        const isStatusValid = ["Working", "Usable"].includes(assembly.status);
        const isTimeBlockValid = !assembly.timeblocks.some((block) => {
          const blockStart = new Date(block.start);
          const blockEnd = new Date(block.end);
          const isOverlap =
            blockStart < endDate &&
            blockEnd > startDate &&
            block.contextKey !== contextKey;
          return isOverlap;
        });
        return isStatusValid && isTimeBlockValid;
      }).length;

      const unavailableAssemblies = subItem.assemblies
        .filter((assembly) => {
          const reasons = [];
          if (!["Working", "Usable"].includes(assembly.status)) {
            reasons.push("Invalid status");
          }
          assembly.timeblocks.forEach((block) => {
            const blockStart = new Date(block.start);
            const blockEnd = new Date(block.end);
            const isOverlap =
              blockStart < endDate &&
              blockEnd > startDate &&
              block.contextKey !== contextKey;
            if (isOverlap) {
              reasons.push(
                `Overlap with contextKey ${block.contextKey} from ${block.start} to ${block.end}`
              );
            }
          });
          return reasons.length > 0 ? { ...assembly, reasons } : null;
        })
        .filter(Boolean);

      return {
        subItemCode: subItem.code,
        totalAssemblies,
        availableAssemblies,
        unavailableAssemblies: totalAssemblies - availableAssemblies,
        unavailableDetails: unavailableAssemblies,
      };
    });

    res.json(availabilityReport);
  } catch (error) {
    console.error("Error fetching item availability:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// const addJobItem = async (req, res) => {
//   const { getjob, quantity, pricing, jobId } = req.body;

//   console.log("body data for job item", req.body);

//   // Validate input data
//   if (!codeId || !quantity || !pricing || !jobId) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   try {
//     const newItem = await JobItem.findOneAndUpdate(
//       { codeId, jobId },
//       {
//         $set: {
//           codeId,
//           quantity,
//           pricing,
//           jobId,
//         },
//       },
//       { new: true, upsert: true }
//     );
//     if (!newItem) {
//       return res.status(404).json({ message: "Item not found" });
//     }
//     res.status(200).json(newItem);
//   } catch (error) {
//     console.error("Error adding job item:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const addJobItem = async (req, res) => {
  const { codeId, quantity, pricing, jobId } = req.body;

  console.log("body data for job item", req.body);

  // Validate input data
  if (!codeId || !quantity || !pricing || !jobId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Convert to ObjectId if necessary
    const codeObjectId = new ObjectId(codeId);
    const pricingObjectId = new ObjectId(pricing);
    const jobObjectId = new ObjectId(jobId);

    const newItem = await JobItem.findOneAndUpdate(
      { codeId: codeObjectId, jobId: jobObjectId },
      {
        $set: {
          codeId: codeObjectId,
          quantity,
          pricing: pricingObjectId,
          jobId: jobObjectId,
        },
      },
      { new: true, upsert: true }
    );
    res.status(200).json(newItem);
  } catch (error) {
    console.error("Error adding job item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = addJobItem;

const deleteJobItem = async (req, res) => {
  const { codeId, jobId } = req.body;

  // Validate input data
  if (!codeId || !jobId) {
    return res.status(400).json({ message: "codeId and jobId are required" });
  }

  try {
    const deletedItem = await JobItem.findOneAndDelete({ codeId, jobId });
    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.status(200).json({ message: "Item deleted successfully", deletedItem });
  } catch (error) {
    console.error("Error deleting job item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getJobItem = async (req, res) => {
  const { jobId } = req.params;

  try {
    const jobItems = await JobItem.find({ jobId });
    if (!jobItems) {
      return res
        .status(404)
        .json({ message: "No job items found for this jobId" });
    }
    res.status(200).json(jobItems);
  } catch (error) {
    console.error("Error fetching job items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// job Item details fetch

// Helper function to fetch price levels for a given itemId
const fetchPriceLevels = async (itemId) => {
  const priceLevels = await PricingLevel.find({ itemId }).populate({
    path: "level",
    select: "levelName",
  });

  return priceLevels.map((priceLevel) => ({
    unitPriceCents: priceLevel.unitPriceCents,
    defaultQuantity: priceLevel.defaultQuantity,
    minimumQuantity: priceLevel.minimumQuantity,
    itemId: priceLevel.itemId,
    level: priceLevel.level._id,
    levelName: priceLevel.level.levelName,
  }));
};

// Helper function to fetch item details with timeblocks

const fetchItemDetailsWithTimeblocks = async (
  codeId,
  start,
  end,
  contextType,
  contextKey
) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  console.log("startDate:", startDate);
  console.log("endDate:", endDate);

  try {
    // Step 1: Find the ItemCode document by its ID
    const item = await ItemCode.findById(codeId);
    if (!item) {
      throw new Error("ItemCode not found");
    }

    // Step 2: Aggregate to find all associated SubItemCodes, their assemblies, and timeblocks
    const result = await ItemCode.aggregate([
      { $match: { _id: new ObjectId(codeId) } },
      // Lookup to populate subItems from SubItemCode
      {
        $lookup: {
          from: "subitemcodes",
          localField: "subItems.subItem",
          foreignField: "_id",
          as: "subItems",
        },
      },
      // Unwind the subItems array to handle each subItem separately
      { $unwind: { path: "$subItems", preserveNullAndEmptyArrays: true } },
      // Unwind the assemblyIds array in subItems to handle each ID separately
      {
        $unwind: {
          path: "$subItems.assemblyIds",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Convert assemblyIds to ObjectId
      {
        $addFields: {
          "subItems.assemblyIds": { $toObjectId: "$subItems.assemblyIds" },
        },
      },
      // Lookup to populate assemblies from Assembly collection using assemblyIds
      {
        $lookup: {
          from: "assemblies",
          localField: "subItems.assemblyIds",
          foreignField: "_id",
          as: "subItems.assemblies",
        },
      },
      // Unwind the assemblies array to flatten it
      {
        $unwind: {
          path: "$subItems.assemblies",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup to populate timeblocks from TimeBlock collection using assembly _id
      {
        $lookup: {
          from: "timeblocks",
          let: { assemblyId: "$subItems.assemblies._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$itemId", "$$assemblyId"] },
                    { $eq: ["$contextType", contextType] },
                    { $lte: ["$start", endDate] },
                    { $gte: ["$end", startDate] },
                  ],
                },
              },
            },
          ],
          as: "subItems.assemblies.timeblocks",
        },
      },
      // Group by subItem to collect all assemblies and their timeblocks
      {
        $group: {
          _id: "$subItems._id",
          subItemCode: { $first: "$subItems.code" },
          subItemCategory: { $first: "$subItems.category" },
          subItemTags: { $first: "$subItems.tags" },
          assemblies: { $push: "$subItems.assemblies" },
          subItemCreatedAt: { $first: "$subItems.createdAt" },
          subItemUpdatedAt: { $first: "$subItems.updatedAt" },
          itemId: { $first: "$_id" },
          itemCode: { $first: "$code" },
          itemType: { $first: "$type" },
          itemCategory: { $first: "$category" },
          itemCostingDepartment: { $first: "$costingDepartment" },
          itemContractDescription: { $first: "$contractDescription" },
          itemTags: { $first: "$tags" },
          itemCreatedAt: { $first: "$createdAt" },
          itemUpdatedAt: { $first: "$updatedAt" },
        },
      },
      // Group to collect all subItems back into the ItemCode document
      {
        $group: {
          _id: "$itemId",
          code: { $first: "$itemCode" },
          type: { $first: "$itemType" },
          category: { $first: "$itemCategory" },
          costingDepartment: { $first: "$itemCostingDepartment" },
          contractDescription: { $first: "$itemContractDescription" },
          tags: { $first: "$itemTags" },
          subItems: {
            $push: {
              _id: "$_id",
              code: "$subItemCode",
              category: "$subItemCategory",
              tags: "$subItemTags",
              assemblies: "$assemblies",
              createdAt: "$subItemCreatedAt",
              updatedAt: "$subItemUpdatedAt",
            },
          },
          createdAt: { $first: "$itemCreatedAt" },
          updatedAt: { $first: "$itemUpdatedAt" },
        },
      },
    ]).exec();

    if (!result.length) {
      throw new Error("No sub-items or assemblies found");
    }

    let itemDetails = result[0];
    itemDetails.subItems = itemDetails.subItems.map((subItem) => {
      const totalAssemblies = subItem.assemblies.length;
      const availableAssemblies = subItem.assemblies.filter((assembly) => {
        const isStatusValid = ["Working", "Usable"].includes(assembly.status);
        const isTimeBlockValid = !assembly.timeblocks.some((block) => {
          if (!block.contextKey) return false;
          const blockStart = new Date(block.start);
          const blockEnd = new Date(block.end);
          const isOverlap =
            blockStart < endDate &&
            blockEnd > startDate &&
            block.contextKey.toString() !== contextKey.toString();
          return isOverlap;
        });
        return isStatusValid && isTimeBlockValid;
      }).length;

      const unavailableAssemblies = subItem.assemblies
        .filter((assembly) => {
          const reasons = [];
          if (!["Working", "Usable"].includes(assembly.status)) {
            reasons.push("Invalid status");
          }
          assembly.timeblocks.forEach((block) => {
            if (!block.contextKey) return;
            const blockStart = new Date(block.start);
            const blockEnd = new Date(block.end);
            const isOverlap =
              blockStart < endDate && // needs to be job endDate
              blockEnd > startDate && // needs to be job startDate
              block.contextKey.toString() !== contextKey.toString();
            if (isOverlap) {
              reasons.push(
                `Overlap with contextKey ${block.contextKey} from ${block.start} to ${block.end}`
              );
            }
          });
          return reasons.length > 0 ? { ...assembly, reasons } : null;
        })
        .filter(Boolean);

      return {
        ...subItem,
        availability: {
          totalAssemblies,
          availableAssemblies,
          unavailableAssemblies: totalAssemblies - availableAssemblies,
          unavailableDetails: unavailableAssemblies,
        },
      };
    });

    // Sort subItems by code in alphabetical order
    itemDetails.subItems.sort((a, b) => a.code.localeCompare(b.code));

    console.log(
      itemDetails.subItems.flatMap((item) =>
        item.assemblies.flatMap((assembly) => assembly)
      )
    );
    return itemDetails;
  } catch (error) {
    console.error("Error fetching item availability:", error);
    throw error;
  }
};

// need to look up job directly and get jobSTart and jobEnd.  then feed those into details
// 7/22/2024 removed start and end from body
// these values are now looked up using the jobId
// start and end are parsed out from the job itself
const getJobItemsWithDetails = async (req, res) => {
  const { id } = req.params;
  const jobId = id;

  console.log("getting items");

  try {
    // Step 1: Fetch job items by jobId and populate necessary fields
    const jobItems = await JobItem.find({ jobId })
      .populate({
        path: "codeId",
        populate: {
          path: "subItems.subItem",
          populate: {
            path: "assemblyIds",
          },
        },
      })
      .populate("pricing");

    console.log(jobItems);

    if (!jobItems.length) {
      return res
        .status(404)
        .json({ message: "No job items found for this jobId" });
    }

    const job = await Job.findById(jobId);
    console.log(job);
    if (!job) {
      return res.status(404).json({ message: "No job found for this jobId" });
    }

    const { start, end } = job;
    console.log(start, end);

    // Step 2: Enrich job items with details
    const enrichedJobItems = await Promise.all(
      jobItems.map(async (jobItem) => {
        const details = await fetchItemDetailsWithTimeblocks(
          jobItem.codeId,
          start,
          end,
          "jobAssembly",
          jobId
        );

        return { ...jobItem._doc, details };
      })
    );

    console.log(enrichedJobItems);
    res.status(200).json(enrichedJobItems);
  } catch (error) {
    console.error("Error fetching job items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// const getJobItemsWithDetails = async (req, res) => {
//   const { id } = req.params;
//   const jobId = id;

//   console.log("getting items");

//   try {
//     // Fetch the job details first
//     const job = await Job.findById(jobId);
//     if (!job) {
//       return res.status(404).json({ message: "No job found for this jobId" });
//     }

//     const { start, end } = job;
//     console.log(start, end);

//     // Fetch job items by jobId with populated fields
//     const jobItems = await JobItem.find({ jobId })
//       .populate({
//         path: "codeId",
//         populate: {
//           path: "subItems.subItem",
//           populate: {
//             path: "assemblyIds",
//             model: "Assembly",
//           },
//         },
//       })
//       .populate("pricing")
//       .exec();

//     if (!jobItems.length) {
//       return res
//         .status(404)
//         .json({ message: "No job items found for this jobId" });
//     }

//     // Extract assembly IDs and ensure they are valid ObjectIds
//     const assemblyIds = jobItems
//       .flatMap((jobItem) =>
//         jobItem.codeId.subItems.flatMap(
//           (subItem) => subItem.subItem.assemblyIds
//         )
//       )
//       .filter((id) => mongoose.Types.ObjectId.isValid(id));

//     const timeblocks = await TimeBlock.aggregate([
//       {
//         $match: {
//           itemId: {
//             $in: assemblyIds.map((id) => new mongoose.Types.ObjectId(id)),
//           },
//           contextType: "jobAssembly",
//           contextKey: new mongoose.Types.ObjectId(jobId),
//           start: { $lte: end },
//           end: { $gte: start },
//         },
//       },
//       {
//         $lookup: {
//           from: "facilities",
//           localField: "locationId",
//           foreignField: "_id",
//           as: "location",
//         },
//       },
//       {
//         $unwind: { path: "$location", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $group: {
//           _id: "$itemId",
//           timeblocks: { $push: "$$ROOT" },
//         },
//       },
//     ]);

//     const timeblocksMap = timeblocks.reduce((acc, { _id, timeblocks }) => {
//       acc[_id] = timeblocks;
//       return acc;
//     }, {});

//     // Enrich job items with price levels and details
//     const enrichedJobItems = await Promise.all(
//       jobItems.map(async (jobItem) => {
//         const priceLevels = await fetchPriceLevels(jobItem.codeId._id);
//         const details = jobItem.codeId;
//         details.subItems.forEach((subItem) => {
//           subItem.subItem.assemblyIds.forEach((assembly) => {
//             assembly.timeblocks = timeblocksMap[assembly._id] || [];
//           });
//         });
//         return { ...jobItem._doc, priceLevels, details };
//       })
//     );

//     console.log(enrichedJobItems);
//     res.status(200).json(enrichedJobItems);
//   } catch (error) {
//     console.error("Error fetching job items:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// // Helper functions
// const fetchPriceLevels = async (itemId) => {
//   try {
//     const priceLevels = await PricingLevel.find({ itemId })
//       .populate("level")
//       .exec();
//     return priceLevels.map((level) => ({
//       unitPriceCents: level.unitPriceCents,
//       defaultQuantity: level.defaultQuantity,
//       minimumQuantity: level.minimumQuantity,
//       itemId: level.itemId,
//       level: level.level._id,
//       levelName: level.level.levelName,
//     }));
//   } catch (error) {
//     console.error("Error fetching price levels:", error);
//     return [];
//   }
// };

// const fetchItemDetailsWithTimeblocks = async (
//   itemId,
//   start,
//   end,
//   contextType,
//   contextKey
// ) => {
//   try {
//     const itemDetails = await ItemCode.findById(itemId)
//       .populate({
//         path: "subItems.subItem",
//         populate: {
//           path: "assemblyIds",
//           model: "Assembly",
//           populate: {
//             path: "timeblocks",
//             match: {
//               contextType: contextType,
//               $or: [{ start: { $lte: end } }, { end: { $gte: start } }],
//               contextKey: contextKey,
//             },
//           },
//         },
//       })
//       .exec();

//     return itemDetails;
//   } catch (error) {
//     console.error("Error fetching item details with timeblocks:", error);
//     return null;
//   }
// };

module.exports = {
  jobExport,
  deleteAll,
  jobLookup,
  findJobItemsAssigned,
  findJobsByDateRange,
  submitItemCodes,
  itemCodeLookup,
  subItemCodeLookup,
  getAllItemCodes,
  addPriceLevelName,
  getPriceLevelName,
  enterPriceLevel,
  priceLevelLookup,
  priceLevelDelete,
  getItemCodes,
  getItemDetails,
  getSubItemDetails,
  itemCodeLookupById,
  getSubItemCodes,
  getSubItemDetailsByCode,
  putItemCode,
  putSubItemCode,
  priceLevelDeleteMany,
  deleteItemCode,
  deleteSubItemCode,
  getItemDetailsWithTimeblocks,
  itemCodeAvailability,
  addJobItem,
  deleteJobItem,
  getJobItem,
  getJobItemsWithDetails,
};

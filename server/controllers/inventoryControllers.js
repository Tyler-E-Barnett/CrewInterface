const { TimeBlock } = require("../models/timeBlockModels");
const { Facility } = require("../models/facilityModels");
const {
  Assembly,
  Equipment,
  EquipmentMap,
} = require("../models/inventoryModels");
const { JobItem } = require("../models/jobModels");
const { encodedCredentials, oDataUrl } = require("../modules/credentials");
const axios = require("axios");

// uses OData to grab assemblies from filemaker based on Category
const getAssembliesFilemaker = async (req, res) => {
  category = req.query.category;
  const filter = `?$filter="Assembly Type" eq '${category}'`;

  const config = {
    url: `${oDataUrl}Equipment_Inv/assemblies${filter}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
  };

  // console.log(filter);
  try {
    const result = await axios(config);
    const data = result.data.value;

    res.status(200).send(data);
  } catch (error) {
    console.error("Error grabbing crew data:", error.response.data.error);
    res.status(500).send("Error fetching equipment");
  }
};

// get inventory items based on assembly id
const getEquipmentFilemaker = async (req, res) => {
  id = req.query.id;
  const filter = `?$filter="Assembly ID" eq '${id}'`;

  const config = {
    url: `${oDataUrl}Equipment_Inv/Equipment${filter}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
  };

  try {
    const result = await axios(config);
    const data = result.data.value;

    res.status(200).send(data);
  } catch (error) {
    console.error("Error grabbing crew data:", error.response.data.error);
    res.status(500).send("Error fetching equipment");
  }
};

const scheduleEquipment = async (req, res) => {
  console.log("Assigning equipment...");
  const {
    fmRecordId,
    itemId,
    start,
    end,
    contextKey,
    contextType,
    locationId,
  } = req.body;

  try {
    // Await the promise to make sure the operation completes
    const updatedTimeBlock = await TimeBlock.findOneAndUpdate(
      { contextKey, contextType, itemId },
      {
        $set: {
          fmRecordId,
          itemId,
          start,
          end,
          contextKey,
          contextType,
          locationId,
        },
      },
      { new: true, upsert: true } // Ensures creation if not found
    );

    // Check if the document was updated or created
    if (updatedTimeBlock) {
      console.log("Success: Equipment scheduled");
      res.status(200).json({
        message: "Successfully assigned equipment",
        data: updatedTimeBlock,
      });
    } else {
      // If no document was updated or created, handle accordingly
      console.log("Failed to assign equipment");
      res.status(404).send("No matching document found and none was created");
    }
  } catch (error) {
    console.error("Error assigning equipment:", error);
    res.status(500).send("Failed to assign equipment");
  }
};

const assemblyExport = async (req, res) => {
  const {
    fmRecordId,
    id,
    assemblyId,
    description,
    assemblyType,
    status,
    incidentals,
    location,
    aisleOrArea,
    bay,
    shelfOrBin,
    statusNotes,
    notes,
  } = req.body;

  try {
    await Assembly.findOneAndUpdate(
      { fmRecordId },
      {
        $set: {
          id,
          assemblyId,
          description,
          assemblyType,
          status,
          incidentals,
          location,
          aisleOrArea,
          bay,
          shelfOrBin,
          statusNotes,
          notes,
        },
      },
      { new: true, upsert: true }
    );
    res.status(200).send("Assembly data successfully exported and updated");
  } catch (error) {
    console.log("error exporting assembly data", error);
    res.status(500).send("error exporting job data");
  }
};

const equipmentExport = async (req, res) => {
  const {
    fmRecordId,
    id,
    assemblyId,
    description,
    status,
    manufacturer,
    model,
    serialNumber,
    category,
    notes,
    dimensions,
    quantity,
  } = req.body;

  try {
    await Equipment.findOneAndUpdate(
      { fmRecordId },
      {
        $set: {
          id,
          assemblyId,
          description,
          status,
          manufacturer,
          model,
          serialNumber,
          category,
          notes,
          dimensions,
          quantity,
        },
      },
      { new: true, upsert: true }
    );
    res.status(200).send("Equipment data successfully exported and updated");
  } catch (error) {
    console.log("error exporting equipment data", error);
    res.status(500).send("error exporting job data");
  }
};

const getAssemblyTimeBlocks = async (req, res) => {
  const itemId = req.params.id;
  console.log("getting assembly timeblocks");

  try {
    const results = await TimeBlock.aggregate([
      {
        $match: {
          contextType: "jobAssembly",
          itemId: itemId,
        },
      },
      {
        $lookup: {
          from: Assembly.collection.name, // Ensures to use the correct collection name
          localField: "itemId",
          foreignField: "assemblyId",
          as: "assemblyDetails",
        },
      },
      {
        $unwind: "$assemblyDetails",
      },
      {
        $match: { "assemblyDetails.assemblyId": { $exists: true } },
      },
      {
        $project: {
          itemId: 1,
          start: 1,
          end: 1,
          assemblyDescription: "$assemblyDetails.description",
          assemblyType: "$assemblyDetails.assemblyType",
        },
      },
    ]);

    res.status(200).send(results);
  } catch (error) {
    console.error("Failed to fetch timeblocks for assemblies:", error);
    res.status(500).send("Server error");
  }
};

const findAssemblyByType = async (req, res) => {
  console.log("getting assembly by type");
  try {
    const assemblies = await Assembly.findByAssemblyType(req.params.type);
    if (assemblies.length === 0) {
      return res.status(404).send("No assemblies found for given type.");
    }
    res.status(200).send(assemblies);
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
};

const findEquipmentByAssemblyId = async (req, res) => {
  try {
    const equipments = await Equipment.findByAssemblyId(req.params.assemblyId);
    if (equipments.length === 0) {
      return res.status(404).send("No equipment found for given assembly ID.");
    }
    res.status(200).send(equipments);
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
};

const equipmentMappingExport = async (req, res) => {
  const { fmRecordId, genericId, specificId } = req.body;

  try {
    await EquipmentMap.findOneAndUpdate(
      { fmRecordId },
      { $set: { genericId, specificId } },
      { new: true, upsert: true }
    );
    res.status(200).send("Mapping data exported");
  } catch (error) {
    console.log("error exporting mapping data", error);
    res.status(500).send("error exporting mapping data");
  }
};

const getAssembliesFromCode = async (req, res) => {
  const { jobItemId } = req.params;

  try {
    const assemblies = await JobItem.aggregate([
      { $match: { jobItemId: jobItemId } },
      {
        $lookup: {
          from: "equipmentmaps", // Name of the EquipmentMap collection in MongoDB
          localField: "jobItemId",
          foreignField: "genericId",
          as: "equipmentMaps",
        },
      },
      { $unwind: "$equipmentMaps" },
      {
        $lookup: {
          from: "assemblies", // Name of the Assembly collection in MongoDB
          localField: "equipmentMaps.specificId",
          foreignField: "id",
          as: "assemblies",
        },
      },
      { $unwind: "$assemblies" },
      {
        $group: {
          _id: "$assemblies.id", // Group by the unique identifier of assemblies
          assembly: { $first: "$assemblies" }, // Take the first occurrence of each unique assembly
        },
      },
      {
        $sort: {
          _id: 1, // Secondary sort by _id to ensure a stable order
          "assembly.fmrecordid": -1, // Sort by the fmrecordid in descending order
        },
      },
      {
        $project: {
          _id: 0,
          assembly: "$assembly",
        },
      },
    ]);

    const result = assemblies.map((entry) => entry.assembly);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching associated assemblies" });
  }
};

const getAssemblyByAssemblyId = async (req, res) => {
  const { assemblyId } = req.params;
  // console.log(assemblyId);

  try {
    const assembly = await Assembly.findOne({ assemblyId: assemblyId });

    if (!assembly) {
      return res.status(404).send("no assembly found");
    }
    res.status(200).send(assembly);
  } catch (error) {
    console.error("error fetching assembly", error);
    res.status(500).send("server error fetching assembly");
  }
};

const getAssemblyById = async (req, res) => {
  const { id } = req.params;
  // console.log(id);

  try {
    const assembly = await Assembly.findOne({ _id: id });

    if (!assembly) {
      return res.status(404).send("no assembly found");
    }
    res.status(200).send(assembly);
  } catch (error) {
    console.error("error fetching assembly", error);
    res.status(500).send("server error fetching assembly");
  }
};

const getAssembliesByIds = async (req, res) => {
  const { ids } = req.body; // Assuming the array of IDs is sent in the request body
  console.log(ids);

  try {
    const assemblies = await Assembly.find({ _id: { $in: ids } });

    if (assemblies.length === 0) {
      return res.status(404).send("No assemblies found");
    }

    res.status(200).send(assemblies);
  } catch (error) {
    console.error("Error fetching assemblies", error);
    res.status(500).send("Server error fetching assemblies");
  }
};

module.exports = {
  getAssembliesFilemaker,
  getEquipmentFilemaker,
  scheduleEquipment,
  assemblyExport,
  equipmentExport,
  getAssemblyTimeBlocks,
  findAssemblyByType,
  findEquipmentByAssemblyId,
  equipmentMappingExport,
  getAssembliesFromCode,
  getAssemblyByAssemblyId,
  getAssemblyById,
  getAssembliesByIds,
};

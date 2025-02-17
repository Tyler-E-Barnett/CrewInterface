const { TimeBlock } = require("../models/timeBlockModels");
const { Facility } = require("../models/facilityModels");

const deleteTimeBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTimeBlock = await TimeBlock.findByIdAndDelete(id);

    if (!deletedTimeBlock) {
      return res.status(404).json({ message: "TimeBlock not found" });
    }

    res
      .status(200)
      .json({ message: "TimeBlock deleted successfully", deletedTimeBlock });
  } catch (error) {
    console.error("Error deleting TimeBlock:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteTimeBlocks = async (req, res) => {
  const { timeblockIds } = req.body;
  console.log("timeblocks to be deleted:", timeblockIds);

  try {
    await TimeBlock.deleteMany({ _id: { $in: timeblockIds } });
    res.status(200).send("Timeblocks deleted successfully");
  } catch (error) {
    console.error("Error deleting timeblocks:", error);
    res.status(500).send("Failed to delete timeblocks");
  }
};

const getTimeBlockById = async (req, res) => {
  try {
    const { id } = req.params;
    const timeBlock = await TimeBlock.findById(id).populate("locationId");

    if (!timeBlock) {
      return res.status(404).json({ message: "TimeBlock not found" });
    }

    res.status(200).json(timeBlock);
  } catch (error) {
    console.error("Error fetching TimeBlock:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = getTimeBlockById;

module.exports = { deleteTimeBlock, deleteTimeBlocks, getTimeBlockById };

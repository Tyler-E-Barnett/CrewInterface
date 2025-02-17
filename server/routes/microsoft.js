const { Router } = require("express");
const microsoftRouter = Router();
const {
  getShopShifts,
  getTimeOffs,
  shopShiftsToTimeBlock,
  timeOffsToTimeBlock,
} = require("../controllers/teamsShiftsControllers");

const { msAuthUUID } = require("../controllers/authControllers");

microsoftRouter.get("/shopShifts", getShopShifts);
microsoftRouter.get("/timeOffs", getTimeOffs);
microsoftRouter.put("/shopShiftsToTimeBlocks/:date", shopShiftsToTimeBlock);
microsoftRouter.put("/timeOffsToTimeBlocks/:date", timeOffsToTimeBlock);
microsoftRouter.get("/authClientId", msAuthUUID);

module.exports = { microsoftRouter };

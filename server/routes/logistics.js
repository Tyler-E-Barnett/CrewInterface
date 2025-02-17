const { Router } = require("express");
const logisticsRouter = Router();
const {
  getUserScheduleWorkWeek,
  getScheduleWorkWeek,
} = require("../controllers/logisticControllers");

logisticsRouter.get("/availability/:date/:userId", getUserScheduleWorkWeek);
logisticsRouter.get("/availability/:date", getScheduleWorkWeek);

module.exports = { logisticsRouter };

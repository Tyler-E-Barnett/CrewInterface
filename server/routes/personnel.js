const { Router } = require("express");
const personnelRouter = Router();
const {
  getUsername,
  getCrew,
  getNameFromMsId,
} = require("../controllers/personnelControllers");

personnelRouter.get("/username/:userId", getUsername);
personnelRouter.get("/getCrew", getCrew);
personnelRouter.get("/microsoft/:userId", getNameFromMsId);

module.exports = { personnelRouter };

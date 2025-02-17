const { Router } = require("express");
const { logisticsRouter } = require("./logistics");

const apiRouter = Router();

apiRouter.use("/logistics", logisticsRouter);

module.exports = { apiRouter };

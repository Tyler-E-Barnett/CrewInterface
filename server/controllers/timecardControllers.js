const { Punch } = require("../models/timecardModels");

const punchesToday = async (req, res) => {
  console.log("getting punches...");
  const today = new Date();
  let end = new Date(today);
  end = new Date(end.setDate(today.getDate() + 1)).toISOString();

  today.setHours(0, 0, 0, 0);
  const start = new Date(today).toISOString();

  const allPunches = await Punch.find({
    timeStampIn: { $gte: start },
  });
  // const allPunches = await Punch.find();
  console.log(start);
  // const count = allPunches.length;
  // allPunches.unshift({ count: count });
  if (!allPunches) res.status(400).send({ error: "No task was found" });
  res.status(200).send(allPunches);
};

module.exports = { punchesToday };

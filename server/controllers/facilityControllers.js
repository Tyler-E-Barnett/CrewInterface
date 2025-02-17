const { Facility } = require("../models/facilityModels");

const facilityExport = async (req, res) => {
  const {
    fmRecordId,
    facilityName,
    address,
    city,
    state,
    zipCode,
    phone,
    type,
    zone,
  } = req.body;

  try {
    await Facility.findOneAndUpdate(
      { fmRecordId },
      {
        $set: {
          facilityName,
          address,
          city,
          state,
          zipCode,
          phone,
          type,
          zone,
        },
      },
      { new: true, upsert: true }
    );
    res.status(200).send("Facility Successfully Exported");
  } catch (error) {
    console.log("error exporting facility data", error);
    res.status(500).send("error exporting facility data");
  }
};

const facilityLookup = async (req, res) => {
  console.log("looking up facility");
  try {
    const { fmId, id } = req.query;

    const query = {};

    if (fmId) {
      query.fmRecordId = fmId;
    }

    if (id) {
      query._id = id;
    }

    const result = await Facility.findOne(query);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  facilityExport,
  facilityLookup,
};

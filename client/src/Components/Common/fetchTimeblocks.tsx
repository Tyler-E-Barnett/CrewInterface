import axios from "axios";

const fetchTimeblocks = async (contextType, itemId, start, end) => {
  try {
    console.log("Fetching with params:", { contextType, itemId, start, end }); // Log the params
    const response = await axios.get("/api/logistics/timeblock/lookup", {
      params: {
        contextType,
        itemId,
        start,
        end,
      },
    });
    console.log("Response data:", response.data);
    return response.data; // Return the data or handle it as needed
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow the error if you want to handle it elsewhere
  }
};

export default fetchTimeblocks;

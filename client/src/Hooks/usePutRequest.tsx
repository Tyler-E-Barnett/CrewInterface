import { useState } from "react";
import axios from "axios";

function usePutRequest() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendPutRequest = async (url, body) => {
    setLoading(true);
    setData(null);
    setError(null);
    try {
      const response = await axios.put(url, body);
      setData(response.data); // Assuming the response has the data you need
      setLoading(false);
      return response.data; // Optional: return data for immediate use
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err; // Optional: re-throw to let the caller handle the exception
    }
  };

  return { sendPutRequest, data, loading, error };
}

export default usePutRequest;

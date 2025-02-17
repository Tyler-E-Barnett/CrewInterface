import { useState, useEffect } from "react";
import axios, { AxiosResponse } from "axios";

const useFetchData = (url: string) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // console.log(url);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const response: AxiosResponse<[]> = await axios.get(url);
        // console.log("API Response:", response.data);
        setData(response.data);
        setLoading(false);
      } catch (error) {
        // console.error("Fetching Error:", err);
        setError(`An error occurred while fetching data: ${error}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};

export default useFetchData;

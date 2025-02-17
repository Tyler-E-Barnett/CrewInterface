// components/DataFetcher.js
import { useEffect } from "react";
import useFetchData from "../../Hooks/useFetchData";
import LoadingSpinner from "../../assets/LoadingSpinner";

const DataFetcher = ({ url, children, fetchKey }) => {
  const { data, loading, error } = useFetchData(url);

  useEffect(() => {}, [fetchKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center m-auto">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-error">Error</div>;
  }

  return children(data);
};

export default DataFetcher;

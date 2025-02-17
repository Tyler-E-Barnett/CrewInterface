// components/PutRequestHandler.js
import React from "react";
import usePutRequest from "../../Hooks/usePutRequest";
import LoadingSpinner from "../../assets/LoadingSpinner"; // Ensure you have a LoadingSpinner component

const PutRequestHandler = ({ url, body, children }) => {
  const { data, loading, error, sendPutRequest } = usePutRequest();

  // You might want to trigger the PUT request based on specific conditions
  // For instance, you could use useEffect to send it when url or body changes
  React.useEffect(() => {
    if (url && body) {
      sendPutRequest(url, body).catch(console.error);
    }
  }, [url, body, sendPutRequest]);

  if (loading) {
    return (
      <div className="flex items-center justify-center m-auto">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">Error: {error.message}</div>
    );
  }

  return children(data);
};

export default PutRequestHandler;

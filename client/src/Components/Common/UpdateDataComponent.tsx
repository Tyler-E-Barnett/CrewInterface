// SomeComponent.js
import React, { useState } from "react";
import PutRequestHandler from "./PutRequestHandler";

function UpdateDataComponent({ link, data }) {
  const [url, setUrl] = useState(link);
  const [body, setBody] = useState(data);

  const updateBody = (newBody) => {
    setBody(newBody);
  };

  return (
    <PutRequestHandler url={url} body={body}>
      {(data) => (
        <div>
          <h1>Update Success</h1>
          <div>Response Data: {JSON.stringify(data)}</div>
          <button onClick={() => updateBody({ key: "newValue" })}>
            Update Data
          </button>
        </div>
      )}
    </PutRequestHandler>
  );
}

export default UpdateDataComponent;

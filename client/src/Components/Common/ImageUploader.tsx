import React, { useState } from "react";
import axios from "axios";

function ImageUploader() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // State to hold the preview URL
  const [tags, setTags] = useState([{ key: "", value: "" }]);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle changes to key and value inputs
  const handleTagChange = (index, field, value) => {
    const newTags = tags.map((tag, i) => {
      if (i === index) {
        return { ...tag, [field]: value };
      }
      return tag;
    });
    setTags(newTags);
  };

  // Add a new tag input pair
  const addTag = () => {
    setTags([...tags, { key: "", value: "" }]);
  };

  // Remove a tag input pair
  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const tagsObject = tags.reduce((obj, tag) => {
      if (tag.key && tag.value) {
        obj[tag.key] = tag.value;
      }
      return obj;
    }, {});

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tags", JSON.stringify(tagsObject));

    try {
      const response = await axios.post("/api/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Upload successful: " + response.data.url);
      setPreviewUrl(null); // Optionally clear the preview after upload
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Upload failed!");
    }
  };

  return (
    <div className="max-w-md p-4 mx-auto mt-10 bg-white rounded-lg shadow-lg">
      <h2 className="mb-2 text-lg font-semibold text-gray-700">
        Upload an Image
      </h2>
      <input
        type="file"
        onChange={handleFileChange}
        accept="image/*"
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
      />
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview"
          className="h-auto max-w-full mt-2 mb-4 rounded"
        />
      )}
      {tags.map((tag, index) => (
        <div key={index} className="flex items-center mb-2">
          <input
            type="text"
            value={tag.key}
            placeholder="Enter tag key"
            onChange={(e) => handleTagChange(index, "key", e.target.value)}
            className="flex-1 p-1 mr-2 border rounded shadow-sm"
          />
          <input
            type="text"
            value={tag.value}
            placeholder="Enter tag value"
            onChange={(e) => handleTagChange(index, "value", e.target.value)}
            className="flex-1 p-1 mr-2 border rounded shadow-sm"
          />
          <button
            onClick={() => removeTag(index)}
            className="text-red-500 hover:text-red-700"
          >
            &minus;
          </button>
          {index === tags.length - 1 && (
            <button
              onClick={addTag}
              className="ml-2 text-green-500 hover:text-green-700"
            >
              &#43;
            </button>
          )}
        </div>
      ))}
      <button
        onClick={handleUpload}
        className="px-4 py-2 mt-3 font-bold text-white bg-blue-500 rounded shadow hover:bg-blue-700"
      >
        Upload Image
      </button>
    </div>
  );
}

export default ImageUploader;

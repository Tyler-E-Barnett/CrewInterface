require("dotenv").config({ path: "../.env" });
const { BlobServiceClient } = require("@azure/storage-blob");
const { generateBlobSasToken, uploadBlob } = require("../modules/Azure");

// Azure setup
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING.toString();

const uploadFile = async (req, res) => {
  console.log("uploading...");
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  // Ensure parsing occurs here after multer processing
  let tags = req.body.tags;
  try {
    if (typeof tags === "string") {
      tags = JSON.parse(tags); // Convert string to JSON
    }
  } catch (error) {
    console.error("Error parsing tags:", error);
    return res
      .status(400)
      .send("Tags must be provided as a valid JSON object.");
  }

  if (!tags || typeof tags !== "object") {
    console.log("Tags must be provided as an object.");
    return res.status(400).send("Tags must be provided as an object.");
  }

  const containerName = "images";
  const blobName = req.file.originalname;
  const blobContent = req.file.buffer;

  try {
    const url = await uploadBlob(containerName, blobName, blobContent, tags); // Make sure uploadBlob accepts tags
    const sasToken = generateBlobSasToken(containerName, blobName);
    const sasUrl = `${url}?${sasToken}`;

    console.log("SAS URL:", sasUrl);
    res.send({ message: "File uploaded successfully!", url: sasUrl });
  } catch (error) {
    console.error("Error uploading file:", error.message);
    res.status(500).send("Failed to upload file");
  }
};

const getBlob = async (req, res) => {
  const containerName = req.query.container;
  const blobName = req.query.blob; // Optional specific blob retrieval
  const includeTags = req.query.includeTags === "true"; // Check if tags should be included

  if (!containerName) {
    return res.status(400).send("Container name is required.");
  }

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  try {
    if (blobName) {
      // Retrieve specific blob URL
      const blobClient = containerClient.getBlobClient(blobName);
      const url = blobClient.url;
      const sasToken = generateBlobSasToken(containerName, blobName);
      const sasUrl = `${url}?${sasToken}`;

      let tags = {};
      if (includeTags) {
        // Only retrieve tags if requested
        const tagResponse = await blobClient.getTags();
        tags = tagResponse.tags;
      }

      return res.send({ name: blobName, url, sasURL: sasUrl, tags });
    } else {
      // List all blobs in the container
      const iterator = containerClient.listBlobsFlat();
      const blobs = [];

      for await (const blob of iterator) {
        const blobClient = containerClient.getBlobClient(blob.name);

        let tags = {};
        if (includeTags) {
          // Retrieve tags for each blob if requested
          const tagResponse = await blobClient.getTags();
          tags = tagResponse.tags;
        }

        blobs.push({ name: blob.name, url: blobClient.url, tags });
      }

      res.send(blobs);
    }
  } catch (error) {
    console.error("Error retrieving blob information:", error);
    res.status(500).send("Error retrieving blob information");
  }
};

module.exports = { getBlob, uploadFile };

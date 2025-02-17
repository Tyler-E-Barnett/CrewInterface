require("dotenv").config({ path: "../.env" });
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} = require("@azure/storage-blob");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING.toString();

// Function to generate a SAS token for a blob
function generateBlobSasToken(containerName, blobName) {
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);

  const accountName = blobServiceClient.accountName;
  const accountKey = connectionString.match(/AccountKey=([^;]+)/)[1];

  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey
  );

  const permissions = BlobSASPermissions.parse("r"); // Typically, you only need read permissions for a URL you're sharing
  const startsOn = new Date();
  const expiresOn = new Date(new Date().valueOf() + 60 * 60 * 1000); // 1 hour expiration

  const sasOptions = {
    containerName,
    blobName,
    permissions,
    startsOn,
    expiresOn,
  };

  const sasToken = generateBlobSASQueryParameters(
    sasOptions,
    sharedKeyCredential
  ).toString();

  return sasToken;
}

async function uploadBlob(containerName, blobName, content, tags) {
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlockBlobClient(blobName);

  const uploadBlobResponse = await blobClient.upload(content, content.length, {
    tags: tags, // Ensure tags are properly formatted and passed
  });

  console.log(
    `Upload block blob ${blobName} successfully`,
    uploadBlobResponse.requestId
  );

  return blobClient.url;
}

module.exports = { generateBlobSasToken, uploadBlob };

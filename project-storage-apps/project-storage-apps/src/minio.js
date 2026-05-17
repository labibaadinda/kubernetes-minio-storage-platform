const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
  region: process.env.MINIO_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
  forcePathStyle: true, // required for MinIO
});

const BUCKET = process.env.MINIO_BUCKET || "uploads";

module.exports = { s3, BUCKET };

const express = require("express");
const multer = require("multer");
const {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const { s3, BUCKET } = require("./minio");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const NODE_ID = process.env.NODE_ID || "unknown";

// POST /api/upload - upload a file
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided" });

  const ext = req.file.originalname.split(".").pop();
  const key = `${uuidv4()}.${ext}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        Metadata: {
          originalname: req.file.originalname,
          uploadedby: NODE_ID,
        },
      })
    );

    res.json({
      success: true,
      key,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      handledBy: NODE_ID,
    });
  } catch (err) {
    console.error("[upload error]", err);
    res.status(500).json({ error: "Upload failed", detail: err.message });
  }
});

// GET /api/files - list all files
router.get("/files", async (req, res) => {
  try {
    const data = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET }));
    const files = (data.Contents || []).map((obj) => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
    }));
    res.json({ files, handledBy: NODE_ID });
  } catch (err) {
    console.error("[list error]", err);
    res.status(500).json({ error: "Failed to list files", detail: err.message });
  }
});

// GET /api/presign/:key - generate presigned download URL
router.get("/presign/:key", async (req, res) => {
  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: req.params.key }),
      { expiresIn: 3600 }
    );
    res.json({ url, handledBy: NODE_ID });
  } catch (err) {
    console.error("[presign error]", err);
    res.status(500).json({ error: "Presign failed", detail: err.message });
  }
});

// DELETE /api/files/:key - delete a file
router.delete("/files/:key", async (req, res) => {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: req.params.key }));
    res.json({ success: true, key: req.params.key, handledBy: NODE_ID });
  } catch (err) {
    console.error("[delete error]", err);
    res.status(500).json({ error: "Delete failed", detail: err.message });
  }
});

// GET /api/health - health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", nodeId: NODE_ID, ts: new Date().toISOString() });
});

module.exports = router;

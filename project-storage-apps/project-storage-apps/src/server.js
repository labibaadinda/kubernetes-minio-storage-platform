require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ID = process.env.NODE_ID || "node-unknown";

app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "../public")));

// API routes
app.use("/api", routes);

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`[${NODE_ID}] Running on http://localhost:${PORT}`);
});

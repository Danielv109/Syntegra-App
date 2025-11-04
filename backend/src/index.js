import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import insightsRouter from "./routes/insights.js";
import uploadRouter from "./routes/upload.js";
import processRouter from "./routes/process.js";
import analyticsRouter from "./routes/analytics.js";
import reportsRouter from "./routes/reports.js";
import settingsRouter from "./routes/settings.js";
import clientsRouter from "./routes/clients.js";
import validationRouter from "./routes/validation.js";
import messagesRouter from "./routes/messages.js";
import connectorsRouter from "./routes/connectors.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/insights", insightsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/process", processRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/validation", validationRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/connectors", connectorsRouter);

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📊 Endpoints available:`);
  console.log(`   - GET  /health`);
  console.log(`   - GET  /api/insights`);
  console.log(`   - POST /api/upload`);
  console.log(`   - GET  /api/upload/history`);
  console.log(`   - GET  /api/analytics`);
  console.log(`   - GET  /api/reports`);
  console.log(`   - POST /api/reports/generate`);
  console.log(`   - GET  /api/settings`);
  console.log(`   - PUT  /api/settings`);
  console.log(`   - GET  /api/clients`);
  console.log(`   - GET  /api/validation/queue/:clientId`);
  console.log(`   - GET  /api/messages/:clientId`);
  console.log(`   - GET  /api/connectors/:clientId`);
});

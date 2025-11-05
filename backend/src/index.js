import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import clientsRoutes from "./routes/clients.js";
import insightsRoutes from "./routes/insights.js";
import analyticsRoutes from "./routes/analytics.js";
import validationRoutes from "./routes/validation.js";
import messagesRoutes from "./routes/messages.js";
import connectorsRoutes from "./routes/connectors.js";
import uploadRoutes from "./routes/upload.js";
import processRoutes from "./routes/process.js";
import reportsRoutes from "./routes/reports.js";
import settingsRoutes from "./routes/settings.js";
import authRoutes from "./routes/auth.js";
import { authenticate } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Ruta de autenticación (pública - sin protección)
app.use("/api/auth", authRoutes);

// ============================================
// TODAS LAS RUTAS PROTEGIDAS CON AUTENTICACIÓN
// ============================================
app.use("/api/clients", authenticate, clientsRoutes);
app.use("/api/insights", authenticate, insightsRoutes);
app.use("/api/analytics", authenticate, analyticsRoutes);
app.use("/api/validation", authenticate, validationRoutes);
app.use("/api/messages", authenticate, messagesRoutes);
app.use("/api/connectors", authenticate, connectorsRoutes);
app.use("/api/upload", authenticate, uploadRoutes);
app.use("/api/process", authenticate, processRoutes);
app.use("/api/reports", authenticate, reportsRoutes);
app.use("/api/settings", authenticate, settingsRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Syntegra API - Sistema de autenticación activo" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`🔒 Autenticación JWT activa - Todas las rutas protegidas`);
});

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
import {
  authenticate,
  authorizeClient,
  requireAdmin,
} from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ============================================
// RUTA PÚBLICA - AUTENTICACIÓN
// ============================================
app.use("/api/auth", authRoutes);

// ============================================
// TODAS LAS RUTAS PROTEGIDAS CON AUTENTICACIÓN + AUTORIZACIÓN
// ============================================

// Clientes - Solo admin puede crear/editar/eliminar
app.use("/api/clients", authenticate, clientsRoutes);

// Insights - Requiere autenticación y autorización por cliente
app.use("/api/insights", authenticate, authorizeClient, insightsRoutes);

// Analytics - Requiere autenticación y autorización por cliente
app.use("/api/analytics", authenticate, authorizeClient, analyticsRoutes);

// Validation - Requiere autenticación y autorización por cliente
app.use("/api/validation", authenticate, authorizeClient, validationRoutes);

// Messages - Requiere autenticación y autorización por cliente
app.use("/api/messages", authenticate, authorizeClient, messagesRoutes);

// Connectors - Requiere autenticación y autorización por cliente
app.use("/api/connectors", authenticate, authorizeClient, connectorsRoutes);

// Upload - Requiere autenticación y autorización por cliente
app.use("/api/upload", authenticate, authorizeClient, uploadRoutes);

// Process - Requiere autenticación y autorización por cliente
app.use("/api/process", authenticate, authorizeClient, processRoutes);

// Reports - Requiere autenticación y autorización por cliente
app.use("/api/reports", authenticate, authorizeClient, reportsRoutes);

// Settings - Requiere autenticación y autorización por cliente
app.use("/api/settings", authenticate, authorizeClient, settingsRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Syntegra API - Sistema de autenticación y autorización activo",
    version: "1.0.0",
    security: "JWT + Role-based access control",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`🔒 Autenticación JWT activa`);
  console.log(`🛡️  Autorización por cliente activa`);
  console.log(`✅ Todas las rutas de datos protegidas`);
});

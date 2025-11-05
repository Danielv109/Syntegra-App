import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pool from "../db/connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configurar almacenamiento con multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos CSV"));
    }
  },
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { clientId, channel } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Verificar que el cliente existe
    const clientCheck = await pool.query(
      "SELECT id FROM clients WHERE id = $1",
      [clientId]
    );
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    console.log(
      `📤 Upload realizado por ${req.user.username} para cliente ${clientId}`
    );

    // Crear trabajo en la cola
    const jobId = `job_${Date.now()}`;

    await pool.query(
      `INSERT INTO jobs (id, client_id, type, file_path, status, total_records)
       VALUES ($1, $2, 'upload', $3, 'pending', 0)`,
      [jobId, clientId, req.file.path]
    );

    console.log(`✅ Trabajo creado: ${jobId} - Archivo: ${req.file.filename}`);

    res.json({
      success: true,
      jobId,
      filename: req.file.originalname,
      message: "Archivo recibido. Procesamiento iniciado en segundo plano.",
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    // Verificar que el cliente existe
    const clientCheck = await pool.query(
      "SELECT id FROM clients WHERE id = $1",
      [clientId]
    );
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    console.log(
      `📜 Historial de uploads solicitado por ${req.user.username} para cliente ${clientId}`
    );

    const result = await pool.query(
      `SELECT 
        j.id as job_id,
        j.file_path,
        j.status,
        j.total_records,
        j.processed_records,
        j.error_message,
        j.created_at,
        j.completed_at
       FROM jobs j
       WHERE j.client_id = $1
       ORDER BY j.created_at DESC
       LIMIT 20`,
      [clientId]
    );

    const uploads = result.rows.map((row) => ({
      jobId: row.job_id,
      filename: path.basename(row.file_path),
      channel: "csv",
      recordCount: row.total_records,
      processedCount: row.processed_records,
      status: row.status,
      error: row.error_message,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    }));

    res.json({ uploads });
  } catch (error) {
    console.error("Error fetching upload history:", error);
    res.status(500).json({ error: "Failed to fetch upload history" });
  }
});

export default router;

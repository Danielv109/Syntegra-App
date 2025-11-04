import { Router } from "express";
import pool from "../db/connection.js";
import { generateReport } from "../services/pdf-generator.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    const result = await pool.query(
      `SELECT * FROM reports WHERE client_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [clientId]
    );

    res.json({ reports: result.rows });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const { clientId, title, type } = req.body;

    console.log(`📄 Generando reporte para cliente: ${clientId}`);

    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    // Obtener datos del cliente
    const clientResult = await pool.query(
      "SELECT * FROM clients WHERE id = $1",
      [clientId]
    );

    if (clientResult.rows.length === 0) {
      console.error(`❌ Cliente ${clientId} no encontrado`);
      return res.status(404).json({ error: "Client not found" });
    }

    const client = clientResult.rows[0];
    console.log(`✓ Cliente encontrado: ${client.name}`);

    // Verificar si hay mensajes
    const totalMessages = await pool.query(
      "SELECT COUNT(*) as count FROM messages WHERE client_id = $1",
      [clientId]
    );

    const messageCount = parseInt(totalMessages.rows[0].count);
    console.log(`📊 Total de mensajes: ${messageCount}`);

    if (messageCount === 0) {
      console.warn(`⚠️ No hay mensajes para generar reporte`);
      return res.status(400).json({
        error:
          "No hay datos suficientes para generar el reporte. Sube mensajes primero en 'Data Import'.",
      });
    }

    // Obtener KPIs
    const criticalComplaints = await pool.query(
      `SELECT COUNT(*) as count 
       FROM messages 
       WHERE client_id = $1 AND sentiment = 'negative' AND intent = 'queja'`,
      [clientId]
    );

    const positiveRate = await pool.query(
      `SELECT 
        ROUND(COUNT(CASE WHEN sentiment = 'positive' THEN 1 END)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 0) as rate
       FROM messages 
       WHERE client_id = $1`,
      [clientId]
    );

    // Sentimiento por canal
    const sentimentByChannel = await pool.query(
      `SELECT 
        channel,
        COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive,
        COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral,
        COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative
       FROM messages 
       WHERE client_id = $1 
       GROUP BY channel`,
      [clientId]
    );

    // Temas
    const topics = await pool.query(
      `SELECT 
        topic,
        COUNT(*) as count,
        CASE 
          WHEN AVG(CASE WHEN sentiment = 'positive' THEN 1 WHEN sentiment = 'negative' THEN -1 ELSE 0 END) > 0.3 THEN 'positive'
          WHEN AVG(CASE WHEN sentiment = 'positive' THEN 1 WHEN sentiment = 'negative' THEN -1 ELSE 0 END) < -0.3 THEN 'negative'
          ELSE 'neutral'
        END as sentiment
       FROM messages 
       WHERE client_id = $1 
       GROUP BY topic 
       ORDER BY count DESC 
       LIMIT 5`,
      [clientId]
    );

    // Alertas (mensajes críticos)
    const alerts = await pool.query(
      `SELECT text, sentiment, topic, intent
       FROM messages 
       WHERE client_id = $1 
       AND sentiment = 'negative' 
       ORDER BY timestamp DESC
       LIMIT 3`,
      [clientId]
    );

    const reportData = {
      kpis: [
        {
          label: "Total de Mensajes",
          value: messageCount.toString(),
          delta: null,
          trend: null,
        },
        {
          label: "Quejas Críticas",
          value: criticalComplaints.rows[0].count.toString(),
          delta: null,
          trend: "down",
        },
        {
          label: "Sentimiento Positivo",
          value: `${positiveRate.rows[0].rate || 0}%`,
          delta: null,
          trend: parseInt(positiveRate.rows[0].rate || 0) >= 60 ? "up" : "down",
        },
        {
          label: "Canales Activos",
          value: sentimentByChannel.rows.length.toString(),
          delta: null,
          trend: null,
        },
      ],
      sentimentByChannel: sentimentByChannel.rows.map((row) => ({
        channel: row.channel,
        positive: parseInt(row.positive),
        neutral: parseInt(row.neutral),
        negative: parseInt(row.negative),
      })),
      topics: topics.rows.map((row) => ({
        topic: row.topic,
        count: parseInt(row.count),
        sentiment: row.sentiment,
      })),
      alerts: alerts.rows.map((row) => ({
        message:
          row.text.length > 150 ? `${row.text.substring(0, 150)}...` : row.text,
        severity: row.sentiment === "negative" ? "high" : "medium",
      })),
    };

    console.log(`🎨 Generando PDF con datos reales...`);

    // Generar PDF
    const { filename, filepath } = await generateReport(reportData, client);

    console.log(`✅ PDF generado exitosamente: ${filename}`);
    console.log(`📁 Ubicación: ${filepath}`);

    // Guardar registro en base de datos
    const reportId = `rpt_${Date.now()}`;
    await pool.query(
      `INSERT INTO reports (id, client_id, title, type, filename, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'ready', NOW())`,
      [
        reportId,
        clientId,
        title || `Reporte ${new Date().toLocaleDateString()}`,
        type || "custom",
        filename,
      ]
    );

    const newReport = await pool.query("SELECT * FROM reports WHERE id = $1", [
      reportId,
    ]);

    console.log(`💾 Reporte guardado en BD con ID: ${reportId}`);

    res.json({
      success: true,
      report: newReport.rows[0],
    });
  } catch (error) {
    console.error("❌ Error generating report:", error);
    res
      .status(500)
      .json({ error: "Failed to generate report: " + error.message });
  }
});

router.get("/download/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;

    console.log(`📥 Solicitud de descarga para reporte: ${reportId}`);

    const result = await pool.query("SELECT * FROM reports WHERE id = $1", [
      reportId,
    ]);

    if (result.rows.length === 0) {
      console.error(`❌ Reporte ${reportId} no encontrado en BD`);
      return res.status(404).json({ error: "Report not found" });
    }

    const report = result.rows[0];
    const reportsDir = path.join(__dirname, "../../reports");
    const filepath = path.join(reportsDir, report.filename);

    console.log(`📂 Buscando archivo en: ${filepath}`);

    if (!fs.existsSync(filepath)) {
      console.error(`❌ Archivo PDF no existe: ${filepath}`);
      return res.status(404).json({ error: "PDF file not found on disk" });
    }

    console.log(`✅ Enviando PDF: ${report.filename}`);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${report.filename}"`
    );

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("❌ Error downloading report:", error);
    res
      .status(500)
      .json({ error: "Failed to download report: " + error.message });
  }
});

export default router;

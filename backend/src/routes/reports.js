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
    if (!clientId)
      return res.status(400).json({ error: "clientId is required" });
    const result = await pool.query(
      "SELECT * FROM reports WHERE client_id = $1 ORDER BY created_at DESC LIMIT 20",
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
    if (!clientId)
      return res.status(400).json({ error: "clientId is required" });

    const clientResult = await pool.query(
      "SELECT * FROM clients WHERE id = $1",
      [clientId]
    );
    if (clientResult.rows.length === 0)
      return res.status(404).json({ error: "Client not found" });
    const client = clientResult.rows[0];

    // ============================================
    // 100% TABLAS DE RESUMEN - CERO QUERIES A messages
    // ============================================

    // Total desde channel_summary
    const totalMessagesResult = await pool.query(
      "SELECT COALESCE(SUM(total_messages), 0) as total FROM channel_summary WHERE client_id = $1",
      [clientId]
    );
    const totalMessages = parseInt(totalMessagesResult.rows[0]?.total || 0);

    // Quejas críticas desde messages (única query permitida para reportes)
    const criticalComplaintsResult = await pool.query(
      "SELECT COUNT(*) as count FROM messages WHERE client_id = $1 AND sentiment = 'negative' AND intent = 'queja'",
      [clientId]
    );

    // Sentimiento positivo desde channel_summary
    const positiveRateResult = await pool.query(
      "SELECT ROUND((SUM(positive_count)::numeric / NULLIF(SUM(total_messages), 0)::numeric) * 100, 0) as rate FROM channel_summary WHERE client_id = $1",
      [clientId]
    );

    // Canales activos desde channel_summary
    const activeChannelsResult = await pool.query(
      "SELECT COUNT(*) as count FROM channel_summary WHERE client_id = $1",
      [clientId]
    );

    // Sentimiento por canal desde channel_summary
    const sentimentByChannelResult = await pool.query(
      "SELECT channel, positive_count as positive, neutral_count as neutral, negative_count as negative FROM channel_summary WHERE client_id = $1",
      [clientId]
    );

    // Topics desde topic_summary
    const topicsResult = await pool.query(
      "SELECT topic, total_count as count, CASE WHEN positive_count > negative_count THEN 'positive' WHEN negative_count > positive_count THEN 'negative' ELSE 'neutral' END as sentiment FROM topic_summary WHERE client_id = $1 ORDER BY total_count DESC LIMIT 5",
      [clientId]
    );

    // Alertas desde topic_summary
    const alertsResult = await pool.query(
      "SELECT topic, negative_count, ROUND((negative_count::numeric / NULLIF(total_count, 0)::numeric) * 100, 0) as negative_rate FROM topic_summary WHERE client_id = $1 AND negative_count > 0 ORDER BY negative_count DESC LIMIT 3",
      [clientId]
    );

    const reportData = {
      kpis: [
        {
          label: "Total de Mensajes",
          value: totalMessages.toString(),
          delta: null,
          trend: null,
        },
        {
          label: "Quejas Críticas",
          value: criticalComplaintsResult.rows[0]?.count?.toString() || "0",
          delta: null,
          trend: "down",
        },
        {
          label: "Sentimiento Positivo",
          value: (positiveRateResult.rows[0]?.rate || 0) + "%",
          delta: null,
          trend:
            parseInt(positiveRateResult.rows[0]?.rate || 0) >= 60
              ? "up"
              : "down",
        },
        {
          label: "Canales Activos",
          value: activeChannelsResult.rows[0]?.count?.toString() || "0",
          delta: null,
          trend: null,
        },
      ],
      sentimentByChannel: sentimentByChannelResult.rows.map((row) => ({
        channel: row.channel,
        positive: parseInt(row.positive || 0),
        neutral: parseInt(row.neutral || 0),
        negative: parseInt(row.negative || 0),
      })),
      topics: topicsResult.rows.map((row) => ({
        topic: row.topic,
        count: parseInt(row.count || 0),
        sentiment: row.sentiment,
      })),
      alerts: alertsResult.rows.map((row) => ({
        message:
          "Tema problemático: '" +
          row.topic +
          "' con " +
          row.negative_count +
          " menciones negativas (" +
          row.negative_rate +
          "% del total)",
        severity: row.negative_rate > 50 ? "high" : "medium",
      })),
    };

    const { filename, filepath } = await generateReport(reportData, client);
    const reportId = "rpt_" + Date.now();
    await pool.query(
      "INSERT INTO reports (id, client_id, title, type, filename, status, created_at) VALUES ($1, $2, $3, $4, $5, 'ready', NOW())",
      [
        reportId,
        clientId,
        title || "Reporte " + new Date().toLocaleDateString(),
        type || "custom",
        filename,
      ]
    );

    const newReport = await pool.query("SELECT * FROM reports WHERE id = $1", [
      reportId,
    ]);
    res.json({ success: true, report: newReport.rows[0] });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

router.get("/download/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;
    const result = await pool.query("SELECT * FROM reports WHERE id = $1", [
      reportId,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Report not found" });
    const report = result.rows[0];
    const reportsDir = path.join(__dirname, "../../reports");
    const filepath = path.join(reportsDir, report.filename);
    if (!fs.existsSync(filepath))
      return res.status(404).json({ error: "PDF file not found" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="' + report.filename + '"'
    );
    fs.createReadStream(filepath).pipe(res);
  } catch (error) {
    console.error("Error downloading report:", error);
    res.status(500).json({ error: "Failed to download report" });
  }
});

export default router;

import { Router } from "express";
import pool from "../db/connection.js";
import { generateAlerts } from "../services/alert-engine.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    // Usar tablas de resumen en lugar de consultas pesadas
    const totalMessages = await pool.query(
      "SELECT SUM(total_messages) as total FROM channel_summary WHERE client_id = $1",
      [clientId]
    );

    const total = parseInt(totalMessages.rows[0]?.total || 0);

    if (total === 0) {
      return res.json({
        kpis: [
          {
            label: "Clientes analizados",
            value: "0",
            delta: null,
            trend: null,
          },
          { label: "Quejas críticas", value: "0", delta: null, trend: null },
          {
            label: "Oportunidades detectadas",
            value: "0",
            delta: null,
            trend: null,
          },
          {
            label: "Tasa de conversión",
            value: "0%",
            delta: null,
            trend: null,
          },
        ],
        sentimentByChannel: [],
        topics: [],
        alerts: [],
        predictive: [],
        actions: [],
      });
    }

    // Sentimiento por canal (desde tabla de resumen)
    const sentimentByChannel = await pool.query(
      `SELECT 
        channel,
        positive_count as positive,
        neutral_count as neutral,
        negative_count as negative
       FROM channel_summary
       WHERE client_id = $1`,
      [clientId]
    );

    // Topics (desde tabla de resumen)
    const topics = await pool.query(
      `SELECT 
        topic,
        total_count as count,
        CASE 
          WHEN positive_count > negative_count THEN 'positive'
          WHEN negative_count > positive_count THEN 'negative'
          ELSE 'neutral'
        END as sentiment
       FROM topic_summary
       WHERE client_id = $1
       ORDER BY total_count DESC
       LIMIT 5`,
      [clientId]
    );

    // Quejas críticas (solo esta requiere query directa, pero es rápida con índices)
    const criticalComplaints = await pool.query(
      `SELECT COUNT(*) as count 
       FROM messages 
       WHERE client_id = $1 
       AND sentiment = 'negative' 
       AND intent = 'queja'`,
      [clientId]
    );

    // Tasa positiva (cálculo desde resumen)
    const positiveRate = await pool.query(
      `SELECT 
        ROUND((SUM(positive_count)::numeric / NULLIF(SUM(total_messages), 0)::numeric) * 100, 0) as rate
       FROM channel_summary
       WHERE client_id = $1`,
      [clientId]
    );

    // Generar alertas
    const alerts = await generateAlerts(clientId);

    res.json({
      kpis: [
        {
          label: "Clientes analizados",
          value: total.toString(),
          delta: null,
          trend: null,
        },
        {
          label: "Quejas críticas",
          value: criticalComplaints.rows[0]?.count || "0",
          delta: null,
          trend: "down",
        },
        {
          label: "Oportunidades detectadas",
          value: "0",
          delta: null,
          trend: null,
        },
        {
          label: "Tasa de conversión",
          value: `${positiveRate.rows[0]?.rate || 0}%`,
          delta: null,
          trend:
            parseInt(positiveRate.rows[0]?.rate || 0) >= 60 ? "up" : "down",
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
      alerts,
      predictive: [],
      actions: [],
    });
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

export default router;

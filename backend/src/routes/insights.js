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

    // ============================================
    // SOLO USAR TABLAS DE RESUMEN - CERO QUERIES A messages
    // ============================================

    // Total desde channel_summary
    const totalResult = await pool.query(
      "SELECT COALESCE(SUM(total_messages), 0) as total FROM channel_summary WHERE client_id = $1",
      [clientId]
    );

    const total = parseInt(totalResult.rows[0]?.total || 0);

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

    // Sentimiento por canal desde channel_summary
    const sentimentByChannelResult = await pool.query(
      `SELECT 
        channel,
        positive_count as positive,
        neutral_count as neutral,
        negative_count as negative
       FROM channel_summary
       WHERE client_id = $1`,
      [clientId]
    );

    // Topics desde topic_summary
    const topicsResult = await pool.query(
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

    // Quejas críticas (única query permitida a messages para dashboard)
    const criticalComplaintsResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM messages 
       WHERE client_id = $1 
       AND sentiment = 'negative' 
       AND intent = 'queja'`,
      [clientId]
    );

    // Tasa positiva desde channel_summary
    const positiveRateResult = await pool.query(
      `SELECT 
        ROUND(
          (SUM(positive_count)::numeric / NULLIF(SUM(total_messages), 0)::numeric) * 100, 
          0
        ) as rate
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
          value: criticalComplaintsResult.rows[0]?.count?.toString() || "0",
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
          value: `${positiveRateResult.rows[0]?.rate || 0}%`,
          delta: null,
          trend:
            parseInt(positiveRateResult.rows[0]?.rate || 0) >= 60
              ? "up"
              : "down",
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

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

    // Obtener estadísticas reales de la base de datos
    const messagesResult = await pool.query(
      "SELECT COUNT(*) as total, sentiment, topic FROM messages WHERE client_id = $1 GROUP BY sentiment, topic",
      [clientId]
    );

    const totalMessages = await pool.query(
      "SELECT COUNT(*) as count FROM messages WHERE client_id = $1",
      [clientId]
    );

    const total = parseInt(totalMessages.rows[0]?.count || 0);

    // Si no hay mensajes, devolver estructura vacía
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

    // Calcular métricas reales
    const sentimentByChannelResult = await pool.query(
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

    const topicsResult = await pool.query(
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

    const criticalComplaintsResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM messages 
       WHERE client_id = $1 
       AND sentiment = 'negative' 
       AND intent = 'queja'`,
      [clientId]
    );

    const positiveRate = await pool.query(
      `SELECT 
        ROUND(COUNT(CASE WHEN sentiment = 'positive' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 0) as rate
       FROM messages 
       WHERE client_id = $1`,
      [clientId]
    );

    // Generar alertas inteligentes
    const alerts = await generateAlerts(clientId);

    const insights = {
      kpis: [
        {
          label: "Clientes analizados",
          value: total.toString(),
          delta: null,
          trend: null,
        },
        {
          label: "Quejas críticas",
          value: criticalComplaintsResult.rows[0]?.count || "0",
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
      sentimentByChannel: sentimentByChannelResult.rows.map((row) => ({
        channel: row.channel,
        positive: parseInt(row.positive),
        neutral: parseInt(row.neutral),
        negative: parseInt(row.negative),
      })),
      topics: topicsResult.rows.map((row) => ({
        topic: row.topic,
        count: parseInt(row.count),
        sentiment: row.sentiment,
      })),
      alerts: alerts, // Alertas generadas dinámicamente
      predictive: [],
      actions: [],
    };

    res.json(insights);
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

export default router;

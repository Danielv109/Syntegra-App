import { Router } from "express";
import pool from "../db/connection.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    const totalMessages = await pool.query(
      "SELECT COUNT(*) as count FROM messages WHERE client_id = $1",
      [clientId]
    );

    const total = parseInt(totalMessages.rows[0]?.count || 0);

    // Si no hay mensajes, devolver estructura vacía
    if (total === 0) {
      return res.json({
        overview: {
          totalMessages: 0,
          avgSentiment: 0,
          topChannel: "N/A",
          responseRate: 0,
        },
        trends: {
          daily: [],
          weekly: [],
        },
        channelComparison: {},
      });
    }

    // Datos reales
    const avgSentimentResult = await pool.query(
      `SELECT 
        ROUND(COUNT(CASE WHEN sentiment = 'positive' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 0) as avg
       FROM messages 
       WHERE client_id = $1`,
      [clientId]
    );

    const topChannelResult = await pool.query(
      `SELECT channel, COUNT(*) as count 
       FROM messages 
       WHERE client_id = $1 
       GROUP BY channel 
       ORDER BY count DESC 
       LIMIT 1`,
      [clientId]
    );

    const channelComparisonResult = await pool.query(
      `SELECT 
        channel,
        COUNT(*) as messages,
        ROUND(COUNT(CASE WHEN sentiment = 'positive' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 0) as sentiment
       FROM messages 
       WHERE client_id = $1 
       GROUP BY channel`,
      [clientId]
    );

    const channelComparison = {};
    channelComparisonResult.rows.forEach((row) => {
      channelComparison[row.channel] = {
        messages: parseInt(row.messages),
        sentiment: parseInt(row.sentiment || 0),
        responseTime: "N/A",
      };
    });

    res.json({
      overview: {
        totalMessages: total,
        avgSentiment: parseInt(avgSentimentResult.rows[0]?.avg || 0),
        topChannel: topChannelResult.rows[0]?.channel || "N/A",
        responseRate: 0,
      },
      trends: {
        daily: [],
        weekly: [],
      },
      channelComparison,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;

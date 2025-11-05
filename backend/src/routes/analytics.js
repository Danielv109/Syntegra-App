import { Router } from "express";
import pool from "../db/connection.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    // Usar SOLO tablas de resumen para máximo rendimiento
    const totalMessages = await pool.query(
      "SELECT SUM(total_messages) as total FROM channel_summary WHERE client_id = $1",
      [clientId]
    );

    const total = parseInt(totalMessages.rows[0]?.total || 0);

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

    // Promedio de sentimiento desde resúmenes
    const avgSentiment = await pool.query(
      `SELECT 
        ROUND((SUM(positive_count)::numeric / NULLIF(SUM(total_messages), 0)::numeric) * 100, 0) as avg
       FROM channel_summary
       WHERE client_id = $1`,
      [clientId]
    );

    // Canal principal desde resúmenes
    const topChannel = await pool.query(
      `SELECT channel, total_messages
       FROM channel_summary
       WHERE client_id = $1
       ORDER BY total_messages DESC
       LIMIT 1`,
      [clientId]
    );

    // Tendencia diaria (últimos 7 días)
    const dailyTrend = await pool.query(
      `SELECT 
        TO_CHAR(date, 'DD/MM') as date,
        SUM(positive_count) as positive,
        SUM(neutral_count) as neutral,
        SUM(negative_count) as negative
       FROM daily_analytics
       WHERE client_id = $1
       AND date >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY date
       ORDER BY date ASC`,
      [clientId]
    );

    // Tendencia semanal (últimas 4 semanas)
    const weeklyTrend = await pool.query(
      `SELECT 
        'S' || TO_CHAR(date, 'WW') as week,
        SUM(positive_count) as positive,
        SUM(neutral_count) as neutral,
        SUM(negative_count) as negative
       FROM daily_analytics
       WHERE client_id = $1
       AND date >= CURRENT_DATE - INTERVAL '28 days'
       GROUP BY TO_CHAR(date, 'WW')
       ORDER BY week ASC`,
      [clientId]
    );

    // Comparativa por canal
    const channelComparison = await pool.query(
      `SELECT 
        channel,
        total_messages as messages,
        ROUND((positive_count::numeric / NULLIF(total_messages, 0)::numeric) * 100, 0) as sentiment,
        COALESCE(avg_response_time_hours, 0) as response_hours
       FROM channel_summary
       WHERE client_id = $1`,
      [clientId]
    );

    const channelComp = {};
    channelComparison.rows.forEach((row) => {
      channelComp[row.channel] = {
        messages: parseInt(row.messages),
        sentiment: parseInt(row.sentiment || 0),
        responseTime: row.response_hours > 0 ? `${row.response_hours}h` : "N/A",
      };
    });

    res.json({
      overview: {
        totalMessages: total,
        avgSentiment: parseInt(avgSentiment.rows[0]?.avg || 0),
        topChannel: topChannel.rows[0]?.channel || "N/A",
        responseRate: 0,
      },
      trends: {
        daily: dailyTrend.rows.map((r) => ({
          date: r.date,
          positive: parseInt(r.positive),
          neutral: parseInt(r.neutral),
          negative: parseInt(r.negative),
        })),
        weekly: weeklyTrend.rows.map((r) => ({
          week: r.week,
          positive: parseInt(r.positive),
          neutral: parseInt(r.neutral),
          negative: parseInt(r.negative),
        })),
      },
      channelComparison: channelComp,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;

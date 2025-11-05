import { Router } from "express";
import pool from "../db/connection.js";

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

    // Total de mensajes desde channel_summary
    const totalResult = await pool.query(
      "SELECT COALESCE(SUM(total_messages), 0) as total FROM channel_summary WHERE client_id = $1",
      [clientId]
    );

    const total = parseInt(totalResult.rows[0]?.total || 0);

    if (total === 0) {
      return res.json({
        overview: {
          totalMessages: 0,
          avgSentiment: 0,
          topChannel: "N/A",
          responseRate: 0,
        },
        trends: { daily: [], weekly: [] },
        channelComparison: {},
      });
    }

    // Promedio de sentimiento desde channel_summary
    const avgSentimentResult = await pool.query(
      `SELECT 
        ROUND(
          (SUM(positive_count)::numeric / NULLIF(SUM(total_messages), 0)::numeric) * 100, 
          0
        ) as avg
       FROM channel_summary
       WHERE client_id = $1`,
      [clientId]
    );

    // Canal principal desde channel_summary
    const topChannelResult = await pool.query(
      `SELECT channel, total_messages
       FROM channel_summary
       WHERE client_id = $1
       ORDER BY total_messages DESC
       LIMIT 1`,
      [clientId]
    );

    // Tendencia diaria (últimos 7 días) desde daily_analytics
    const dailyTrendResult = await pool.query(
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

    // Tendencia semanal (últimas 4 semanas) desde daily_analytics
    const weeklyTrendResult = await pool.query(
      `SELECT 
        'S' || TO_CHAR(date, 'WW') as week,
        SUM(positive_count) as positive,
        SUM(neutral_count) as neutral,
        SUM(negative_count) as negative
       FROM daily_analytics
       WHERE client_id = $1
       AND date >= CURRENT_DATE - INTERVAL '28 days'
       GROUP BY TO_CHAR(date, 'WW'), DATE_TRUNC('week', date)
       ORDER BY DATE_TRUNC('week', date) ASC`,
      [clientId]
    );

    // Comparativa por canal desde channel_summary
    const channelComparisonResult = await pool.query(
      `SELECT 
        channel,
        total_messages as messages,
        ROUND(
          (positive_count::numeric / NULLIF(total_messages, 0)::numeric) * 100, 
          0
        ) as sentiment,
        COALESCE(avg_response_time_hours, 0) as response_hours
       FROM channel_summary
       WHERE client_id = $1`,
      [clientId]
    );

    const channelComparison = {};
    channelComparisonResult.rows.forEach((row) => {
      channelComparison[row.channel] = {
        messages: parseInt(row.messages),
        sentiment: parseInt(row.sentiment || 0),
        responseTime: row.response_hours > 0 ? `${row.response_hours}h` : "N/A",
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
        daily: dailyTrendResult.rows.map((r) => ({
          date: r.date,
          positive: parseInt(r.positive || 0),
          neutral: parseInt(r.neutral || 0),
          negative: parseInt(r.negative || 0),
        })),
        weekly: weeklyTrendResult.rows.map((r) => ({
          week: r.week,
          positive: parseInt(r.positive || 0),
          neutral: parseInt(r.neutral || 0),
          negative: parseInt(r.negative || 0),
        })),
      },
      channelComparison,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;

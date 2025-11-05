import { Router } from "express";
import pool from "../db/connection.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: "clientId es requerido" });
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
      `📊 Analytics por ${req.user.username} para ${clientId} - SOLO RESÚMENES`
    );

    // ============================================
    // 100% TABLAS DE RESUMEN - CERO QUERIES A messages
    // ============================================

    // 1. Total de mensajes desde channel_summary
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
        topTopics: [],
      });
    }

    // 2. Promedio de sentimiento
    const avgSentimentResult = await pool.query(
      "SELECT ROUND((SUM(positive_count)::numeric / NULLIF(SUM(total_messages), 0)::numeric) * 100, 0) as avg FROM channel_summary WHERE client_id = $1",
      [clientId]
    );

    // 3. Canal principal
    const topChannelResult = await pool.query(
      "SELECT channel FROM channel_summary WHERE client_id = $1 ORDER BY total_messages DESC LIMIT 1",
      [clientId]
    );

    // 4. Tendencia diaria (últimos 7 días)
    const dailyTrendResult = await pool.query(
      `SELECT TO_CHAR(date, 'DD/MM') as date, SUM(positive_count) as positive, SUM(neutral_count) as neutral, SUM(negative_count) as negative 
       FROM daily_analytics WHERE client_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days' 
       GROUP BY date ORDER BY date ASC`,
      [clientId]
    );

    // 5. Tendencia semanal (últimas 4 semanas)
    const weeklyTrendResult = await pool.query(
      `SELECT 'S' || TO_CHAR(date, 'WW') as week, SUM(positive_count) as positive, SUM(neutral_count) as neutral, SUM(negative_count) as negative 
       FROM daily_analytics WHERE client_id = $1 AND date >= CURRENT_DATE - INTERVAL '28 days' 
       GROUP BY TO_CHAR(date, 'WW'), DATE_TRUNC('week', date) ORDER BY DATE_TRUNC('week', date) ASC`,
      [clientId]
    );

    // 6. Comparativa por canal
    const channelComparisonResult = await pool.query(
      `SELECT channel, total_messages as messages, 
       ROUND((positive_count::numeric / NULLIF(total_messages, 0)::numeric) * 100, 0) as sentiment, 
       COALESCE(avg_response_time_hours, 0) as response_hours 
       FROM channel_summary WHERE client_id = $1 ORDER BY total_messages DESC`,
      [clientId]
    );

    // 7. Top 5 topics
    const topTopicsResult = await pool.query(
      `SELECT topic, total_count as count, 
       ROUND((positive_count::numeric / NULLIF(total_count, 0)::numeric) * 100, 0) as positive_rate 
       FROM topic_summary WHERE client_id = $1 ORDER BY total_count DESC LIMIT 5`,
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
      topTopics: topTopicsResult.rows.map((r) => ({
        topic: r.topic,
        count: parseInt(r.count || 0),
        positiveRate: parseInt(r.positive_rate || 0),
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;

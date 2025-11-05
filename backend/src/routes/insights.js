import { Router } from "express";
import pool from "../db/connection.js";

const router = Router();

async function generateAlerts(clientId) {
  const alerts = [];

  try {
    console.log(`🚨 Alertas para ${clientId} - SOLO RESÚMENES`);

    // ============================================
    // 100% TABLAS DE RESUMEN - CERO QUERIES A messages
    // ============================================

    // 1. Detectar picos desde daily_analytics
    const spikeResult = await pool.query(
      `SELECT COALESCE(SUM(negative_count) FILTER (WHERE date = CURRENT_DATE), 0) as today_negatives, 
       COALESCE(SUM(negative_count) FILTER (WHERE date = CURRENT_DATE - 1), 0) as yesterday_negatives, 
       COALESCE(AVG(negative_count) FILTER (WHERE date >= CURRENT_DATE - 7 AND date < CURRENT_DATE), 0) as avg_7days 
       FROM daily_analytics WHERE client_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'`,
      [clientId]
    );

    const todayNegs = parseInt(spikeResult.rows[0]?.today_negatives || 0);
    const yesterdayNegs = parseInt(
      spikeResult.rows[0]?.yesterday_negatives || 0
    );
    const avg7days = parseFloat(spikeResult.rows[0]?.avg_7days || 0);

    if (
      yesterdayNegs > 0 &&
      todayNegs > yesterdayNegs * 1.5 &&
      todayNegs > avg7days * 2 &&
      todayNegs > 3
    ) {
      const increase = Math.round(
        ((todayNegs - yesterdayNegs) / yesterdayNegs) * 100
      );
      alerts.push({
        type: "spike",
        severity: "high",
        title: "Incremento anormal de quejas",
        message: `Pico de ${increase}% (${todayNegs} vs ${yesterdayNegs} ayer, promedio: ${Math.round(
          avg7days
        )})`,
        action: "Revisar causa raíz",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Temas problemáticos desde topic_summary
    const recurringResult = await pool.query(
      `SELECT topic, negative_count, 
       ROUND((negative_count::numeric / NULLIF(total_count, 0)::numeric) * 100, 0) as negative_rate 
       FROM topic_summary WHERE client_id = $1 AND negative_count > 5 
       AND (negative_count::numeric / NULLIF(total_count, 0)::numeric) > 0.4 
       ORDER BY negative_count DESC LIMIT 1`,
      [clientId]
    );

    if (recurringResult.rows.length > 0) {
      const issue = recurringResult.rows[0];
      alerts.push({
        type: "pattern",
        severity: "high",
        title: `Problema recurrente: ${issue.topic}`,
        message: `"${issue.topic}" con ${issue.negative_count} menciones negativas (${issue.negative_rate}%)`,
        action: "Analizar y diseñar estrategia",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Caída en sentimiento desde daily_analytics
    const trendResult = await pool.query(
      `SELECT AVG(positive_count::numeric / NULLIF(total_messages, 0)::numeric * 100) 
       FILTER (WHERE date >= CURRENT_DATE - 6 AND date <= CURRENT_DATE - 3) as previous_rate, 
       AVG(positive_count::numeric / NULLIF(total_messages, 0)::numeric * 100) 
       FILTER (WHERE date >= CURRENT_DATE - 2 AND date <= CURRENT_DATE) as current_rate 
       FROM daily_analytics WHERE client_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 days' AND total_messages > 0`,
      [clientId]
    );

    const prevRate = parseFloat(trendResult.rows[0]?.previous_rate || 0);
    const currRate = parseFloat(trendResult.rows[0]?.current_rate || 0);

    if (prevRate > 0 && currRate < prevRate * 0.8 && prevRate > 40) {
      alerts.push({
        type: "trend",
        severity: "medium",
        title: "Caída en satisfacción",
        message: `Sentimiento cayó de ${prevRate.toFixed(
          1
        )}% a ${currRate.toFixed(1)}%`,
        action: "Identificar factores de impacto",
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Canal problemático desde channel_summary
    const channelResult = await pool.query(
      `SELECT channel, total_messages as total, negative_count, 
       ROUND((negative_count::numeric / NULLIF(total_messages, 0)::numeric) * 100, 1) as negative_rate 
       FROM channel_summary WHERE client_id = $1 
       AND (negative_count::numeric / NULLIF(total_messages, 0)::numeric) > 0.4 
       AND total_messages > 10 ORDER BY negative_rate DESC LIMIT 1`,
      [clientId]
    );

    if (channelResult.rows.length > 0) {
      const channel = channelResult.rows[0];
      alerts.push({
        type: "channel",
        severity: "medium",
        title: `Problemas en ${channel.channel}`,
        message: `${channel.channel} con ${channel.negative_rate}% negativos (${channel.negative_count}/${channel.total})`,
        action: "Revisar tiempo de respuesta",
        timestamp: new Date().toISOString(),
      });
    }

    // 5. Oportunidades desde topic_summary
    const opportunityResult = await pool.query(
      `SELECT topic, positive_count as mentions, 
       ROUND((positive_count::numeric / NULLIF(total_count, 0)::numeric) * 100, 0) as positive_rate 
       FROM topic_summary WHERE client_id = $1 AND positive_count > 5 
       ORDER BY positive_count DESC LIMIT 1`,
      [clientId]
    );

    if (opportunityResult.rows.length > 0) {
      const opp = opportunityResult.rows[0];
      alerts.push({
        type: "opportunity",
        severity: "low",
        title: `Fortaleza: ${opp.topic}`,
        message: `"${opp.topic}" valorado positivamente (${opp.mentions} menciones, ${opp.positive_rate}%)`,
        action: "Capitalizar en marketing",
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  } catch (error) {
    console.error("❌ Error generating alerts:", error);
    return [];
  }
}

router.get("/", async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: "clientId es requerido" });
    }

    // Verificar que el cliente existe
    const clientCheck = await pool.query(
      "SELECT * FROM clients WHERE id = $1",
      [clientId]
    );
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    // La autorización ya fue verificada por el middleware authorizeClient
    console.log(
      `📊 Insights solicitado por ${req.user.username} para cliente ${clientId}`
    );

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

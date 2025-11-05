import pool from "../db/connection.js";

export async function generateAlerts(clientId) {
  const alerts = [];
  try {
    // 1. DETECTAR PICOS DESDE daily_analytics
    const spikeResult = await pool.query(
      "SELECT COALESCE(SUM(negative_count) FILTER (WHERE date = CURRENT_DATE), 0) as today_negatives, COALESCE(SUM(negative_count) FILTER (WHERE date = CURRENT_DATE - 1), 0) as yesterday_negatives FROM daily_analytics WHERE client_id = $1 AND date >= CURRENT_DATE - INTERVAL '1 day'",
      [clientId]
    );

    const todayNegs = parseInt(spikeResult.rows[0]?.today_negatives || 0);
    const yesterdayNegs = parseInt(
      spikeResult.rows[0]?.yesterday_negatives || 0
    );

    if (yesterdayNegs > 0 && todayNegs > yesterdayNegs * 1.5 && todayNegs > 3) {
      alerts.push({
        type: "spike",
        severity: "high",
        title: "Incremento anormal de quejas",
        message: `Se detectó un aumento del ${Math.round(
          ((todayNegs - yesterdayNegs) / yesterdayNegs) * 100
        )}% en sentimiento negativo hoy (${todayNegs} vs ${yesterdayNegs} ayer)`,
        action: "Revisar inmediatamente la causa raíz",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. TEMAS RECURRENTES PROBLEMÁTICOS DESDE topic_summary
    const recurringResult = await pool.query(
      "SELECT topic, last_7_days_count as mentions, negative_count, ROUND((negative_count::numeric / NULLIF(total_count, 0)::numeric) * 100, 0) as negative_rate FROM topic_summary WHERE client_id = $1 AND negative_count > 5 AND (negative_count::numeric / NULLIF(total_count, 0)::numeric) > 0.4 ORDER BY negative_count DESC LIMIT 1",
      [clientId]
    );

    if (recurringResult.rows.length > 0) {
      const issue = recurringResult.rows[0];
      alerts.push({
        type: "pattern",
        severity: "high",
        title: "Problema recurrente: " + issue.topic,
        message:
          "El tema '" +
          issue.topic +
          "' tiene " +
          issue.negative_count +
          " menciones negativas (" +
          issue.negative_rate +
          "% del total)",
        action: "Analizar casos de '" + issue.topic + "' y diseñar estrategia",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. CAÍDA EN SENTIMIENTO DESDE daily_analytics
    const trendResult = await pool.query(
      `SELECT 
        AVG(
          positive_count::numeric / NULLIF(total_messages, 0)::numeric * 100
        ) FILTER (WHERE date >= CURRENT_DATE - 6 AND date <= CURRENT_DATE - 3) as previous_rate,
        AVG(
          positive_count::numeric / NULLIF(total_messages, 0)::numeric * 100
        ) FILTER (WHERE date >= CURRENT_DATE - 2 AND date <= CURRENT_DATE) as current_rate
       FROM daily_analytics
       WHERE client_id = $1
       AND date >= CURRENT_DATE - INTERVAL '6 days'`,
      [clientId]
    );

    const prevRate = parseFloat(trendResult.rows[0]?.previous_rate || 0);
    const currRate = parseFloat(trendResult.rows[0]?.current_rate || 0);

    if (prevRate > 0 && currRate < prevRate * 0.8) {
      alerts.push({
        type: "trend",
        severity: "medium",
        title: "Caída en satisfacción del cliente",
        message: `El sentimiento positivo cayó de ${prevRate.toFixed(
          1
        )}% a ${currRate.toFixed(1)}% en los últimos días`,
        action:
          "Identificar factores que están impactando la percepción del cliente",
        timestamp: new Date().toISOString(),
      });
    }

    // 4. CANAL CON PROBLEMAS DESDE channel_summary
    const channelResult = await pool.query(
      "SELECT channel, total_messages as total, negative_count, ROUND((negative_count::numeric / NULLIF(total_messages, 0)::numeric) * 100, 1) as negative_rate FROM channel_summary WHERE client_id = $1 AND (negative_count::numeric / NULLIF(total_messages, 0)::numeric) > 0.4 AND total_messages > 10 ORDER BY negative_rate DESC LIMIT 1",
      [clientId]
    );

    if (channelResult.rows.length > 0) {
      const channel = channelResult.rows[0];
      alerts.push({
        type: "channel",
        severity: "medium",
        title: "Problemas en canal: " + channel.channel,
        message:
          "El canal " +
          channel.channel +
          " tiene " +
          channel.negative_rate +
          "% de mensajes negativos",
        action: "Revisar tiempo de respuesta en " + channel.channel,
        timestamp: new Date().toISOString(),
      });
    }

    // 5. OPORTUNIDADES DESDE topic_summary
    const opportunityResult = await pool.query(
      `SELECT 
        topic,
        positive_count as mentions
       FROM topic_summary
       WHERE client_id = $1
       AND positive_count > 5
       ORDER BY positive_count DESC
       LIMIT 1`,
      [clientId]
    );

    if (opportunityResult.rows.length > 0) {
      const opp = opportunityResult.rows[0];
      alerts.push({
        type: "opportunity",
        severity: "low",
        title: `Fortaleza detectada: ${opp.topic}`,
        message: `Los clientes valoran positivamente "${opp.topic}" (${opp.mentions} menciones positivas)`,
        action: `Capitalizar esta fortaleza en marketing y comunicación con clientes`,
        timestamp: new Date().toISOString(),
      });
    }

    // 6. VALIDACIÓN PENDIENTE (única query permitida a messages)
    const validationResult = await pool.query(
      "SELECT COUNT(*) as pending FROM messages WHERE client_id = $1 AND requires_validation = true AND validated = false",
      [clientId]
    );

    const pending = parseInt(validationResult.rows[0]?.pending || 0);
    if (pending > 10) {
      alerts.push({
        type: "action_required",
        severity: "medium",
        title: "Mensajes pendientes de validación",
        message: "Hay " + pending + " mensajes que requieren revisión humana",
        action: "Revisar en Validation para mejorar precisión",
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  } catch (error) {
    console.error("Error generating alerts:", error);
    return [];
  }
}

import pool from "../db/connection.js";

export async function generateAlerts(clientId) {
  const alerts = [];

  try {
    // 1. Detectar picos usando daily_analytics (rendimiento optimizado)
    const complaintsSpike = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE date = CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE date = CURRENT_DATE - 1) as yesterday
       FROM daily_analytics
       WHERE client_id = $1
       AND negative_count > 0`,
      [clientId]
    );

    const today = parseInt(complaintsSpike.rows[0]?.today || 0);
    const yesterday = parseInt(complaintsSpike.rows[0]?.yesterday || 0);

    if (today > yesterday * 1.5 && today > 3) {
      alerts.push({
        type: "spike",
        severity: "high",
        title: "Incremento anormal de quejas",
        message: `Se detectó un aumento del ${Math.round(
          ((today - yesterday) / yesterday) * 100
        )}% en quejas hoy (${today} vs ${yesterday} ayer)`,
        action:
          "Revisar inmediatamente la causa raíz y establecer plan de acción",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Temas recurrentes problemáticos desde topic_summary
    const recurringIssues = await pool.query(
      `SELECT 
        topic,
        last_7_days_count as mentions,
        negative_count
       FROM topic_summary
       WHERE client_id = $1
       AND negative_count > 5
       ORDER BY negative_count DESC
       LIMIT 1`,
      [clientId]
    );

    if (recurringIssues.rows.length > 0) {
      const issue = recurringIssues.rows[0];
      alerts.push({
        type: "pattern",
        severity: "high",
        title: `Problema recurrente: ${issue.topic}`,
        message: `El tema "${issue.topic}" ha generado ${issue.negative_count} menciones negativas recientemente`,
        action: `Analizar casos específicos de "${issue.topic}" y diseñar estrategia de mejora`,
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Canal con problemas desde channel_summary
    const channelPerformance = await pool.query(
      `SELECT 
        channel,
        total_messages as total,
        negative_count,
        ROUND((negative_count::numeric / NULLIF(total_messages, 0)::numeric) * 100, 1) as negative_rate
       FROM channel_summary
       WHERE client_id = $1
       AND (negative_count::numeric / NULLIF(total_messages, 0)::numeric) > 0.4
       ORDER BY negative_rate DESC
       LIMIT 1`,
      [clientId]
    );

    if (channelPerformance.rows.length > 0) {
      const channel = channelPerformance.rows[0];
      alerts.push({
        type: "channel",
        severity: "medium",
        title: `Problemas en canal: ${channel.channel}`,
        message: `El canal ${channel.channel} tiene ${channel.negative_rate}% de mensajes negativos (${channel.negative_count}/${channel.total})`,
        action: `Revisar tiempo de respuesta y calidad de atención en ${channel.channel}`,
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Mensajes pendientes de validación (única query a tabla principal)
    const pendingValidation = await pool.query(
      `SELECT COUNT(*) as pending 
       FROM messages 
       WHERE client_id = $1 
       AND requires_validation = true 
       AND validated = false`,
      [clientId]
    );

    const pending = parseInt(pendingValidation.rows[0]?.pending || 0);
    if (pending > 10) {
      alerts.push({
        type: "action_required",
        severity: "medium",
        title: "Mensajes pendientes de validación",
        message: `Hay ${pending} mensajes que requieren revisión humana`,
        action: `Revisar en la sección "Validation" para mejorar precisión del modelo`,
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  } catch (error) {
    console.error("Error generating alerts:", error);
    return [];
  }
}

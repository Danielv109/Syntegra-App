import pool from "../db/connection.js";

export async function generateAlerts(clientId) {
  const alerts = [];

  try {
    // 1. Detectar picos de quejas en las últimas 24h
    const complaintsSpike = await pool.query(
      `SELECT 
        COUNT(*) as recent_complaints,
        (SELECT COUNT(*) FROM messages 
         WHERE client_id = $1 
         AND sentiment = 'negative' 
         AND intent = 'queja' 
         AND timestamp < NOW() - INTERVAL '24 hours'
         AND timestamp > NOW() - INTERVAL '48 hours') as previous_complaints
       FROM messages 
       WHERE client_id = $1 
       AND sentiment = 'negative' 
       AND intent = 'queja' 
       AND timestamp > NOW() - INTERVAL '24 hours'`,
      [clientId]
    );

    const recent = parseInt(complaintsSpike.rows[0]?.recent_complaints || 0);
    const previous = parseInt(
      complaintsSpike.rows[0]?.previous_complaints || 0
    );

    if (recent > previous * 1.5 && recent > 3) {
      alerts.push({
        type: "spike",
        severity: "high",
        title: "Incremento anormal de quejas",
        message: `Se detectó un aumento del ${Math.round(
          ((recent - previous) / previous) * 100
        )}% en quejas en las últimas 24h (${recent} vs ${previous} del día anterior)`,
        action:
          "Revisar inmediatamente la causa raíz y establecer plan de acción",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Detectar temas recurrentes problemáticos
    const recurringIssues = await pool.query(
      `SELECT 
        topic,
        COUNT(*) as mentions,
        COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative_count
       FROM messages 
       WHERE client_id = $1 
       AND timestamp > NOW() - INTERVAL '7 days'
       GROUP BY topic 
       HAVING COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) > 5
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
        message: `El tema "${issue.topic}" ha generado ${issue.negative_count} menciones negativas en los últimos 7 días`,
        action: `Analizar casos específicos de "${issue.topic}" y diseñar estrategia de mejora`,
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Detectar caída en sentimiento positivo
    const sentimentTrend = await pool.query(
      `SELECT 
        (SELECT COUNT(CASE WHEN sentiment = 'positive' THEN 1 END)::float / COUNT(*)::float * 100
         FROM messages 
         WHERE client_id = $1 
         AND timestamp > NOW() - INTERVAL '7 days'
         AND timestamp < NOW() - INTERVAL '3 days') as previous_positive_rate,
        (SELECT COUNT(CASE WHEN sentiment = 'positive' THEN 1 END)::float / COUNT(*)::float * 100
         FROM messages 
         WHERE client_id = $1 
         AND timestamp > NOW() - INTERVAL '3 days') as current_positive_rate`,
      [clientId]
    );

    const prevRate = parseFloat(
      sentimentTrend.rows[0]?.previous_positive_rate || 0
    );
    const currRate = parseFloat(
      sentimentTrend.rows[0]?.current_positive_rate || 0
    );

    if (prevRate > 0 && currRate < prevRate * 0.8) {
      alerts.push({
        type: "trend",
        severity: "medium",
        title: "Caída en satisfacción del cliente",
        message: `El sentimiento positivo cayó de ${prevRate.toFixed(
          1
        )}% a ${currRate.toFixed(1)}% en los últimos 3 días`,
        action:
          "Identificar factores que están impactando la percepción del cliente",
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Detectar canal con problemas
    const channelPerformance = await pool.query(
      `SELECT 
        channel,
        COUNT(*) as total,
        COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative,
        COUNT(CASE WHEN sentiment = 'negative' THEN 1 END)::float / COUNT(*)::float * 100 as negative_rate
       FROM messages 
       WHERE client_id = $1 
       AND timestamp > NOW() - INTERVAL '7 days'
       GROUP BY channel 
       HAVING COUNT(CASE WHEN sentiment = 'negative' THEN 1 END)::float / COUNT(*)::float * 100 > 40
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
        message: `El canal ${
          channel.channel
        } tiene ${channel.negative_rate.toFixed(1)}% de mensajes negativos (${
          channel.negative
        }/${channel.total})`,
        action: `Revisar tiempo de respuesta y calidad de atención en ${channel.channel}`,
        timestamp: new Date().toISOString(),
      });
    }

    // 5. Detectar oportunidades de mejora
    const opportunities = await pool.query(
      `SELECT 
        topic,
        COUNT(*) as mentions
       FROM messages 
       WHERE client_id = $1 
       AND sentiment = 'positive' 
       AND timestamp > NOW() - INTERVAL '7 days'
       GROUP BY topic 
       ORDER BY mentions DESC 
       LIMIT 1`,
      [clientId]
    );

    if (opportunities.rows.length > 0 && opportunities.rows[0].mentions > 5) {
      const opp = opportunities.rows[0];
      alerts.push({
        type: "opportunity",
        severity: "low",
        title: `Fortaleza detectada: ${opp.topic}`,
        message: `Los clientes valoran positivamente "${opp.topic}" (${opp.mentions} menciones positivas)`,
        action: `Capitalizar esta fortaleza en marketing y comunicación con clientes`,
        timestamp: new Date().toISOString(),
      });
    }

    // 6. Alerta de necesidad de validación humana
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
        message: `Hay ${pending} mensajes que requieren revisión humana para garantizar precisión`,
        action: `Revisar en la sección "Validation" para corregir clasificaciones de IA`,
        timestamp: new Date().toISOString(),
      });
    }

    // 7. Alerta de volumen bajo (posible problema de ingesta)
    const recentMessages = await pool.query(
      `SELECT COUNT(*) as count 
       FROM messages 
       WHERE client_id = $1 
       AND timestamp > NOW() - INTERVAL '24 hours'`,
      [clientId]
    );

    const recentCount = parseInt(recentMessages.rows[0]?.count || 0);
    if (recentCount === 0) {
      const lastMessage = await pool.query(
        `SELECT MAX(timestamp) as last_message 
         FROM messages 
         WHERE client_id = $1`,
        [clientId]
      );

      const lastMessageDate = lastMessage.rows[0]?.last_message;
      if (lastMessageDate) {
        const hoursSince = Math.round(
          (Date.now() - new Date(lastMessageDate).getTime()) / (1000 * 60 * 60)
        );

        alerts.push({
          type: "data_gap",
          severity: "low",
          title: "Sin datos recientes",
          message: `No se han recibido mensajes en las últimas ${hoursSince} horas`,
          action: "Verificar conectores automáticos o subir datos manualmente",
          timestamp: new Date().toISOString(),
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error("Error generating alerts:", error);
    return [];
  }
}

import { Router } from "express";
import pool from "../db/connection.js";

const router = Router();

router.get("/queue/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;

    // Verificar que el cliente existe
    const clientCheck = await pool.query(
      "SELECT id FROM clients WHERE id = $1",
      [clientId]
    );
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    console.log(
      `✅ Cola de validación solicitada por ${req.user.username} para cliente ${clientId}`
    );

    const queueResult = await pool.query(
      "SELECT * FROM messages WHERE client_id = $1 AND requires_validation = true AND validated = false ORDER BY timestamp DESC LIMIT 50",
      [clientId]
    );
    const statsResult = await pool.query(
      "SELECT COUNT(*) as total, SUM(CASE WHEN validated = true THEN 1 ELSE 0 END) as validated, SUM(CASE WHEN validated = false THEN 1 ELSE 0 END) as pending FROM messages WHERE client_id = $1 AND requires_validation = true",
      [clientId]
    );

    res.json({
      queue: queueResult.rows,
      stats: {
        total: parseInt(statsResult.rows[0].total) || 0,
        validated: parseInt(statsResult.rows[0].validated) || 0,
        pending: parseInt(statsResult.rows[0].pending) || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching validation queue:", error);
    res.status(500).json({ error: "Failed to fetch validation queue" });
  }
});

router.post("/validate", async (req, res) => {
  const client = await pool.connect();
  try {
    const { messageId, clientId, corrections } = req.body;

    // Verificar que el cliente existe
    const clientCheck = await client.query(
      "SELECT id FROM clients WHERE id = $1",
      [clientId]
    );
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    console.log(
      `🔧 Validación realizada por ${req.user.username} para mensaje ${messageId}`
    );

    await client.query("BEGIN");

    const originalMessage = await client.query(
      "SELECT * FROM messages WHERE id = $1",
      [messageId]
    );
    if (originalMessage.rows.length === 0) {
      throw new Error("Message not found");
    }
    const original = originalMessage.rows[0];

    console.log("🔧 Corrección humana:", {
      messageId,
      original: { sentiment: original.sentiment, topic: original.topic },
      corrections,
    });

    // Actualizar mensaje
    await client.query(
      "UPDATE messages SET sentiment = $1, topic = $2, intent = $3, validated = true WHERE id = $4",
      [corrections.sentiment, corrections.topic, corrections.intent, messageId]
    );

    // Guardar en fine-tuning dataset
    const finetuningId = "ft_" + Date.now();
    await client.query(
      "INSERT INTO finetuning_dataset (id, client_id, message_id, text, ai_sentiment, ai_topic, ai_intent, human_sentiment, human_topic, human_intent, corrected_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [
        finetuningId,
        clientId,
        messageId,
        original.text,
        original.sentiment,
        original.topic,
        original.intent,
        corrections.sentiment,
        corrections.topic,
        corrections.intent,
        "human_validator",
      ]
    );

    // ============================================
    // ACTUALIZAR TABLAS DE RESUMEN
    // ============================================

    const messageDate = new Date(original.timestamp)
      .toISOString()
      .split("T")[0];

    // 1. Actualizar daily_analytics
    // Restar de la clasificación incorrecta
    await client.query(
      `
      UPDATE daily_analytics 
      SET 
        positive_count = CASE WHEN $1 = 'positive' THEN positive_count - 1 ELSE positive_count END,
        neutral_count = CASE WHEN $1 = 'neutral' THEN neutral_count - 1 ELSE neutral_count END,
        negative_count = CASE WHEN $1 = 'negative' THEN negative_count - 1 ELSE negative_count END
      WHERE client_id = $2 AND date = $3 AND channel = $4
    `,
      [original.sentiment, clientId, messageDate, original.channel]
    );

    // Sumar a la clasificación correcta
    await client.query(
      `
      UPDATE daily_analytics 
      SET 
        positive_count = CASE WHEN $1 = 'positive' THEN positive_count + 1 ELSE positive_count END,
        neutral_count = CASE WHEN $1 = 'neutral' THEN neutral_count + 1 ELSE neutral_count END,
        negative_count = CASE WHEN $1 = 'negative' THEN negative_count + 1 ELSE negative_count END,
        updated_at = NOW()
      WHERE client_id = $2 AND date = $3 AND channel = $4
    `,
      [corrections.sentiment, clientId, messageDate, original.channel]
    );

    // 2. Actualizar topic_summary
    // Restar del topic antiguo
    await client.query(
      `
      UPDATE topic_summary 
      SET 
        positive_count = CASE WHEN $1 = 'positive' THEN GREATEST(positive_count - 1, 0) ELSE positive_count END,
        negative_count = CASE WHEN $1 = 'negative' THEN GREATEST(negative_count - 1, 0) ELSE negative_count END,
        total_count = GREATEST(total_count - 1, 0)
      WHERE client_id = $2 AND topic = $3
    `,
      [original.sentiment, clientId, original.topic]
    );

    // Sumar al topic nuevo
    await client.query(
      `
      INSERT INTO topic_summary (client_id, topic, total_count, positive_count, negative_count, last_7_days_count, last_30_days_count, updated_at)
      VALUES ($1, $2, 1, 
        CASE WHEN $3 = 'positive' THEN 1 ELSE 0 END,
        CASE WHEN $3 = 'negative' THEN 1 ELSE 0 END,
        1, 1, NOW())
      ON CONFLICT (client_id, topic) DO UPDATE SET
        total_count = topic_summary.total_count + 1,
        positive_count = topic_summary.positive_count + CASE WHEN $3 = 'positive' THEN 1 ELSE 0 END,
        negative_count = topic_summary.negative_count + CASE WHEN $3 = 'negative' THEN 1 ELSE 0 END,
        updated_at = NOW()
    `,
      [clientId, corrections.topic, corrections.sentiment]
    );

    // 3. Actualizar channel_summary
    // Restar del sentimiento antiguo
    await client.query(
      `
      UPDATE channel_summary 
      SET 
        positive_count = CASE WHEN $1 = 'positive' THEN GREATEST(positive_count - 1, 0) ELSE positive_count END,
        neutral_count = CASE WHEN $1 = 'neutral' THEN GREATEST(neutral_count - 1, 0) ELSE neutral_count END,
        negative_count = CASE WHEN $1 = 'negative' THEN GREATEST(negative_count - 1, 0) ELSE negative_count END
      WHERE client_id = $2 AND channel = $3
    `,
      [original.sentiment, clientId, original.channel]
    );

    // Sumar al sentimiento nuevo
    await client.query(
      `
      UPDATE channel_summary 
      SET 
        positive_count = CASE WHEN $1 = 'positive' THEN positive_count + 1 ELSE positive_count END,
        neutral_count = CASE WHEN $1 = 'neutral' THEN neutral_count + 1 ELSE neutral_count END,
        negative_count = CASE WHEN $1 = 'negative' THEN negative_count + 1 ELSE negative_count END,
        updated_at = NOW()
      WHERE client_id = $2 AND channel = $3
    `,
      [corrections.sentiment, clientId, original.channel]
    );

    await client.query("COMMIT");
    console.log(
      "✅ Corrección aplicada y resúmenes actualizados:",
      finetuningId
    );
    res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error validating message:", error);
    res.status(500).json({ error: "Failed to validate message" });
  } finally {
    client.release();
  }
});

router.get("/finetuning-dataset/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const result = await pool.query(
      "SELECT text, ai_sentiment, ai_topic, ai_intent, human_sentiment, human_topic, human_intent, corrected_at FROM finetuning_dataset WHERE client_id = $1 ORDER BY corrected_at DESC",
      [clientId]
    );

    const dataset = result.rows.map((row) => ({
      messages: [
        { role: "user", content: "Clasifica: " + row.text },
        {
          role: "assistant",
          content: JSON.stringify({
            sentiment: row.human_sentiment,
            topic: row.human_topic,
            intent: row.human_intent,
          }),
        },
      ],
    }));

    res.json({
      totalExamples: dataset.length,
      dataset: dataset,
      readyForFineTuning: dataset.length >= 100,
      recommendedMinimum: 500,
    });
  } catch (error) {
    console.error("Error fetching fine-tuning dataset:", error);
    res.status(500).json({ error: "Failed to fetch dataset" });
  }
});

export default router;

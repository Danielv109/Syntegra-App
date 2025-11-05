import { Router } from "express";
import pool from "../db/connection.js";

const router = Router();

router.get("/queue/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
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
    await client.query("BEGIN");

    const originalMessage = await client.query(
      "SELECT * FROM messages WHERE id = $1",
      [messageId]
    );
    if (originalMessage.rows.length === 0) {
      throw new Error("Message not found");
    }
    const original = originalMessage.rows[0];

    await client.query(
      "UPDATE messages SET sentiment = $1, topic = $2, intent = $3, validated = true WHERE id = $4",
      [corrections.sentiment, corrections.topic, corrections.intent, messageId]
    );

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

    await client.query("COMMIT");
    console.log("Corrección guardada:", finetuningId);
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

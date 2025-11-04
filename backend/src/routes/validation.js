import { Router } from "express";
import pool from "../db/connection.js";

const router = Router();

router.get("/queue/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;

    const queueResult = await pool.query(
      `SELECT * FROM messages 
       WHERE client_id = $1 
       AND requires_validation = true 
       AND validated = false 
       ORDER BY timestamp DESC 
       LIMIT 50`,
      [clientId]
    );

    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN validated = true THEN 1 ELSE 0 END) as validated,
        SUM(CASE WHEN validated = false THEN 1 ELSE 0 END) as pending
       FROM messages 
       WHERE client_id = $1 AND requires_validation = true`,
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
  try {
    const { messageId, corrections } = req.body;

    await pool.query(
      `UPDATE messages 
       SET sentiment = $1, 
           topic = $2, 
           intent = $3, 
           validated = true 
       WHERE id = $4`,
      [corrections.sentiment, corrections.topic, corrections.intent, messageId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error validating message:", error);
    res.status(500).json({ error: "Failed to validate message" });
  }
});

export default router;

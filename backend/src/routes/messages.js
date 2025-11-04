import { Router } from "express";
import pool from "../db/connection.js";

const router = Router();

router.get("/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;

    const result = await pool.query(
      "SELECT * FROM messages WHERE client_id = $1 ORDER BY timestamp DESC LIMIT 200",
      [clientId]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default router;

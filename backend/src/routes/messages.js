import { Router } from "express";
import pool from "../db/connection.js";

const router = Router();

router.get("/:clientId", async (req, res) => {
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

    // La autorización ya fue verificada por el middleware authorizeClient
    console.log(
      `📬 Mensajes solicitados por ${req.user.username} para cliente ${clientId}`
    );

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

import { Router } from "express";
import pool from "../db/connection.js";
import { classifyMessages } from "../services/ai-classifier.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { filename, data, channel, clientId } = req.body;

    if (!data || !Array.isArray(data) || !clientId) {
      return res
        .status(400)
        .json({ error: "Invalid data format or missing clientId" });
    }

    console.log(
      `📥 Recibidos ${data.length} mensajes para cliente ${clientId}`
    );

    // Preparar mensajes para clasificación
    const messagesForAI = data.map((row, i) => ({
      id: `msg_${Date.now()}_${i}`,
      text: row.text || row.message || "",
      channel: channel || row.channel || "unknown",
      timestamp: row.timestamp || new Date().toISOString(),
      client_id: clientId,
    }));

    // Clasificar con IA
    console.log("🤖 Clasificando mensajes con IA...");
    const classifiedMessages = await classifyMessages(messagesForAI);

    // Guardar en base de datos
    console.log("💾 Guardando en base de datos...");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const msg of classifiedMessages) {
        await client.query(
          `INSERT INTO messages (id, client_id, text, channel, timestamp, sentiment, topic, intent, requires_validation)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [
            msg.id,
            msg.client_id,
            msg.text,
            msg.channel,
            msg.timestamp,
            msg.sentiment,
            msg.topic,
            msg.intent,
            msg.requires_validation,
          ]
        );
      }

      // Actualizar contador del cliente
      await client.query(
        `UPDATE clients 
         SET total_messages = (SELECT COUNT(*) FROM messages WHERE client_id = $1),
             last_analysis = NOW()
         WHERE id = $1`,
        [clientId]
      );

      await client.query("COMMIT");

      console.log(
        `✅ ${classifiedMessages.length} mensajes guardados y clasificados`
      );

      res.json({
        success: true,
        recordCount: classifiedMessages.length,
        message: "Mensajes procesados y clasificados con IA",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Error en upload:", error);
    res.status(500).json({ error: "Failed to process upload" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const { clientId } = req.query;

    // TODO: Implementar historial real desde base de datos
    res.json({ uploads: [] });
  } catch (error) {
    console.error("Error fetching upload history:", error);
    res.status(500).json({ error: "Failed to fetch upload history" });
  }
});

export default router;

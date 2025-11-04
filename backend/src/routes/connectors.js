import { Router } from "express";
import pool from "../db/connection.js";
import axios from "axios";

const router = Router();

router.get("/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;

    const result = await pool.query(
      "SELECT id, client_id, type, name, enabled, status, frequency, last_sync, total_messages, created_at FROM connectors WHERE client_id = $1 ORDER BY created_at DESC",
      [clientId]
    );

    res.json({ connectors: result.rows });
  } catch (error) {
    console.error("Error fetching connectors:", error);
    res.status(500).json({ error: "Failed to fetch connectors" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { clientId, type, name, apiKey, frequency } = req.body;

    if (!clientId || !type || !name || !apiKey) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = `conn_${Date.now()}`;

    await pool.query(
      "INSERT INTO connectors (id, client_id, type, name, api_key, frequency, enabled, status) VALUES ($1, $2, $3, $4, $5, $6, false, 'inactive')",
      [id, clientId, type, name, apiKey, frequency]
    );

    const result = await pool.query(
      "SELECT id, client_id, type, name, enabled, status, frequency, last_sync, total_messages, created_at FROM connectors WHERE id = $1",
      [id]
    );

    res.json({ connector: result.rows[0] });
  } catch (error) {
    console.error("Error creating connector:", error);
    res.status(500).json({ error: "Failed to create connector" });
  }
});

router.put("/:connectorId/toggle", async (req, res) => {
  try {
    const { connectorId } = req.params;
    const { enabled } = req.body;

    await pool.query(
      "UPDATE connectors SET enabled = $1, status = $2 WHERE id = $3",
      [enabled, enabled ? "active" : "inactive", connectorId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error toggling connector:", error);
    res.status(500).json({ error: "Failed to toggle connector" });
  }
});

router.delete("/:connectorId", async (req, res) => {
  try {
    const { connectorId } = req.params;

    await pool.query("DELETE FROM connectors WHERE id = $1", [connectorId]);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting connector:", error);
    res.status(500).json({ error: "Failed to delete connector" });
  }
});

router.post("/:connectorId/test", async (req, res) => {
  try {
    const { connectorId } = req.params;

    // Obtener el conector
    const result = await pool.query("SELECT * FROM connectors WHERE id = $1", [
      connectorId,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Connector not found" });
    }

    const connector = result.rows[0];

    // Validar según el tipo
    let testResult = false;

    switch (connector.type) {
      case "whatsapp":
        // Intentar validar API de WhatsApp Business
        try {
          await axios.get(`https://graph.facebook.com/v18.0/me`, {
            headers: { Authorization: `Bearer ${connector.api_key}` },
            timeout: 5000,
          });
          testResult = true;
        } catch (error) {
          testResult = false;
        }
        break;

      case "instagram":
      case "facebook":
        // Validar Meta API
        try {
          await axios.get(`https://graph.facebook.com/v18.0/me`, {
            headers: { Authorization: `Bearer ${connector.api_key}` },
            timeout: 5000,
          });
          testResult = true;
        } catch (error) {
          testResult = false;
        }
        break;

      case "gmail":
        // Validar formato de API key de Gmail
        testResult =
          connector.api_key.includes("@") ||
          connector.api_key.startsWith("ya29.");
        break;

      default:
        testResult = false;
    }

    if (testResult) {
      // Actualizar estado del conector
      await pool.query(
        "UPDATE connectors SET status = 'active', last_sync = NOW() WHERE id = $1",
        [connectorId]
      );
      res.json({ success: true, message: "Conexión exitosa" });
    } else {
      await pool.query("UPDATE connectors SET status = 'error' WHERE id = $1", [
        connectorId,
      ]);
      res.json({
        success: false,
        message: "API key inválida. Verifica las credenciales.",
      });
    }
  } catch (error) {
    console.error("Error testing connector:", error);
    res.json({ success: false, message: "Error al probar la conexión" });
  }
});

export default router;

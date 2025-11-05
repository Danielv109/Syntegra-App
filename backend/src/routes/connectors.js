import { Router } from "express";
import pool from "../db/connection.js";
import axios from "axios";
import { verifyClientAccess } from "../middleware/auth.js";

const router = Router();

router.get("/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;

    // AUTORIZACIÓN
    const hasAccess = await verifyClientAccess(
      req.user.userId,
      clientId,
      req.user.role
    );
    if (!hasAccess) {
      return res.status(403).json({ error: "No tienes permiso" });
    }

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
      `🔌 Conectores solicitados por ${req.user.username} para cliente ${clientId}`
    );

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
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    // AUTORIZACIÓN
    const hasAccess = await verifyClientAccess(
      req.user.userId,
      clientId,
      req.user.role
    );
    if (!hasAccess) {
      return res.status(403).json({ error: "No tienes permiso" });
    }

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
      `🔌 Conector creado por ${req.user.username} para cliente ${clientId}`
    );

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

    await pool.query("UPDATE connectors SET enabled = $1 WHERE id = $2", [
      enabled,
      connectorId,
    ]);

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
      return res.json({ success: false, message: "Conector no encontrado" });
    }

    const connector = result.rows[0];

    // ============================================
    // SOLO PROBAR - NO MODIFICAR ESTADO
    // ============================================

    let testResult = false;
    let errorMessage = "Credenciales inválidas";

    try {
      switch (connector.type) {
        case "whatsapp":
          try {
            await axios.get("https://graph.facebook.com/v18.0/me", {
              headers: { Authorization: "Bearer " + connector.api_key },
              timeout: 5000,
            });
            testResult = true;
          } catch (error) {
            if (error.response?.status === 401) {
              errorMessage = "API key de WhatsApp inválida";
            } else if (error.code === "ECONNABORTED") {
              errorMessage = "Timeout - Verifica tu conexión";
            } else {
              errorMessage = "Error de conexión con Facebook API";
            }
          }
          break;

        case "instagram":
        case "facebook":
          try {
            await axios.get("https://graph.facebook.com/v18.0/me", {
              headers: { Authorization: "Bearer " + connector.api_key },
              timeout: 5000,
            });
            testResult = true;
          } catch (error) {
            if (error.response?.status === 401) {
              errorMessage = "API key de Meta inválida";
            } else {
              errorMessage = "Error de conexión con Meta API";
            }
          }
          break;

        case "gmail":
          // Validar formato de credencial de Gmail
          if (
            connector.api_key.includes("@") ||
            connector.api_key.startsWith("ya29.")
          ) {
            testResult = true;
          } else {
            errorMessage =
              "Formato de credencial inválido. Debe ser email o token OAuth2";
          }
          break;

        default:
          errorMessage = "Tipo de conector no soportado";
      }
    } catch (error) {
      console.error("Error testing connector:", error);
      errorMessage = "Error al probar conexión: " + error.message;
    }

    // NO MODIFICAR BASE DE DATOS
    // El connector-worker será el responsable de actualizar status y last_sync

    if (testResult) {
      res.json({
        success: true,
        message:
          "✓ Credenciales válidas. El conector sincronizará automáticamente cuando esté activo.",
      });
    } else {
      res.json({
        success: false,
        message: "✗ " + errorMessage,
      });
    }
  } catch (error) {
    console.error("Error testing connector:", error);
    res.json({ success: false, message: "Error al probar conexión" });
  }
});

export default router;

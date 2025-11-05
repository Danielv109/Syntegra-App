import { Router } from "express";
import pool from "../db/connection.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: "clientId es requerido" });
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
      `⚙️ Settings solicitados por ${req.user.username} para cliente ${clientId}`
    );

    let result = await pool.query(
      "SELECT * FROM client_settings WHERE client_id = $1",
      [clientId]
    );

    // Si no existe configuración, crear una por defecto
    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO client_settings (client_id, notifications, processing, integrations, theme)
         VALUES ($1, 
           '{"email": false, "slack": false}',
           '{"autoClassify": true, "humanValidation": false}',
           '{"whatsapp": {"enabled": false}, "instagram": {"enabled": false}, "email": {"enabled": false}}',
           '{"mode": "dark"}'
         )`,
        [clientId]
      );

      result = await pool.query(
        "SELECT * FROM client_settings WHERE client_id = $1",
        [clientId]
      );
    }

    const settings = result.rows[0];

    res.json({
      notifications: settings.notifications,
      processing: settings.processing,
      integrations: settings.integrations,
      theme: settings.theme,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/", async (req, res) => {
  try {
    const { clientId, notifications, processing, integrations } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: "clientId es requerido" });
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
      `⚙️ Settings actualizado por ${req.user.username} para cliente ${clientId}`
    );

    await pool.query(
      `INSERT INTO client_settings (client_id, notifications, processing, integrations, theme, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (client_id)
       DO UPDATE SET
         notifications = COALESCE($2, client_settings.notifications),
         processing = COALESCE($3, client_settings.processing),
         integrations = COALESCE($4, client_settings.integrations),
         theme = COALESCE($5, client_settings.theme),
         updated_at = NOW()`,
      [
        clientId,
        notifications ? JSON.stringify(notifications) : null,
        processing ? JSON.stringify(processing) : null,
        integrations ? JSON.stringify(integrations) : null,
        theme ? JSON.stringify(theme) : null,
      ]
    );

    res.json({
      success: true,
      message: "Configuración guardada correctamente",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;

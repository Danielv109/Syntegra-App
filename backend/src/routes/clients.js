import { Router } from "express";
import pool from "../db/connection.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM clients ORDER BY created_at DESC"
    );
    res.json({ clients: result.rows });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, industry } = req.body;

    if (!name || !industry) {
      return res.status(400).json({ error: "Name and industry are required" });
    }

    const clientId = "client_" + Date.now();

    console.log("Creando cliente:", { clientId, name, industry });

    await pool.query(
      "INSERT INTO clients (id, name, industry, active, total_messages) VALUES ($1, $2, $3, true, 0)",
      [clientId, name, industry]
    );

    const result = await pool.query("SELECT * FROM clients WHERE id = $1", [
      clientId,
    ]);

    console.log("Cliente creado exitosamente:", result.rows[0]);

    res.json({ client: result.rows[0] });
  } catch (error) {
    console.error("Error creating client:", error);
    res
      .status(500)
      .json({ error: "Failed to create client: " + error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, industry, active } = req.body;

    await pool.query(
      "UPDATE clients SET name = COALESCE($1, name), industry = COALESCE($2, industry), active = COALESCE($3, active) WHERE id = $4",
      [name, industry, active, id]
    );

    const result = await pool.query("SELECT * FROM clients WHERE id = $1", [
      id,
    ]);
    res.json({ client: result.rows[0] });
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Eliminando cliente:", id);

    // Con ON DELETE CASCADE en las foreign keys, solo necesitamos eliminar el cliente
    const result = await pool.query(
      "DELETE FROM clients WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    console.log("Cliente eliminado exitosamente:", id);

    res.json({ success: true, message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res
      .status(500)
      .json({ error: "Failed to delete client: " + error.message });
  }
});

export default router;

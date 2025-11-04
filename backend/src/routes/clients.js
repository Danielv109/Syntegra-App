import { Router } from "express";
import pool from "../db/connection.js";

const router = Router();

router.get("/", async (_req, res) => {
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
    const id = `client_${Date.now()}`;

    await pool.query(
      "INSERT INTO clients (id, name, industry) VALUES ($1, $2, $3)",
      [id, name, industry]
    );

    const result = await pool.query("SELECT * FROM clients WHERE id = $1", [
      id,
    ]);
    res.json({ client: result.rows[0] });
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

export default router;

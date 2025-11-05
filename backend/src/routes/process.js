import { Router } from "express";
import pool from "../db/connection.js";

const router = Router();

router.get("/status/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await pool.query("SELECT * FROM jobs WHERE id = $1", [
      jobId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = result.rows[0];

    res.json({
      id: job.id,
      state: job.status,
      progress:
        job.total_records > 0
          ? Math.round((job.processed_records / job.total_records) * 100)
          : 0,
      totalRecords: job.total_records,
      processedRecords: job.processed_records,
      error: job.error_message,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ error: "Failed to get job status" });
  }
});

export default router;

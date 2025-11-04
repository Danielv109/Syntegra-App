import { Router } from "express";

const router = Router();

router.get("/status/:jobId", async (req, res) => {
  try {
    // Mock response - no queue service needed
    const status = {
      id: req.params.jobId,
      state: "completed",
      progress: 100,
      result: { classified: 450 },
    };
    res.json(status);
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ error: "Failed to get job status" });
  }
});

export default router;

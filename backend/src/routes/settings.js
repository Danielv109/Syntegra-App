import { Router } from "express";

const router = Router();

let settings = {
  notifications: {
    email: true,
    slack: false,
    threshold: "high",
  },
  processing: {
    autoClassify: true,
    humanValidation: true,
    language: "es",
  },
  integrations: {
    whatsapp: { enabled: true, apiKey: "wa_****" },
    instagram: { enabled: true, apiKey: "ig_****" },
    gmail: { enabled: false, apiKey: "" },
  },
};

router.get("/", (_req, res) => {
  res.json(settings);
});

router.put("/", (req, res) => {
  settings = { ...settings, ...req.body };
  res.json({ success: true, settings });
});

export default router;

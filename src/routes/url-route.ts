import express from "express";
import { createShortCode } from "../controllers/create-shortcode";
import { getLinkSafety } from "../controllers/get-link-safety";
import { getAiAnalysis } from "../controllers/get-ai-analysis";
import { authenticateToken } from "../middlewares/auth/authenticate";

const router = express.Router();

router.use(authenticateToken);

router.post("/create-shortUrl", async (req, res) => {
  const createShortUrl = await createShortCode(req, res);
  return createShortUrl;
});

router.get("/links/:shortCode/safety", getLinkSafety);
router.get("/links/:shortCode/ai-analysis", getAiAnalysis);

export default router;

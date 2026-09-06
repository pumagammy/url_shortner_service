import express from "express";
import { createShortCode } from "../controllers/create-shortcode";
import { getLinkSafety } from "../controllers/get-link-safety";
import { getAiAnalysis } from "../controllers/get-ai-analysis";
import { 
  getAnalyticsOverview, 
  getLinkAnalytics, 
  getLinkDetailedAnalytics,
  getOverviewDetailedAnalytics 
} from "../controllers/analytics-controller";
import { authenticateToken } from "../middlewares/auth/authenticate";

const router = express.Router();

router.use(authenticateToken);

router.post("/create-shortUrl", async (req, res) => {
  const createShortUrl = await createShortCode(req, res);
  return createShortUrl;
});

router.get("/analytics/overview", getAnalyticsOverview);
router.get("/analytics/links/:shortCode", getLinkAnalytics);
router.get("/analytics/links/:shortCode/detailed", getLinkDetailedAnalytics);
router.get("/analytics/overview/detailed", getOverviewDetailedAnalytics);
router.get("/links/:shortCode/safety", getLinkSafety);
router.get("/links/:shortCode/ai-analysis", getAiAnalysis);

export default router;

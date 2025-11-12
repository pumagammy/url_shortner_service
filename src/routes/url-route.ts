import express from "express";
import { createShortCode } from "../controllers/create-shortcode";
import { getRedirectToOriginalUrl } from "../controllers/redirect-original-url";


const router = express.Router();

router.post("/create-shortUrl", async (req, res) => {
  const createShortUrl = await createShortCode(req, res);
  return createShortUrl;
});

// always redirect route should be at the end to avoid conflicts with other routes
router.get("/:shortCode", async (req, res) => {
  const redirectToOriginalUrl = await getRedirectToOriginalUrl(req, res);
  return redirectToOriginalUrl;
});

export default router;

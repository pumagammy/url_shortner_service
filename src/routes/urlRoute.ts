import express from "express";
import {
  createShortCode,
  redirectToOriginal,
} from "../controllers/createShortcode";

const router = express.Router();

router.post("/create-shortUrl", async (req, res) => {
  const createShortUrl = await createShortCode(req, res);
  return createShortUrl;
});

// always redirect route should be at the end to avoid conflicts with other routes
router.get("/:shortCode", async (req, res) => {
  const getRedirectToOriginalUrl = await redirectToOriginal(req, res);
  return getRedirectToOriginalUrl;
});

export default router;

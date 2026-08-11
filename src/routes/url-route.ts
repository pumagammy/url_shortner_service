import express from "express";
import { createShortCode } from "../controllers/create-shortcode";
import { getLinkSafety } from "../controllers/get-link-safety";



const router = express.Router();

router.post("/create-shortUrl", async (req, res) => {
  
  const createShortUrl = await createShortCode(req, res);
  return createShortUrl;
});

router.get("/links/:shortCode/safety", getLinkSafety);

export default router;

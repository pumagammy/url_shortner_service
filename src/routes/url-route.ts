import express from "express";
import { createShortCode } from "../controllers/create-shortcode";



const router = express.Router();

router.post("/create-shortUrl", async (req, res) => {
  
  const createShortUrl = await createShortCode(req, res);
  return createShortUrl;
});

export default router;

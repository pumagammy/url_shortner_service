import { url } from "inspector";
import { generateShortCode } from "../services/generateShortcode";
import { UrlModel } from "../models/urlSchems";

const createShortCode = async (req: any, res: any) => {
  const { originalUrl, customizedCode } = req?.body;
  if (!originalUrl) {
    return res.status(400).json({ error: "Original URL is required" });
  }

  const shortCode = generateShortCode();
  const shortUrl = `${process.env.BASE_URL}/${shortCode}`;

  const newUrl = await UrlModel.create({
    originalUrl,
    shortCode,
    shortUrl,
    customizedCode,
  });
  if (newUrl) {
    return res
      .status(200)
      .json({ message: "Short URL created successfully", data: newUrl });
  } else {
    return res.status(500).json({ error: "Failed to create short URL" });
  }
};

export { createShortCode };

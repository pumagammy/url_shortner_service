import { UrlModel } from "../models/url-schems";
import { generateShortCode } from "../utils/short-code-utils/generate-shortcode";


export const UrlRepo = {
  async findByShortCode(shortCode: string) {
    console.log('shortCode',shortCode)
    return UrlModel.findOne({ shortCode });
  },

  async generateUniqueShortCode() {
    let attempts = 0;
    while (attempts < 5) {
      const code = generateShortCode();
      const exists = await UrlModel.exists({ shortCode: code });
      if (!exists) return code;
      attempts++;
    }
    throw new Error("Failed to generate unique short code");
  },

  async create(data: any) {
    return UrlModel.create(data);
  },
};


import { UrlRepo } from "../repositories/url-repo";
import { ALREADY_IN_USE, BAD_REQUEST, INVALID_DATA, INTERNAL_SERVER_ERROR_MESSAGE, DATA_EXPIRED } from "../utils/response/response-message";
import { getExpiryDate } from "../utils/short-code-utils/generate-expirydate";
import { CODE_REGEX, isValidUrl } from "../utils/short-code-utils/generate-shortcode";

export const UrlService = {
  async createShortCode({ originalUrl, customizedCode, expiryDays, expiryDate }: any) {

    if (!originalUrl || !isValidUrl(originalUrl)) {
      throw new Error(INVALID_DATA);
    }

    let shortCode = customizedCode;

    // If custom code provided, validate and check duplicate
    if (shortCode) {
      if (!CODE_REGEX.test(shortCode)) throw new Error(INVALID_DATA);

      const exists = await UrlRepo.findByShortCode(shortCode);
      if (exists) throw new Error(ALREADY_IN_USE);
    } 
    // Otherwise auto generate unique code
    else {
      shortCode = await UrlRepo.generateUniqueShortCode();
    }

    const base = process.env.BASE_URL?.replace(/\/+$/, "");
    if (!base) throw new Error(INTERNAL_SERVER_ERROR_MESSAGE);

    const shortUrl = `${base}/${shortCode}`;

    const expiresAt = getExpiryDate(expiryDays, expiryDate);

    return await UrlRepo.create({
      originalUrl,
      shortCode,
      shortUrl,
      expiresAt,
      customizedCode,
    });
  },
 async redirectToOriginal(shortCode: string) {
    const urlEntry = await UrlRepo.findByShortCode(shortCode);
    if (!urlEntry) {
      throw new Error(BAD_REQUEST);
    }

    // Check if expired
    if (urlEntry.expiresAt && urlEntry.expiresAt < new Date()) {
      throw new Error(DATA_EXPIRED);
    }

    // Increment click count
    urlEntry.clicks += 1;
    await urlEntry.save();
console.log("==>Original URL:", urlEntry.originalUrl);
    return  urlEntry.originalUrl;

  }


};

import { Iurl } from "../models/url-schems";
import { UrlRepo } from "../repositories/url-repo";
import { INTERNAL_SERVER_ERROR_MESSAGE } from "../utils/response/response-message";
import { getExpiryDate, isValidUrl } from "../utils/short-code-utils/generate-expirydate";
import {
  generateUniqueIdAndShortCode,
} from "../utils/short-code-utils/generate-shortcode";

interface CreateShortUrlInput {
  originalUrl: string;
  customCode?: string | null;
  isPremium: boolean;
  expiryDate?: string | null;
  expiryTime?: string | null;

}

export const UrlService = {
  async createShortUrl(input: CreateShortUrlInput): Promise<Iurl> {
    const { originalUrl, customCode, isPremium, expiryTime, expiryDate } = input;

    // Validate URL
    if (!originalUrl || !isValidUrl(originalUrl)) {
      throw new Error("INVALID_URL");
    }

    let guid: string;
    let shortCode: string;
    let expiresAt: Date | null | undefined;

    // If PREMIUM USER → CUSTOM CODE PATH
    if (isPremium && customCode) {
      const CODE_REGEX = /^[A-Za-z0-9_-]{3,20}$/;

      if (!CODE_REGEX.test(customCode)) {
        throw new Error("INVALID_CUSTOM_CODE");
      }

      // ensure custom shortCode uniqueness
      const exists = await UrlRepo.existsByUniqueId(customCode);
      if (exists) {
        throw new Error("CUSTOM_CODE_ALREADY_IN_USE");
      }

      // premium custom code – generate guid only once
      const { ulidId } = generateUniqueIdAndShortCode();
      guid = ulidId;
      shortCode = customCode;
    }

    // NORMAL USER → AUTO ULID SHORT CODE (6 chars)
    else {
      while (true) {
        const { ulidId, shortCode: code } = generateUniqueIdAndShortCode();
        guid = ulidId;
        shortCode = code;

        const base = process.env.URL_REDIRECT_BASE_URL?.replace(/\/+$/, "");
        if (!base) throw new Error(INTERNAL_SERVER_ERROR_MESSAGE);

        const shortUrl = `${base}/${shortCode}`;
         expiresAt = getExpiryDate(expiryTime ?? undefined, expiryDate ?? undefined);

        try {
          // try insert – uniqueness enforced by guid index
          return await UrlRepo.createUrl({
            originalUrl,
            guid,
            shortUrl,
            shortCode: shortCode.slice(0, 6),
            expiresAt: expiresAt ?? null,
          });
        } catch (err: any) {
          // Only retry if duplicate guid error
          if (err.code === 11000 && err.keyPattern?.guid) {
            continue; // regenerate ULID
          }
          throw err;
        }
      }
    }

    // Insert for custom scenario
    return await UrlRepo.createUrl({
      originalUrl,
      guid,
      shortCode,
      expiresAt: expiresAt ?? null,
    });
  },
};



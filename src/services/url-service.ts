import { Iurl } from "../models/url-schems";
import { UrlRepo } from "../repositories/url-repo";
import { INTERNAL_SERVER_ERROR_MESSAGE } from "../utils/response/response-message";
import { getExpiryDate, isValidUrl } from "../utils/short-code-utils/generate-expirydate";
import {
  generateUniqueIdAndShortCode,
} from "../utils/short-code-utils/generate-shortcode";
import { UrlSafetyService } from "./url-safety-service";

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

    const base = process.env.URL_REDIRECT_BASE_URL?.replace(/\/+$/, "");
    if (!base) throw new Error(INTERNAL_SERVER_ERROR_MESSAGE);

    const safety = await UrlSafetyService.scanUrl(originalUrl);
    const expiresAt = getExpiryDate(expiryTime ?? undefined, expiryDate ?? undefined) ?? null;

    let guid: string;
    let shortCode: string;

    // If PREMIUM USER → CUSTOM CODE PATH
    if (isPremium && customCode) {
      const CODE_REGEX = /^[A-Za-z0-9_-]{3,20}$/;

      if (!CODE_REGEX.test(customCode)) {
        throw new Error("INVALID_CUSTOM_CODE");
      }

      // ensure custom shortCode uniqueness
      const exists = await UrlRepo.existsByShortCode(customCode);
      if (exists) {
        throw new Error("CUSTOM_CODE_ALREADY_IN_USE");
      }

      const { ulidId } = generateUniqueIdAndShortCode();
      guid = ulidId;
      shortCode = customCode;

      return UrlRepo.createUrl({
        originalUrl,
        guid,
        shortCode,
        shortUrl: `${base}/${shortCode}`,
        customCode,
        isPremium: true,
        expiresAt,
        ...safety,
      });
    }

    // NORMAL USER → AUTO ULID SHORT CODE (6 chars)
    else {
      while (true) {
        const { ulidId, shortCode: code } = generateUniqueIdAndShortCode();
        guid = ulidId;
        shortCode = code;

        const shortUrl = `${base}/${shortCode}`;

        try {
          return await UrlRepo.createUrl({
            originalUrl,
            guid,
            shortUrl,
            shortCode: shortCode.slice(0, 6),
            expiresAt,
            ...safety,
          });
        } catch (err: any) {
          if (err.code === 11000 && (err.keyPattern?.guid || err.keyPattern?.shortCode)) {
            continue;
          }
          throw err;
        }
      }
    }

  },
};


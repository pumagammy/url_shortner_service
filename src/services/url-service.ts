import { Iurl } from "../models/url-schems";
import { UrlRepo } from "../repositories/url-repo";
import { INTERNAL_SERVER_ERROR_MESSAGE } from "../utils/response/response-message";
import { getExpiryDate, isValidUrl } from "../utils/short-code-utils/generate-expirydate";
import {
  generateUniqueIdAndShortCode,
} from "../utils/short-code-utils/generate-shortcode";
import { UrlSafetyService, UrlSafetyResult, runBasicUrlChecks } from "./url-safety-service";

interface CreateShortUrlInput {
  userId: string;
  originalUrl: string;
  customCode?: string | null;
  isPremium: boolean;
  expiryDate?: string | null;
  expiryTime?: string | null;
}

class UnsafeOrRiskyUrlError extends Error {
  safetyResult: UrlSafetyResult;

  constructor(message: string, safetyResult: UrlSafetyResult) {
    super(message);
    this.name = "UnsafeOrRiskyUrlError";
    this.safetyResult = safetyResult;
  }
}

function isUrlRisky(safety: UrlSafetyResult): boolean {
  const TRUST_SCORE_THRESHOLD = 30;
  // Block explicitly when the trust score is below threshold.
  if (typeof safety.trustScore === "number" && safety.trustScore < TRUST_SCORE_THRESHOLD) {
    return true;
  }

  // Only treat destinations with an explicit 'unsafe' verdict as risky.
  // Allow 'rating_unavailable' or 'suspicious' when the trust score is acceptable.
  return safety.safetyStatus === "unsafe";
}

export const UrlService = {
  async createShortUrl(input: CreateShortUrlInput): Promise<Iurl> {
    const { userId, originalUrl, customCode, isPremium, expiryTime, expiryDate } = input;

    if (!userId) {
      throw new Error("AUTHENTICATED_USER_REQUIRED");
    }

    // Validate URL
    if (!originalUrl || !isValidUrl(originalUrl)) {
      throw new Error("INVALID_URL");
    }

    const base = process.env.URL_REDIRECT_BASE_URL?.replace(/\/+$/, "");
    if (!base) throw new Error(INTERNAL_SERVER_ERROR_MESSAGE);

    // Fast path: run local/basic checks (no network) to compute a provisional trust score.
    const { score: basicScore, signals } = runBasicUrlChecks(originalUrl);
    const provisionalTrustScore = Math.max(0, Math.min(100, 100 - basicScore - 25));

    // If provisional score is below threshold, reject immediately.
    if (provisionalTrustScore < 30) {
      const provisionalSafety: UrlSafetyResult = {
        safetyStatus: "rating_unavailable",
        trustScore: provisionalTrustScore,
        riskLevel: "medium",
        riskSignals: signals,
        safetyCheckedAt: new Date(),
        redirectChain: [],
      };
      throw new UnsafeOrRiskyUrlError("Cannot generate short URL because this URL is unsafe or risky.", provisionalSafety);
    }

    const safetyPlaceholder: Partial<UrlSafetyResult> = {
      safetyStatus: "rating_unavailable",
      trustScore: provisionalTrustScore,
      riskLevel: "medium",
      riskSignals: signals,
      safetyCheckedAt: new Date(),
      redirectChain: [],
      // New status flag used by frontend polling
      aiSafetyAnalysisStatus: "analysing",
    };

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

      const created = await UrlRepo.createUrl({
        userId,
        originalUrl,
        guid,
        shortCode,
        shortUrl: `${base}/${shortCode}`,
        customCode,
        isPremium: true,
        expiresAt,
        ...safetyPlaceholder,
      });

      // Start background full safety scan and update the record asynchronously.
      (async () => {
        try {
          const fullSafety = await UrlSafetyService.scanUrl(originalUrl);
          const updates: Partial<Iurl> = {
            ...fullSafety,
            aiSafetyAnalysisStatus: fullSafety.aiSafetyAnalysis?.status === "available" ? "completed" : "failed",
          };
          await UrlRepo.updateByGuid(guid, updates as Partial<Iurl>);
          // If final result is unsafe or trustScore drops below threshold, mark inactive.
          if (fullSafety.safetyStatus === "unsafe" || (typeof fullSafety.trustScore === "number" && fullSafety.trustScore < 30)) {
            await UrlRepo.updateByGuid(guid, { isActive: false } as Partial<Iurl>);
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          console.error("Background safety scan failed for premium URL:", originalUrl, message);
          try {
            await UrlRepo.updateByGuid(guid, {
              aiSafetyAnalysisStatus: "failed",
              aiSafetyAnalysis: { status: "unavailable", verdict: null, confidence: 1, reasons: [], linkName: null, error: message },
            } as Partial<Iurl>);
          } catch (err) {
            // ignore persistence errors
          }
        }
      })();

      return created;
    }

    // NORMAL USER → AUTO ULID SHORT CODE (6 chars)
    else {
      while (true) {
        const { ulidId, shortCode: code } = generateUniqueIdAndShortCode();
        guid = ulidId;
        shortCode = code;

        const shortUrl = `${base}/${shortCode}`;

        try {
          const created = await UrlRepo.createUrl({
            userId,
            originalUrl,
            guid,
            shortUrl,
            shortCode: shortCode.slice(0, 6),
            expiresAt,
            ...safetyPlaceholder,
          });

          (async () => {
            try {
              const fullSafety = await UrlSafetyService.scanUrl(originalUrl);
              const updates: Partial<Iurl> = {
                ...fullSafety,
                aiSafetyAnalysisStatus: fullSafety.aiSafetyAnalysis?.status === "available" ? "completed" : "failed",
              };
              await UrlRepo.updateByGuid(guid, updates as Partial<Iurl>);
              if (fullSafety.safetyStatus === "unsafe" || (typeof fullSafety.trustScore === "number" && fullSafety.trustScore < 30)) {
                await UrlRepo.updateByGuid(guid, { isActive: false } as Partial<Iurl>);
              }
            } catch (e) {
              const message = e instanceof Error ? e.message : String(e);
              console.error("Background safety scan failed for URL:", originalUrl, message);
              try {
                await UrlRepo.updateByGuid(guid, {
                  aiSafetyAnalysisStatus: "failed",
                  aiSafetyAnalysis: { status: "unavailable", verdict: null, confidence: 1, reasons: [], linkName: null, error: message },
                } as Partial<Iurl>);
              } catch (err) {
                // ignore persistence errors
              }
            }
          })();

          return created;
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

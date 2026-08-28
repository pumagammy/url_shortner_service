"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlService = void 0;
const url_repo_1 = require("../repositories/url-repo");
const response_message_1 = require("../utils/response/response-message");
const generate_expirydate_1 = require("../utils/short-code-utils/generate-expirydate");
const generate_shortcode_1 = require("../utils/short-code-utils/generate-shortcode");
const url_safety_service_1 = require("./url-safety-service");
class UnsafeOrRiskyUrlError extends Error {
    constructor(message, safetyResult) {
        super(message);
        this.name = "UnsafeOrRiskyUrlError";
        this.safetyResult = safetyResult;
    }
}
function isUrlRisky(safety) {
    const TRUST_SCORE_THRESHOLD = 30;
    // Block explicitly when the trust score is below threshold.
    if (typeof safety.trustScore === "number" && safety.trustScore < TRUST_SCORE_THRESHOLD) {
        return true;
    }
    // Only treat destinations with an explicit 'unsafe' verdict as risky.
    // Allow 'rating_unavailable' or 'suspicious' when the trust score is acceptable.
    return safety.safetyStatus === "unsafe";
}
exports.UrlService = {
    async createShortUrl(input) {
        const { originalUrl, customCode, isPremium, expiryTime, expiryDate } = input;
        // Validate URL
        if (!originalUrl || !(0, generate_expirydate_1.isValidUrl)(originalUrl)) {
            throw new Error("INVALID_URL");
        }
        const base = process.env.URL_REDIRECT_BASE_URL?.replace(/\/+$/, "");
        if (!base)
            throw new Error(response_message_1.INTERNAL_SERVER_ERROR_MESSAGE);
        // Fast path: run local/basic checks (no network) to compute a provisional trust score.
        const { score: basicScore, signals } = (0, url_safety_service_1.runBasicUrlChecks)(originalUrl);
        const provisionalTrustScore = Math.max(0, Math.min(100, 100 - basicScore - 25));
        // If provisional score is below threshold, reject immediately.
        if (provisionalTrustScore < 30) {
            const provisionalSafety = {
                safetyStatus: "rating_unavailable",
                trustScore: provisionalTrustScore,
                riskLevel: "medium",
                riskSignals: signals,
                safetyCheckedAt: new Date(),
                redirectChain: [],
            };
            throw new UnsafeOrRiskyUrlError("Cannot generate short URL because this URL is unsafe or risky.", provisionalSafety);
        }
        const safetyPlaceholder = {
            safetyStatus: "rating_unavailable",
            trustScore: provisionalTrustScore,
            riskLevel: "medium",
            riskSignals: signals,
            safetyCheckedAt: new Date(),
            redirectChain: [],
            // New status flag used by frontend polling
            aiSafetyAnalysisStatus: "analysing",
        };
        const expiresAt = (0, generate_expirydate_1.getExpiryDate)(expiryTime ?? undefined, expiryDate ?? undefined) ?? null;
        let guid;
        let shortCode;
        // If PREMIUM USER → CUSTOM CODE PATH
        if (isPremium && customCode) {
            const CODE_REGEX = /^[A-Za-z0-9_-]{3,20}$/;
            if (!CODE_REGEX.test(customCode)) {
                throw new Error("INVALID_CUSTOM_CODE");
            }
            // ensure custom shortCode uniqueness
            const exists = await url_repo_1.UrlRepo.existsByShortCode(customCode);
            if (exists) {
                throw new Error("CUSTOM_CODE_ALREADY_IN_USE");
            }
            const { ulidId } = (0, generate_shortcode_1.generateUniqueIdAndShortCode)();
            guid = ulidId;
            shortCode = customCode;
            const created = await url_repo_1.UrlRepo.createUrl({
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
                    const fullSafety = await url_safety_service_1.UrlSafetyService.scanUrl(originalUrl);
                    const updates = {
                        ...fullSafety,
                        aiSafetyAnalysisStatus: fullSafety.aiSafetyAnalysis?.status === "available" ? "completed" : "failed",
                    };
                    await url_repo_1.UrlRepo.updateByGuid(guid, updates);
                    // If final result is unsafe or trustScore drops below threshold, mark inactive.
                    if (fullSafety.safetyStatus === "unsafe" || (typeof fullSafety.trustScore === "number" && fullSafety.trustScore < 30)) {
                        await url_repo_1.UrlRepo.updateByGuid(guid, { isActive: false });
                    }
                }
                catch (e) {
                    const message = e instanceof Error ? e.message : String(e);
                    console.error("Background safety scan failed for premium URL:", originalUrl, message);
                    try {
                        await url_repo_1.UrlRepo.updateByGuid(guid, {
                            aiSafetyAnalysisStatus: "failed",
                            aiSafetyAnalysis: { status: "unavailable", verdict: null, confidence: 1, reasons: [], error: message },
                        });
                    }
                    catch (err) {
                        // ignore persistence errors
                    }
                }
            })();
            return created;
        }
        // NORMAL USER → AUTO ULID SHORT CODE (6 chars)
        else {
            while (true) {
                const { ulidId, shortCode: code } = (0, generate_shortcode_1.generateUniqueIdAndShortCode)();
                guid = ulidId;
                shortCode = code;
                const shortUrl = `${base}/${shortCode}`;
                try {
                    const created = await url_repo_1.UrlRepo.createUrl({
                        originalUrl,
                        guid,
                        shortUrl,
                        shortCode: shortCode.slice(0, 6),
                        expiresAt,
                        ...safetyPlaceholder,
                    });
                    (async () => {
                        try {
                            const fullSafety = await url_safety_service_1.UrlSafetyService.scanUrl(originalUrl);
                            const updates = {
                                ...fullSafety,
                                aiSafetyAnalysisStatus: fullSafety.aiSafetyAnalysis?.status === "available" ? "completed" : "failed",
                            };
                            await url_repo_1.UrlRepo.updateByGuid(guid, updates);
                            if (fullSafety.safetyStatus === "unsafe" || (typeof fullSafety.trustScore === "number" && fullSafety.trustScore < 30)) {
                                await url_repo_1.UrlRepo.updateByGuid(guid, { isActive: false });
                            }
                        }
                        catch (e) {
                            const message = e instanceof Error ? e.message : String(e);
                            console.error("Background safety scan failed for URL:", originalUrl, message);
                            try {
                                await url_repo_1.UrlRepo.updateByGuid(guid, {
                                    aiSafetyAnalysisStatus: "failed",
                                    aiSafetyAnalysis: { status: "unavailable", verdict: null, confidence: 1, reasons: [], error: message },
                                });
                            }
                            catch (err) {
                                // ignore persistence errors
                            }
                        }
                    })();
                    return created;
                }
                catch (err) {
                    if (err.code === 11000 && (err.keyPattern?.guid || err.keyPattern?.shortCode)) {
                        continue;
                    }
                    throw err;
                }
            }
        }
    },
};

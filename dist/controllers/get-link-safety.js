"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinkSafety = void 0;
const url_repo_1 = require("../repositories/url-repo");
const response_formatters_1 = require("../utils/response/response-formatters");
const response_message_1 = require("../utils/response/response-message");
const response_code_1 = require("../utils/response/response-code");
const getLinkSafety = async (req, res) => {
    const url = await url_repo_1.UrlRepo.findByShortCode(req.params.shortCode);
    if (!url) {
        return (0, response_formatters_1.createErrorResponse)(res, response_message_1.NO_DATA_FOUND, response_code_1.STATUS_CODES.notFound.code, response_code_1.STATUS_CODES.notFound.name);
    }
    // Older documents may still contain retired status values.
    const storedSafetyStatus = String(url.safetyStatus);
    const safetyStatus = ["unknown", "unverified", "not_rated"].includes(storedSafetyStatus)
        ? "rating_unavailable"
        : url.safetyStatus;
    return (0, response_formatters_1.createSuccessResponse)(res, {
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        safetyStatus,
        trustScore: url.trustScore,
        riskLevel: url.riskLevel,
        riskSignals: url.riskSignals,
        safetyCheckedAt: url.safetyCheckedAt,
        resolvedUrl: url.resolvedUrl,
        redirectChain: url.redirectChain,
        aiSafetyAnalysis: url.aiSafetyAnalysis,
        aiSafetyAnalysisStatus: url.aiSafetyAnalysisStatus,
    });
};
exports.getLinkSafety = getLinkSafety;

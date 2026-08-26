import { UrlRepo } from "../repositories/url-repo";
import { createErrorResponse, createSuccessResponse } from "../utils/response/response-formatters";
import { NO_DATA_FOUND } from "../utils/response/response-message";
import { STATUS_CODES } from "../utils/response/response-code";

export const getLinkSafety = async (req: any, res: any) => {
  const url = await UrlRepo.findByShortCode(req.params.shortCode);
  if (!url) {
    return createErrorResponse(res, NO_DATA_FOUND, STATUS_CODES.notFound.code, STATUS_CODES.notFound.name);
  }

  // Older documents may still contain retired status values.
  const storedSafetyStatus = String(url.safetyStatus);
  const safetyStatus = ["unknown", "unverified", "not_rated"].includes(storedSafetyStatus)
    ? "rating_unavailable"
    : url.safetyStatus;

  return createSuccessResponse(res, {
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

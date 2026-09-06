import { UrlRepo } from "../repositories/url-repo";
import { createErrorResponse, createSuccessResponse } from "../utils/response/response-formatters";
import { NO_DATA_FOUND } from "../utils/response/response-message";
import { STATUS_CODES } from "../utils/response/response-code";

export const getAiAnalysis = async (req: any, res: any) => {
  const url = await UrlRepo.findByShortCode(req.params.shortCode);
  if (!url) {
    return createErrorResponse(res, NO_DATA_FOUND, STATUS_CODES.notFound.code, STATUS_CODES.notFound.name);
  }

  return createSuccessResponse(res, {
    shortCode: url.shortCode,
    linkName: url.linkName ?? null,
    aiSafetyAnalysis: url.aiSafetyAnalysis,
    aiSafetyAnalysisStatus: url.aiSafetyAnalysisStatus ?? "analysing",
  });
};

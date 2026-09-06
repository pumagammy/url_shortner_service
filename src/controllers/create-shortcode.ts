
import { UrlService } from "../services/url-service";
import { createSuccessResponse, createErrorResponse } from "../utils/response/response-formatters";
import { STATUS_CODES } from "../utils/response/response-code";
import { CREATED_DATA, ERROR_MSG_SOMETHING_WENT_WRONG } from "../utils/response/response-message";

export const createShortCode = async (req: any, res: any) => {
  try {
    const result = await UrlService.createShortUrl({
      ...req.body,
      userId: req.user?.userId,
    });
    return createSuccessResponse(res, result, CREATED_DATA);
  } catch (err: any) {
    if (err?.safetyResult) {
      return createErrorResponse(
        res,
        "Link is not safe or suitable.",
        STATUS_CODES.internalServerError.code,
        STATUS_CODES.internalServerError.name,
        undefined,
        { safetyAnalysis: err.safetyResult }
      );
    }

    return createErrorResponse(res, err.message || ERROR_MSG_SOMETHING_WENT_WRONG);
  }
};

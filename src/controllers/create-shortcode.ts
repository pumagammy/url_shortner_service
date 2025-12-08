
import { UrlService } from "../services/url-service";
import { createSuccessResponse, createErrorResponse } from "../utils/response/response-formatters";
import { CREATED_DATA, ERROR_MSG_SOMETHING_WENT_WRONG } from "../utils/response/response-message";

export const createShortCode = async (req: any, res: any) => {
  try {
    const result = await UrlService.createShortUrl(req.body);
    return createSuccessResponse(res, result, CREATED_DATA);
  } catch (err: any) {
    return createErrorResponse(res, err.message || ERROR_MSG_SOMETHING_WENT_WRONG);
  }
};

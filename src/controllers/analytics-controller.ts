import { AnalyticsService } from "../services/analytics-service";
import { createErrorResponse, createSuccessResponse } from "../utils/response/response-formatters";
import { STATUS_CODES } from "../utils/response/response-code";

export const getAnalyticsOverview = async (req: any, res: any) => {
  const analytics = await AnalyticsService.getOverview(req.user.userId);
  return createSuccessResponse(res, analytics);
};

export const getLinkAnalytics = async (req: any, res: any) => {
  const analytics = await AnalyticsService.getLinkAnalytics(req.user.userId, req.params.shortCode);
  if (!analytics) {
    return createErrorResponse(res, "Link not found", STATUS_CODES.notFound.code, STATUS_CODES.notFound.name);
  }

  return createSuccessResponse(res, analytics);
};

export const getLinkDetailedAnalytics = async (req: any, res: any) => {
  try {
    const analytics = await AnalyticsService.getLinkDetailedAnalytics(req.user.userId, req.params.shortCode);
    if (!analytics) {
      return createErrorResponse(res, "Link not found", STATUS_CODES.notFound.code, STATUS_CODES.notFound.name);
    }

    return createSuccessResponse(res, analytics);
  } catch (error: any) {
    return createErrorResponse(
      res,
      error?.message || "Failed to fetch detailed analytics",
      STATUS_CODES.internalServerError.code,
      STATUS_CODES.internalServerError.name
    );
  }
};

export const getOverviewDetailedAnalytics = async (req: any, res: any) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return createErrorResponse(
        res,
        "userId is required as a query parameter",
        STATUS_CODES.badRequest.code,
        STATUS_CODES.badRequest.name
      );
    }

    const analytics = await AnalyticsService.getOverviewDetailedAnalytics(userId);
    return createSuccessResponse(res, analytics);
  } catch (error: any) {
    return createErrorResponse(
      res,
      error?.message || "Failed to fetch detailed analytics",
      STATUS_CODES.internalServerError.code,
      STATUS_CODES.internalServerError.name
    );
  }
};

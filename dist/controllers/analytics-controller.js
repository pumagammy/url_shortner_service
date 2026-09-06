"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverviewDetailedAnalytics = exports.getLinkDetailedAnalytics = exports.getLinkAnalytics = exports.getAnalyticsOverview = void 0;
const analytics_service_1 = require("../services/analytics-service");
const response_formatters_1 = require("../utils/response/response-formatters");
const response_code_1 = require("../utils/response/response-code");
const getAnalyticsOverview = async (req, res) => {
    const analytics = await analytics_service_1.AnalyticsService.getOverview(req.user.userId);
    return (0, response_formatters_1.createSuccessResponse)(res, analytics);
};
exports.getAnalyticsOverview = getAnalyticsOverview;
const getLinkAnalytics = async (req, res) => {
    const analytics = await analytics_service_1.AnalyticsService.getLinkAnalytics(req.user.userId, req.params.shortCode);
    if (!analytics) {
        return (0, response_formatters_1.createErrorResponse)(res, "Link not found", response_code_1.STATUS_CODES.notFound.code, response_code_1.STATUS_CODES.notFound.name);
    }
    return (0, response_formatters_1.createSuccessResponse)(res, analytics);
};
exports.getLinkAnalytics = getLinkAnalytics;
const getLinkDetailedAnalytics = async (req, res) => {
    try {
        const analytics = await analytics_service_1.AnalyticsService.getLinkDetailedAnalytics(req.user.userId, req.params.shortCode);
        if (!analytics) {
            return (0, response_formatters_1.createErrorResponse)(res, "Link not found", response_code_1.STATUS_CODES.notFound.code, response_code_1.STATUS_CODES.notFound.name);
        }
        return (0, response_formatters_1.createSuccessResponse)(res, analytics);
    }
    catch (error) {
        return (0, response_formatters_1.createErrorResponse)(res, error?.message || "Failed to fetch detailed analytics", response_code_1.STATUS_CODES.internalServerError.code, response_code_1.STATUS_CODES.internalServerError.name);
    }
};
exports.getLinkDetailedAnalytics = getLinkDetailedAnalytics;
const getOverviewDetailedAnalytics = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return (0, response_formatters_1.createErrorResponse)(res, "userId is required as a query parameter", response_code_1.STATUS_CODES.badRequest.code, response_code_1.STATUS_CODES.badRequest.name);
        }
        const analytics = await analytics_service_1.AnalyticsService.getOverviewDetailedAnalytics(userId);
        return (0, response_formatters_1.createSuccessResponse)(res, analytics);
    }
    catch (error) {
        return (0, response_formatters_1.createErrorResponse)(res, error?.message || "Failed to fetch detailed analytics", response_code_1.STATUS_CODES.internalServerError.code, response_code_1.STATUS_CODES.internalServerError.name);
    }
};
exports.getOverviewDetailedAnalytics = getOverviewDetailedAnalytics;

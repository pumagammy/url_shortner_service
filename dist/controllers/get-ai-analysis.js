"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAiAnalysis = void 0;
const url_repo_1 = require("../repositories/url-repo");
const response_formatters_1 = require("../utils/response/response-formatters");
const response_message_1 = require("../utils/response/response-message");
const response_code_1 = require("../utils/response/response-code");
const getAiAnalysis = async (req, res) => {
    const url = await url_repo_1.UrlRepo.findByShortCode(req.params.shortCode);
    if (!url) {
        return (0, response_formatters_1.createErrorResponse)(res, response_message_1.NO_DATA_FOUND, response_code_1.STATUS_CODES.notFound.code, response_code_1.STATUS_CODES.notFound.name);
    }
    return (0, response_formatters_1.createSuccessResponse)(res, {
        shortCode: url.shortCode,
        aiSafetyAnalysis: url.aiSafetyAnalysis,
        aiSafetyAnalysisStatus: url.aiSafetyAnalysisStatus ?? "analysing",
    });
};
exports.getAiAnalysis = getAiAnalysis;

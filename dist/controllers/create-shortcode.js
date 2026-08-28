"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShortCode = void 0;
const url_service_1 = require("../services/url-service");
const response_formatters_1 = require("../utils/response/response-formatters");
const response_code_1 = require("../utils/response/response-code");
const response_message_1 = require("../utils/response/response-message");
const createShortCode = async (req, res) => {
    try {
        const result = await url_service_1.UrlService.createShortUrl(req.body);
        return (0, response_formatters_1.createSuccessResponse)(res, result, response_message_1.CREATED_DATA);
    }
    catch (err) {
        if (err?.safetyResult) {
            return (0, response_formatters_1.createErrorResponse)(res, "Link is not safe or suitable.", response_code_1.STATUS_CODES.internalServerError.code, response_code_1.STATUS_CODES.internalServerError.name, undefined, { safetyAnalysis: err.safetyResult });
        }
        return (0, response_formatters_1.createErrorResponse)(res, err.message || response_message_1.ERROR_MSG_SOMETHING_WENT_WRONG);
    }
};
exports.createShortCode = createShortCode;

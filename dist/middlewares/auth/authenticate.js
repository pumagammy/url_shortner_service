"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticateToken = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const response_formatters_1 = require("../../utils/response/response-formatters");
const response_code_1 = require("../../utils/response/response-code");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const tokenFromCookie = req.cookies?.accessToken || null;
    const token = tokenFromHeader || tokenFromCookie;
    if (!token) {
        return (0, response_formatters_1.createErrorResponse)(res, "Authentication token is required", response_code_1.STATUS_CODES.unauthorized.code, response_code_1.STATUS_CODES.unauthorized.name);
    }
    try {
        const secret = process.env.JWT_SECRET || "dev_secret_change_me";
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        return next();
    }
    catch (error) {
        return (0, response_formatters_1.createErrorResponse)(res, "Invalid or expired token", response_code_1.STATUS_CODES.unauthorized.code, response_code_1.STATUS_CODES.unauthorized.name);
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuthenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
        return next();
    }
    try {
        const secret = process.env.JWT_SECRET || "dev_secret_change_me";
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        return next();
    }
    catch (error) {
        return next();
    }
};
exports.optionalAuthenticateToken = optionalAuthenticateToken;

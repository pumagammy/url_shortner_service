"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginController = exports.signupController = void 0;
const auth_service_1 = require("../services/auth-service");
const response_formatters_1 = require("../utils/response/response-formatters");
const response_code_1 = require("../utils/response/response-code");
const signupController = async (req, res) => {
    try {
        const result = await auth_service_1.AuthService.signup(req.body || {});
        res.cookie("accessToken", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return (0, response_formatters_1.createSuccessResponse)(res, { user: result.user }, "User signed up successfully", response_code_1.STATUS_CODES.created.code, response_code_1.STATUS_CODES.created.name);
    }
    catch (error) {
        const message = error?.message || "SIGNUP_FAILED";
        if (message === "USER_ALREADY_EXISTS") {
            return (0, response_formatters_1.createErrorResponse)(res, "User already exists", response_code_1.STATUS_CODES.conflict.code, response_code_1.STATUS_CODES.conflict.name);
        }
        if (message === "INVALID_EMAIL") {
            return (0, response_formatters_1.createErrorResponse)(res, "Please enter a valid email", response_code_1.STATUS_CODES.badRequest.code, response_code_1.STATUS_CODES.badRequest.name);
        }
        if (message === "PASSWORD_MUST_BE_AT_LEAST_6_CHARACTERS") {
            return (0, response_formatters_1.createErrorResponse)(res, "Password must be at least 6 characters long", response_code_1.STATUS_CODES.badRequest.code, response_code_1.STATUS_CODES.badRequest.name);
        }
        return (0, response_formatters_1.createErrorResponse)(res, message, response_code_1.STATUS_CODES.internalServerError.code, response_code_1.STATUS_CODES.internalServerError.name);
    }
};
exports.signupController = signupController;
const loginController = async (req, res) => {
    try {
        const result = await auth_service_1.AuthService.login(req.body || {});
        res.cookie("accessToken", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return (0, response_formatters_1.createSuccessResponse)(res, { user: result.user }, "Login successful", response_code_1.STATUS_CODES.ok.code, response_code_1.STATUS_CODES.ok.name);
    }
    catch (error) {
        const message = error?.message || "LOGIN_FAILED";
        if (message === "INVALID_CREDENTIALS") {
            return (0, response_formatters_1.createErrorResponse)(res, "Invalid email or password", response_code_1.STATUS_CODES.unauthorized.code, response_code_1.STATUS_CODES.unauthorized.name);
        }
        if (message === "INVALID_EMAIL") {
            return (0, response_formatters_1.createErrorResponse)(res, "Please enter a valid email", response_code_1.STATUS_CODES.badRequest.code, response_code_1.STATUS_CODES.badRequest.name);
        }
        if (message === "PASSWORD_REQUIRED") {
            return (0, response_formatters_1.createErrorResponse)(res, "Password is required", response_code_1.STATUS_CODES.badRequest.code, response_code_1.STATUS_CODES.badRequest.name);
        }
        return (0, response_formatters_1.createErrorResponse)(res, message, response_code_1.STATUS_CODES.internalServerError.code, response_code_1.STATUS_CODES.internalServerError.name);
    }
};
exports.loginController = loginController;

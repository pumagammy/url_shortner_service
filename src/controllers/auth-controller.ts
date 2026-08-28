import { AuthService } from "../services/auth-service";
import { createErrorResponse, createSuccessResponse } from "../utils/response/response-formatters";
import { STATUS_CODES } from "../utils/response/response-code";

export const signupController = async (req: any, res: any) => {
  try {
    const result = await AuthService.signup(req.body || {});

    res.cookie("accessToken", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return createSuccessResponse(res, { user: result.user }, "User signed up successfully", STATUS_CODES.created.code, STATUS_CODES.created.name);
  } catch (error: any) {
    const message = error?.message || "SIGNUP_FAILED";
    if (message === "USER_ALREADY_EXISTS") {
      return createErrorResponse(res, "User already exists", STATUS_CODES.conflict.code, STATUS_CODES.conflict.name);
    }
    if (message === "INVALID_EMAIL") {
      return createErrorResponse(res, "Please enter a valid email", STATUS_CODES.badRequest.code, STATUS_CODES.badRequest.name);
    }
    if (message === "PASSWORD_MUST_BE_AT_LEAST_6_CHARACTERS") {
      return createErrorResponse(res, "Password must be at least 6 characters long", STATUS_CODES.badRequest.code, STATUS_CODES.badRequest.name);
    }
    return createErrorResponse(res, message, STATUS_CODES.internalServerError.code, STATUS_CODES.internalServerError.name);
  }
};

export const loginController = async (req: any, res: any) => {
  try {
    const result = await AuthService.login(req.body || {});

    res.cookie("accessToken", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return createSuccessResponse(res, { user: result.user }, "Login successful", STATUS_CODES.ok.code, STATUS_CODES.ok.name);
  } catch (error: any) {
    const message = error?.message || "LOGIN_FAILED";
    if (message === "INVALID_CREDENTIALS") {
      return createErrorResponse(res, "Invalid email or password", STATUS_CODES.unauthorized.code, STATUS_CODES.unauthorized.name);
    }
    if (message === "INVALID_EMAIL") {
      return createErrorResponse(res, "Please enter a valid email", STATUS_CODES.badRequest.code, STATUS_CODES.badRequest.name);
    }
    if (message === "PASSWORD_REQUIRED") {
      return createErrorResponse(res, "Password is required", STATUS_CODES.badRequest.code, STATUS_CODES.badRequest.name);
    }
    return createErrorResponse(res, message, STATUS_CODES.internalServerError.code, STATUS_CODES.internalServerError.name);
  }
};

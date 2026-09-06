import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createErrorResponse } from "../../utils/response/response-formatters";
import { STATUS_CODES } from "../../utils/response/response-code";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const tokenFromCookie = req.cookies?.accessToken || null;
  const token = tokenFromHeader || tokenFromCookie;
console.log("Token from header:", tokenFromHeader);
console.log("Token from cookie:", tokenFromCookie);
  if (!token) {
    return createErrorResponse(
      res,
      "Authentication token is required",
      STATUS_CODES.unauthorized.code,
      STATUS_CODES.unauthorized.name
    );
  }

  try {
    const secret = process.env.JWT_SECRET || "dev_secret_change_me";
    const decoded = jwt.verify(token, secret) as AuthenticatedUser;
    req.user = decoded;
    return next();
  } catch (error) {
    return createErrorResponse(
      res,
      "Invalid or expired token",
      STATUS_CODES.unauthorized.code,
      STATUS_CODES.unauthorized.name
    );
  }
};

export const optionalAuthenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || "dev_secret_change_me";
    const decoded = jwt.verify(token, secret) as AuthenticatedUser;
    req.user = decoded;
    return next();
  } catch (error) {
    return next();
  }
};

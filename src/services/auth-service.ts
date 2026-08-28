import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { UserRepo } from "../repositories/user-repo";
import { IUser } from "../models/user-schema";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = "7d";

export interface SignUpInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUserPayload {
  userId: string;
  email: string;
  name: string;
  authProvider: "local" | "google";
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function sanitizeUser(user: IUser): AuthUserPayload {
  return {
    userId: user.userId,
    email: user.email,
    name: user.name || "",
    authProvider: user.authProvider,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const AuthService = {
  async signup(input: SignUpInput) {
    const email = input.email?.trim().toLowerCase();
    const password = input.password;
    const name = input.name?.trim() || "";

    if (!email || !email.includes("@")) {
      throw new Error("INVALID_EMAIL");
    }

    if (!password || password.length < 6) {
      throw new Error("PASSWORD_MUST_BE_AT_LEAST_6_CHARACTERS");
    }

    const existingUser = await UserRepo.findByEmail(email);
    if (existingUser) {
      throw new Error("USER_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserRepo.createUser({
      userId: `user_${randomUUID()}`,
      email,
      passwordHash,
      name,
      authProvider: "local",
      isEmailVerified: false,
    });

    const token = jwt.sign({ userId: user.userId, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return {
      user: sanitizeUser(user),
      token,
    };
  },

  async login(input: LoginInput) {
    const email = input.email?.trim().toLowerCase();
    const password = input.password;

    if (!email || !email.includes("@")) {
      throw new Error("INVALID_EMAIL");
    }

    if (!password) {
      throw new Error("PASSWORD_REQUIRED");
    }

    const user = await UserRepo.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const token = jwt.sign({ userId: user.userId, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return {
      user: sanitizeUser(user),
      token,
    };
  },
};

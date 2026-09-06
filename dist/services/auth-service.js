"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_crypto_1 = require("node:crypto");
const user_repo_1 = require("../repositories/user-repo");
const JWT_EXPIRES_IN = "7d";
const getJwtSecret = () => process.env.JWT_SECRET || "dev_secret_change_me";
function sanitizeUser(user) {
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
exports.AuthService = {
    async signup(input) {
        const email = input.email?.trim().toLowerCase();
        const password = input.password;
        const name = input.name?.trim() || "";
        if (!email || !email.includes("@")) {
            throw new Error("INVALID_EMAIL");
        }
        if (!password || password.length < 6) {
            throw new Error("PASSWORD_MUST_BE_AT_LEAST_6_CHARACTERS");
        }
        const existingUser = await user_repo_1.UserRepo.findByEmail(email);
        if (existingUser) {
            throw new Error("USER_ALREADY_EXISTS");
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await user_repo_1.UserRepo.createUser({
            userId: `user_${(0, node_crypto_1.randomUUID)()}`,
            email,
            passwordHash,
            name,
            authProvider: "local",
            isEmailVerified: false,
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.userId, email: user.email }, getJwtSecret(), {
            expiresIn: JWT_EXPIRES_IN,
        });
        return {
            user: sanitizeUser(user),
            token,
        };
    },
    async login(input) {
        const email = input.email?.trim().toLowerCase();
        const password = input.password;
        if (!email || !email.includes("@")) {
            throw new Error("INVALID_EMAIL");
        }
        if (!password) {
            throw new Error("PASSWORD_REQUIRED");
        }
        const user = await user_repo_1.UserRepo.findByEmail(email);
        if (!user || !user.passwordHash) {
            throw new Error("INVALID_CREDENTIALS");
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error("INVALID_CREDENTIALS");
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.userId, email: user.email }, getJwtSecret(), {
            expiresIn: JWT_EXPIRES_IN,
        });
        return {
            user: sanitizeUser(user),
            token,
        };
    },
};

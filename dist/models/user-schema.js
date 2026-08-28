"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const UserSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        default: () => `usr_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    passwordHash: {
        type: String,
        default: null,
    },
    name: {
        type: String,
        trim: true,
        default: "",
    },
    googleId: {
        type: String,
        default: null,
        sparse: true,
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
exports.UserModel = mongoose_1.default.model("User", UserSchema);

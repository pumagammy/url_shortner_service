"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const UrlSchema = new mongoose_1.default.Schema({
    requestId: { type: String, required: true, unique: true, default: uuid_1.v4 },
    originalUrl: { type: String, required: true, trim: true, },
    shortCode: { type: String, required: true, unique: true, index: true },
    shortUrl: { type: String, required: true, unique: true },
    customizedCode: { type: String },
    clicks: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    isExpired: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
// TTL index to automatically delete expired documents
UrlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.UrlModel = mongoose_1.default.model("Url", UrlSchema);

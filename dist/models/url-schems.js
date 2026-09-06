"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const UrlSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        ref: "User",
        default: null,
        index: true,
    },
    originalUrl: { type: String, required: true, trim: true },
    shortCode: { type: String, required: true, unique: true, index: true },
    shortUrl: { type: String, required: true, unique: true },
    guid: { type: String, required: true, unique: true },
    customCode: { type: String },
    isPremium: { type: Boolean, default: false },
    clicks: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    isExpired: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    safetyStatus: {
        type: String,
        // Retired values remain allowed only so older records can still be read safely.
        enum: ["safe", "rating_unavailable", "suspicious", "unsafe", "not_rated", "unverified", "unknown"],
        default: "rating_unavailable",
        index: true,
    },
    trustScore: { type: Number, default: 0, min: 0, max: 100 },
    riskLevel: { type: String, enum: ["low", "medium", "high", "critical"], default: "low" },
    riskSignals: { type: [String], default: [] },
    safetyCheckedAt: { type: Date },
    resolvedUrl: { type: String, trim: true },
    redirectChain: { type: [String], default: [] },
    linkName: { type: String, trim: true, maxlength: 100, default: null },
    aiSafetyAnalysis: {
        status: { type: String, enum: ["available", "unavailable"] },
        verdict: { type: String, enum: ["safe", "suspicious", "unsafe"] },
        confidence: { type: Number, min: 1, max: 10 },
        reasons: { type: [String], default: [] },
        error: { type: String },
    },
    aiSafetyAnalysisStatus: {
        type: String,
        enum: ["analysing", "completed", "failed"],
        default: "analysing",
        index: true,
    },
}, { timestamps: true });
// TTL index to automatically delete expired documents
UrlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
UrlSchema.index({ shortCode: 1 }, { unique: true });
UrlSchema.index({ guid: 1 }, { unique: true });
exports.UrlModel = mongoose_1.default.model("Url", UrlSchema);

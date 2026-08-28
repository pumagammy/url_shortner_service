"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const ai_link_safety_service_1 = require("../services/ai-link-safety-service");
const url_safety_service_1 = require("../services/url-safety-service");
(0, node_test_1.default)("private address detection blocks internal IPv4 and IPv6 ranges", () => {
    strict_1.default.equal((0, url_safety_service_1.isPrivateAddress)("127.0.0.1"), true);
    strict_1.default.equal((0, url_safety_service_1.isPrivateAddress)("10.0.0.8"), true);
    strict_1.default.equal((0, url_safety_service_1.isPrivateAddress)("169.254.169.254"), true);
    strict_1.default.equal((0, url_safety_service_1.isPrivateAddress)("::1"), true);
    strict_1.default.equal((0, url_safety_service_1.isPrivateAddress)("fc00::1"), true);
    strict_1.default.equal((0, url_safety_service_1.isPrivateAddress)("8.8.8.8"), false);
});
(0, node_test_1.default)("basic URL checks retain safety signals for suspicious URLs", () => {
    const result = (0, url_safety_service_1.runBasicUrlChecks)("http://xn--bcher-kva.top/verify?token=" + "x".repeat(200));
    strict_1.default.ok(result.score >= 50);
    strict_1.default.ok(result.signals.some((signal) => signal.includes("HTTPS")));
    strict_1.default.ok(result.signals.some((signal) => signal.includes("punycode")));
    strict_1.default.ok(result.signals.some((signal) => signal.includes("High-risk")));
});
(0, node_test_1.default)("AI confidence is normalized to a realistic evidence-based range", () => {
    const safeConfidence = (0, ai_link_safety_service_1.normalizeAiConfidence)("safe", 0.99, [
        "Standard IANA example domain used for documentation",
        "No security threats or malicious content detected",
    ]);
    const unsafeConfidence = (0, ai_link_safety_service_1.normalizeAiConfidence)("unsafe", 0.99, [
        "Credential harvesting prompt",
        "Fake login page impersonation",
        "Malware download lure",
    ]);
    const safeScale = (0, ai_link_safety_service_1.normalizeAiConfidenceToScale)("safe", safeConfidence);
    const unsafeScale = (0, ai_link_safety_service_1.normalizeAiConfidenceToScale)("unsafe", unsafeConfidence);
    strict_1.default.ok(safeConfidence >= 0.5 && safeConfidence < 0.9, `safe confidence should be realistic, got ${safeConfidence}`);
    strict_1.default.ok(unsafeConfidence > 0.8 && unsafeConfidence <= 1, `unsafe confidence should be high, got ${unsafeConfidence}`);
    strict_1.default.ok(safeScale >= 1 && safeScale <= 10, `safe confidence scale should be 1-10, got ${safeScale}`);
    strict_1.default.ok(unsafeScale >= 1 && unsafeScale <= 10, `unsafe confidence scale should be 1-10, got ${unsafeScale}`);
});

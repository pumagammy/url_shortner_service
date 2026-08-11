import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAiConfidence, normalizeAiConfidenceToScale } from "../services/ai-link-safety-service";
import { isPrivateAddress, runBasicUrlChecks } from "../services/url-safety-service";

test("private address detection blocks internal IPv4 and IPv6 ranges", () => {
  assert.equal(isPrivateAddress("127.0.0.1"), true);
  assert.equal(isPrivateAddress("10.0.0.8"), true);
  assert.equal(isPrivateAddress("169.254.169.254"), true);
  assert.equal(isPrivateAddress("::1"), true);
  assert.equal(isPrivateAddress("fc00::1"), true);
  assert.equal(isPrivateAddress("8.8.8.8"), false);
});

test("basic URL checks retain safety signals for suspicious URLs", () => {
  const result = runBasicUrlChecks("http://xn--bcher-kva.top/verify?token=" + "x".repeat(200));

  assert.ok(result.score >= 50);
  assert.ok(result.signals.some((signal) => signal.includes("HTTPS")));
  assert.ok(result.signals.some((signal) => signal.includes("punycode")));
  assert.ok(result.signals.some((signal) => signal.includes("High-risk")));
});

test("AI confidence is normalized to a realistic evidence-based range", () => {
  const safeConfidence = normalizeAiConfidence("safe", 0.99, [
    "Standard IANA example domain used for documentation",
    "No security threats or malicious content detected",
  ]);
  const unsafeConfidence = normalizeAiConfidence("unsafe", 0.99, [
    "Credential harvesting prompt",
    "Fake login page impersonation",
    "Malware download lure",
  ]);

  const safeScale = normalizeAiConfidenceToScale("safe", safeConfidence);
  const unsafeScale = normalizeAiConfidenceToScale("unsafe", unsafeConfidence);

  assert.ok(safeConfidence >= 0.5 && safeConfidence < 0.9, `safe confidence should be realistic, got ${safeConfidence}`);
  assert.ok(unsafeConfidence > 0.8 && unsafeConfidence <= 1, `unsafe confidence should be high, got ${unsafeConfidence}`);
  assert.ok(safeScale >= 1 && safeScale <= 10, `safe confidence scale should be 1-10, got ${safeScale}`);
  assert.ok(unsafeScale >= 1 && unsafeScale <= 10, `unsafe confidence scale should be 1-10, got ${unsafeScale}`);
});

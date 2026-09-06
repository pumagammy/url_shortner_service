import { lookup } from "node:dns/promises";
import net from "node:net";
import { AiLinkSafetyService, AiSafetyAnalysis } from "./ai-link-safety-service";

export type SafetyStatus = "safe" | "rating_unavailable" | "suspicious" | "unsafe";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type { AiSafetyAnalysis } from "./ai-link-safety-service";

export interface UrlSafetyResult {
  safetyStatus: SafetyStatus;
  trustScore: number;
  riskLevel: RiskLevel;
  riskSignals: string[];
  safetyCheckedAt: Date;
  resolvedUrl?: string;
  redirectChain: string[];
  linkName?: string | null;
  aiSafetyAnalysis?: AiSafetyAnalysis;
  aiSafetyAnalysisStatus?: "analysing" | "completed" | "failed";
}

interface FetchedPage {
  finalUrl: string;
  redirectChain: string[];
  title?: string;
  text?: string;
  contentType?: string;
  hasPasswordField?: boolean;
}

class UnsafeDestinationError extends Error {}

const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 256 * 1024;
const FETCH_TIMEOUT_MS = 6_000;
const SUSPICIOUS_TLDS = new Set([
  "zip",
  "mov",
  "top",
  "gq",
  "work",
  "country",
  "stream",
  "download",
]);
const PHISHING_TERMS = /\b(password|verify\s+(?:your\s+)?account|wallet|seed phrase|gift card|bank details|login to continue|crypto giveaway)\b/i;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [first, second] = parts;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 192 && second === 0) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

/** Exported for focused, network-free tests. */
export function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase();
  if (net.isIP(normalized) === 4) return isPrivateIpv4(normalized);
  if (net.isIP(normalized) !== 6) return true;

  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }

  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mappedIpv4 ? isPrivateIpv4(mappedIpv4[1]) : false;
}

function addSignal(signals: string[], signal: string): void {
  if (!signals.includes(signal)) signals.push(signal);
}

/** Exported for focused, network-free tests. */
export function runBasicUrlChecks(rawUrl: string): { score: number; signals: string[] } {
  const url = new URL(rawUrl);
  const signals: string[] = [];
  let score = 0;

  if (url.protocol === "http:") {
    score += 10;
    addSignal(signals, "Destination does not use HTTPS");
  }
  if (url.hostname.includes("xn--")) {
    score += 25;
    addSignal(signals, "Internationalized (punycode) domain detected");
  }
  if (net.isIP(url.hostname)) {
    score += 20;
    addSignal(signals, "Destination uses an IP address instead of a domain name");
  }
  if (url.hostname.split(".").length > 4 || (url.hostname.match(/-/g) ?? []).length >= 3) {
    score += 10;
    addSignal(signals, "Unusually structured hostname");
  }
  if (url.href.length > 300 || url.search.length > 180) {
    score += 8;
    addSignal(signals, "Unusually long URL or query string");
  }
  const hostnameParts = url.hostname.split(".");
  if (SUSPICIOUS_TLDS.has(hostnameParts[hostnameParts.length - 1] ?? "")) {
    score += 15;
    addSignal(signals, "High-risk top-level domain");
  }
  if (/(?:login|signin|verify|secure|update|wallet|bonus|free)/i.test(url.hostname + url.pathname)) {
    score += 8;
    addSignal(signals, "URL contains common phishing keywords");
  }

  return { score, signals };
}

function assertAllowedUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeDestinationError("Only HTTP and HTTPS destinations can be scanned");
  }
  if (url.username || url.password) {
    throw new UnsafeDestinationError("URLs containing embedded credentials are blocked");
  }
  if (
    url.hostname === "localhost" ||
    url.hostname.endsWith(".localhost") ||
    /(?:^|\.)(local|internal|lan|home)$/.test(url.hostname)
  ) {
    throw new UnsafeDestinationError("Private or local destinations are blocked");
  }
  return url;
}

async function assertPublicDestination(url: URL): Promise<void> {
  const hostname = url.hostname;
  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new UnsafeDestinationError("Private network destination is blocked");
    return;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new UnsafeDestinationError("Destination resolves to a private network address");
  }
}

async function readLimitedBody(response: Response): Promise<string> {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (size < MAX_RESPONSE_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) break;
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  const bytes = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function extractPageDetails(html: string): Pick<FetchedPage, "title" | "text" | "hasPasswordField"> {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const withoutNonContent = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--([\s\S]*?)-->/gi, " ");
  const text = withoutNonContent
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6_000);

  return {
    title: titleMatch?.[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300),
    text,
    hasPasswordField: /<input[^>]+type\s*=\s*["']?password/i.test(html),
  };
}

async function fetchPageSafely(originalUrl: string): Promise<FetchedPage> {
  let current = assertAllowedUrl(originalUrl);
  const redirectChain: string[] = [current.toString()];

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertPublicDestination(current);
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": "URL-Safety-Scanner/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Destination returned an invalid redirect");
      current = assertAllowedUrl(new URL(location, current).toString());
      redirectChain.push(current.toString());
      continue;
    }

    if (!response.ok) throw new Error(`Destination returned HTTP ${response.status}`);
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return { finalUrl: current.toString(), redirectChain, contentType };
    }

    const html = await readLimitedBody(response);
    return { finalUrl: current.toString(), redirectChain, contentType, ...extractPageDetails(html) };
  }

  throw new Error(`Destination exceeded the ${MAX_REDIRECTS}-redirect limit`);
}

function applyPageChecks(page: FetchedPage, score: number, signals: string[]): number {
  const combinedText = `${page.title ?? ""} ${page.text ?? ""}`;
  if (page.redirectChain.length > 2) {
    score += 12;
    addSignal(signals, "Destination uses multiple redirects");
  }
  if (!page.contentType) {
    score += 8;
    addSignal(signals, "Destination did not declare a content type");
  } else if (!page.contentType.includes("html")) {
    score += 12;
    addSignal(signals, "Destination is not an HTML page");
  }
  if (page.hasPasswordField) {
    score += 18;
    addSignal(signals, "Page contains a password field");
  }
  if (PHISHING_TERMS.test(combinedText)) {
    score += 18;
    addSignal(signals, "Page content contains phishing or scam language");
  }
  return score;
}

function getRiskLevel(status: SafetyStatus, score: number): RiskLevel {
  if (status === "unsafe" || score >= 75) return "critical";
  if (score >= 45) return "high";
  if (score >= 20 || status === "suspicious") return "medium";
  return "low";
}

export const UrlSafetyService = {
  async scanUrl(originalUrl: string): Promise<UrlSafetyResult> {
    const { score: basicScore, signals } = runBasicUrlChecks(originalUrl);
    let score = basicScore;
    let page: FetchedPage;

    try {
      page = await fetchPageSafely(originalUrl);
      score = applyPageChecks(page, score, signals);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Destination could not be scanned";
      addSignal(signals, message);
      const unsafe = error instanceof UnsafeDestinationError;
      return {
        safetyStatus: unsafe ? "unsafe" : "rating_unavailable",
        trustScore: unsafe ? 0 : clamp(100 - score - 25, 0, 100),
        riskLevel: unsafe ? "critical" : "medium",
        riskSignals: signals,
        safetyCheckedAt: new Date(),
        redirectChain: [],
      };
    }

    const aiSafetyResult = await AiLinkSafetyService.analyze({
      submittedUrl: originalUrl,
      resolvedUrl: page.finalUrl,
      redirectCount: page.redirectChain.length - 1,
      title: page.title ?? "",
      pageText: page.text ?? "",
    });
    const aiSafetyAnalysis: AiSafetyAnalysis = aiSafetyResult.analysis ?? {
      status: "unavailable",
      verdict: null,
      confidence: 1,
      reasons: [],
      linkName: null,
      error: aiSafetyResult.unavailableReason ?? "AI analysis unavailable",
    };
    if (aiSafetyAnalysis.status === "available") {
      if (aiSafetyAnalysis.verdict === "unsafe") score = Math.max(score + 20, 75);
      if (aiSafetyAnalysis.verdict === "suspicious") score += 15;
    }

    score = clamp(score, 0, 100);
    const safetyStatus: SafetyStatus = score >= 75 ? "unsafe" : score >= 35 ? "suspicious" : "safe";
    return {
      safetyStatus,
      trustScore: 100 - score,
      riskLevel: getRiskLevel(safetyStatus, score),
      riskSignals: signals,
      safetyCheckedAt: new Date(),
      resolvedUrl: page.finalUrl,
      redirectChain: page.redirectChain,
      linkName: aiSafetyAnalysis.linkName,
      aiSafetyAnalysis,
    };
  },
};

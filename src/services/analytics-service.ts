import { Iurl } from "../models/url-schems";
import { LinkEventRepo } from "../repositories/link-event-repo";
import { UrlRepo } from "../repositories/url-repo";

export type LinkStatus = "active" | "inactive" | "expired";

export interface LinkAnalyticsSummary {
  shortCode: string;
  shortUrl: string | null;
  originalUrl: string;
  linkName: string | null;
  status: LinkStatus;
  clicks: number;
  lastUpdatedAt: Date;
}

interface DailyTrafficPoint {
  date: string;
  clicks: number;
  uniqueVisitors: number;
}

function getSevenDayStart(now: Date): Date {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - 6);
  return start;
}

function getTrafficDays(from: Date, rows: DailyTrafficPoint[]): DailyTrafficPoint[] {
  const trafficByDate = new Map(rows.map((row) => [row.date, row]));
  const days: DailyTrafficPoint[] = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(from);
    day.setUTCDate(from.getUTCDate() + offset);
    const date = day.toISOString().slice(0, 10);
    days.push(trafficByDate.get(date) ?? { date, clicks: 0, uniqueVisitors: 0 });
  }

  return days;
}

export function getLinkStatus(link: Pick<Iurl, "expiresAt" | "isActive">, now = new Date()): LinkStatus {
  if (link.expiresAt && link.expiresAt.getTime() <= now.getTime()) return "expired";
  return link.isActive === false ? "inactive" : "active";
}

function toLinkSummary(link: Iurl, clicks: number, now: Date): LinkAnalyticsSummary {
  return {
    shortCode: String(link.shortCode),
    shortUrl: link.shortUrl ? String(link.shortUrl) : null,
    originalUrl: String(link.originalUrl),
    linkName: typeof link.linkName === "string" ? link.linkName : null,
    status: getLinkStatus(link, now),
    clicks,
    lastUpdatedAt: link.updatedAt,
  };
}

async function getClickMap(links: Iurl[]): Promise<Map<string, number>> {
  const clickTotals = await LinkEventRepo.getClickTotals(links.map((link) => link._id));
  return new Map(clickTotals.map((total) => [total.urlId, total.clicks]));
}

function getLinkClicks(link: Iurl, clickMap: Map<string, number>): number {
  // LinkEvent is the source of truth after per-click tracking is enabled. The
  // Url.clicks fallback preserves totals for links created before that change.
  return clickMap.get(link._id.toString()) ?? link.clicks ?? 0;
}

export const AnalyticsService = {
  async getOverview(userId: string) {
    const now = new Date();
    const sevenDayStart = getSevenDayStart(now);
    const links = await UrlRepo.findByUserId(userId);
    const urlIds = links.map((link) => link._id);
    const [clickMap, uniqueVisitors, trafficRows] = await Promise.all([
      getClickMap(links),
      LinkEventRepo.getUniqueVisitorCount(urlIds),
      LinkEventRepo.getDailyTraffic(urlIds, sevenDayStart),
    ]);

    const allLinks = links.map((link) => toLinkSummary(link, getLinkClicks(link, clickMap), now));
    const topPerformingLinks = [...allLinks]
      .sort((left, right) => right.clicks - left.clicks)
      .slice(0, 5);

    return {
      summary: {
        totalLinks: allLinks.length,
        totalClicks: allLinks.reduce((total, link) => total + link.clicks, 0),
        uniqueVisitors,
      },
      overallTrafficLast7Days: getTrafficDays(sevenDayStart, trafficRows),
      topPerformingLinks,
      links: allLinks,
    };
  },

  async getLinkAnalytics(userId: string, shortCode: string) {
    const link = await UrlRepo.findByShortCodeAndUserId(shortCode, userId);
    if (!link) return null;

    const now = new Date();
    const sevenDayStart = getSevenDayStart(now);
    const urlIds = [link._id];
    const [clickMap, uniqueVisitors, trafficRows] = await Promise.all([
      getClickMap([link]),
      LinkEventRepo.getUniqueVisitorCount(urlIds),
      LinkEventRepo.getDailyTraffic(urlIds, sevenDayStart),
    ]);

    return {
      link: toLinkSummary(link, getLinkClicks(link, clickMap), now),
      uniqueVisitors,
      overallTrafficLast7Days: getTrafficDays(sevenDayStart, trafficRows),
    };
  },

  async getLinkDetailedAnalytics(userId: string, shortCode: string) {
    const link = await UrlRepo.findByShortCodeAndUserId(shortCode, userId);
    if (!link) return null;

    const urlIds = [link._id];
    const [
      clickMap,
      geolocation,
      devices,
      browsers,
      operatingSystems,
      referrers,
      sources,
    ] = await Promise.all([
      getClickMap([link]),
      LinkEventRepo.getGeolocationBreakdown(urlIds),
      LinkEventRepo.getDeviceBreakdown(urlIds),
      LinkEventRepo.getBrowserBreakdown(urlIds),
      LinkEventRepo.getOSBreakdown(urlIds),
      LinkEventRepo.getReferrerBreakdown(urlIds),
      LinkEventRepo.getSourceBreakdown(urlIds),
    ]);

    return {
      shortCode: link.shortCode,
      originalUrl: link.originalUrl,
      clicks: getLinkClicks(link, clickMap),
      geolocation,
      devices,
      browsers,
      operatingSystems,
      referrers: referrers.length > 0 ? referrers : [],
      sources,
    };
  },

  async getOverviewDetailedAnalytics(userId: string) {
    const now = new Date();
    const sevenDayStart = getSevenDayStart(now);
    const links = await UrlRepo.findByUserId(userId);
    const urlIds = links.map((link) => link._id);
    
    const [clickMap, uniqueVisitors, trafficRows] = await Promise.all([
      getClickMap(links),
      LinkEventRepo.getUniqueVisitorCount(urlIds),
      LinkEventRepo.getDailyTraffic(urlIds, sevenDayStart),
    ]);

    const allLinks = links.map((link) => toLinkSummary(link, getLinkClicks(link, clickMap), now));
    const topPerformingLinks = [...allLinks]
      .sort((left, right) => right.clicks - left.clicks)
      .slice(0, 5);

    return {
      totalClicks: allLinks.reduce((total, link) => total + link.clicks, 0),
      totalLinks: allLinks.length,
      uniqueVisitors,
      overallTrafficLast7Days: getTrafficDays(sevenDayStart, trafficRows),
      topPerformingLinks,
      allLinks,
    };
  },
};

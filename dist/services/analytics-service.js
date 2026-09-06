"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
exports.getLinkStatus = getLinkStatus;
const link_event_repo_1 = require("../repositories/link-event-repo");
const url_repo_1 = require("../repositories/url-repo");
function getSevenDayStart(now) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    start.setUTCDate(start.getUTCDate() - 6);
    return start;
}
function getTrafficDays(from, rows) {
    const trafficByDate = new Map(rows.map((row) => [row.date, row]));
    const days = [];
    for (let offset = 0; offset < 7; offset += 1) {
        const day = new Date(from);
        day.setUTCDate(from.getUTCDate() + offset);
        const date = day.toISOString().slice(0, 10);
        days.push(trafficByDate.get(date) ?? { date, clicks: 0, uniqueVisitors: 0 });
    }
    return days;
}
function getLinkStatus(link, now = new Date()) {
    if (link.expiresAt && link.expiresAt.getTime() <= now.getTime())
        return "expired";
    return link.isActive === false ? "inactive" : "active";
}
function toLinkSummary(link, clicks, now) {
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
async function getClickMap(links) {
    const clickTotals = await link_event_repo_1.LinkEventRepo.getClickTotals(links.map((link) => link._id));
    return new Map(clickTotals.map((total) => [total.urlId, total.clicks]));
}
function getLinkClicks(link, clickMap) {
    // LinkEvent is the source of truth after per-click tracking is enabled. The
    // Url.clicks fallback preserves totals for links created before that change.
    return clickMap.get(link._id.toString()) ?? link.clicks ?? 0;
}
exports.AnalyticsService = {
    async getOverview(userId) {
        const now = new Date();
        const sevenDayStart = getSevenDayStart(now);
        const links = await url_repo_1.UrlRepo.findByUserId(userId);
        const urlIds = links.map((link) => link._id);
        const [clickMap, uniqueVisitors, trafficRows] = await Promise.all([
            getClickMap(links),
            link_event_repo_1.LinkEventRepo.getUniqueVisitorCount(urlIds),
            link_event_repo_1.LinkEventRepo.getDailyTraffic(urlIds, sevenDayStart),
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
    async getLinkAnalytics(userId, shortCode) {
        const link = await url_repo_1.UrlRepo.findByShortCodeAndUserId(shortCode, userId);
        if (!link)
            return null;
        const now = new Date();
        const sevenDayStart = getSevenDayStart(now);
        const urlIds = [link._id];
        const [clickMap, uniqueVisitors, trafficRows] = await Promise.all([
            getClickMap([link]),
            link_event_repo_1.LinkEventRepo.getUniqueVisitorCount(urlIds),
            link_event_repo_1.LinkEventRepo.getDailyTraffic(urlIds, sevenDayStart),
        ]);
        return {
            link: toLinkSummary(link, getLinkClicks(link, clickMap), now),
            uniqueVisitors,
            overallTrafficLast7Days: getTrafficDays(sevenDayStart, trafficRows),
        };
    },
    async getLinkDetailedAnalytics(userId, shortCode) {
        const link = await url_repo_1.UrlRepo.findByShortCodeAndUserId(shortCode, userId);
        if (!link)
            return null;
        const urlIds = [link._id];
        const [clickMap, geolocation, devices, browsers, operatingSystems, referrers, sources,] = await Promise.all([
            getClickMap([link]),
            link_event_repo_1.LinkEventRepo.getGeolocationBreakdown(urlIds),
            link_event_repo_1.LinkEventRepo.getDeviceBreakdown(urlIds),
            link_event_repo_1.LinkEventRepo.getBrowserBreakdown(urlIds),
            link_event_repo_1.LinkEventRepo.getOSBreakdown(urlIds),
            link_event_repo_1.LinkEventRepo.getReferrerBreakdown(urlIds),
            link_event_repo_1.LinkEventRepo.getSourceBreakdown(urlIds),
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
    async getOverviewDetailedAnalytics(userId) {
        const now = new Date();
        const sevenDayStart = getSevenDayStart(now);
        const links = await url_repo_1.UrlRepo.findByUserId(userId);
        const urlIds = links.map((link) => link._id);
        const [clickMap, uniqueVisitors, trafficRows] = await Promise.all([
            getClickMap(links),
            link_event_repo_1.LinkEventRepo.getUniqueVisitorCount(urlIds),
            link_event_repo_1.LinkEventRepo.getDailyTraffic(urlIds, sevenDayStart),
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

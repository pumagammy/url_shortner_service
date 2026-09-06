"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkEventRepo = void 0;
const link_events_schema_1 = require("../models/link-events-schema");
exports.LinkEventRepo = {
    async recordClick(event, source) {
        const linkEvent = new link_events_schema_1.LinkEventModel({
            ...event,
            clicks: 1,
            directSourceCount: source === "direct" ? 1 : 0,
            qrSourceCount: source === "qr" ? 1 : 0,
        });
        return linkEvent.save();
    },
    async getClickTotals(urlIds) {
        if (urlIds.length === 0)
            return [];
        return link_events_schema_1.LinkEventModel.aggregate([
            { $match: { urlId: { $in: urlIds } } },
            { $group: { _id: "$urlId", clicks: { $sum: 1 } } },
        ])
            .exec()
            .then((rows) => rows.map((row) => ({ urlId: row._id.toString(), clicks: row.clicks })));
    },
    async getUniqueVisitorCount(urlIds) {
        if (urlIds.length === 0)
            return 0;
        const rows = await link_events_schema_1.LinkEventModel.aggregate([
            { $match: { urlId: { $in: urlIds } } },
            { $group: { _id: "$visitorId" } },
            { $count: "count" },
        ]).exec();
        return rows[0]?.count ?? 0;
    },
    async getDailyTraffic(urlIds, from) {
        if (urlIds.length === 0)
            return [];
        return link_events_schema_1.LinkEventModel.aggregate([
            { $match: { urlId: { $in: urlIds }, timestamp: { $gte: from } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$timestamp", timezone: "UTC" },
                    },
                    clicks: { $sum: 1 },
                    visitors: { $addToSet: "$visitorId" },
                },
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    clicks: 1,
                    uniqueVisitors: { $size: "$visitors" },
                },
            },
            { $sort: { date: 1 } },
        ]).exec();
    },
    async getGeolocationBreakdown(urlIds) {
        if (urlIds.length === 0)
            return [];
        return link_events_schema_1.LinkEventModel.aggregate([
            { $match: { urlId: { $in: urlIds } } },
            {
                $group: {
                    _id: { country: "$country", region: "$region" },
                    clicks: { $sum: 1 },
                    visitors: { $addToSet: "$visitorId" },
                },
            },
            {
                $project: {
                    _id: 0,
                    country: "$_id.country",
                    region: "$_id.region",
                    clicks: 1,
                    uniqueVisitors: { $size: "$visitors" },
                },
            },
            { $sort: { clicks: -1 } },
        ]).exec();
    },
    async getDeviceBreakdown(urlIds) {
        if (urlIds.length === 0)
            return [];
        return link_events_schema_1.LinkEventModel.aggregate([
            { $match: { urlId: { $in: urlIds } } },
            {
                $group: {
                    _id: "$deviceType",
                    clicks: { $sum: 1 },
                    visitors: { $addToSet: "$visitorId" },
                },
            },
            {
                $project: {
                    _id: 0,
                    deviceType: "$_id",
                    clicks: 1,
                    uniqueVisitors: { $size: "$visitors" },
                },
            },
            { $sort: { clicks: -1 } },
        ]).exec();
    },
    async getBrowserBreakdown(urlIds) {
        if (urlIds.length === 0)
            return [];
        return link_events_schema_1.LinkEventModel.aggregate([
            { $match: { urlId: { $in: urlIds } } },
            {
                $group: {
                    _id: "$browser",
                    clicks: { $sum: 1 },
                    visitors: { $addToSet: "$visitorId" },
                },
            },
            {
                $project: {
                    _id: 0,
                    browser: "$_id",
                    clicks: 1,
                    uniqueVisitors: { $size: "$visitors" },
                },
            },
            { $sort: { clicks: -1 } },
        ]).exec();
    },
    async getOSBreakdown(urlIds) {
        if (urlIds.length === 0)
            return [];
        return link_events_schema_1.LinkEventModel.aggregate([
            { $match: { urlId: { $in: urlIds } } },
            {
                $group: {
                    _id: "$operatingSystem",
                    clicks: { $sum: 1 },
                    visitors: { $addToSet: "$visitorId" },
                },
            },
            {
                $project: {
                    _id: 0,
                    operatingSystem: "$_id",
                    clicks: 1,
                    uniqueVisitors: { $size: "$visitors" },
                },
            },
            { $sort: { clicks: -1 } },
        ]).exec();
    },
    async getReferrerBreakdown(urlIds) {
        if (urlIds.length === 0)
            return [];
        return link_events_schema_1.LinkEventModel.aggregate([
            { $match: { urlId: { $in: urlIds }, referrer: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: "$referrer",
                    clicks: { $sum: 1 },
                    visitors: { $addToSet: "$visitorId" },
                },
            },
            {
                $project: {
                    _id: 0,
                    referrer: "$_id",
                    clicks: 1,
                    uniqueVisitors: { $size: "$visitors" },
                },
            },
            { $sort: { clicks: -1 } },
        ]).exec();
    },
    async getSourceBreakdown(urlIds) {
        if (urlIds.length === 0)
            return [];
        const directResult = await link_events_schema_1.LinkEventModel.aggregate([
            { $match: { urlId: { $in: urlIds }, directSourceCount: { $gt: 0 } } },
            {
                $group: {
                    _id: null,
                    clicks: { $sum: 1 },
                    visitors: { $addToSet: "$visitorId" },
                },
            },
            {
                $project: {
                    clicks: 1,
                    visitors: { $size: "$visitors" },
                },
            },
        ]).exec();
        const qrResult = await link_events_schema_1.LinkEventModel.aggregate([
            { $match: { urlId: { $in: urlIds }, qrSourceCount: { $gt: 0 } } },
            {
                $group: {
                    _id: null,
                    clicks: { $sum: 1 },
                    visitors: { $addToSet: "$visitorId" },
                },
            },
            {
                $project: {
                    clicks: 1,
                    visitors: { $size: "$visitors" },
                },
            },
        ]).exec();
        return [
            {
                source: "direct",
                clicks: directResult[0]?.clicks ?? 0,
                uniqueVisitors: directResult[0]?.visitors ?? 0,
            },
            {
                source: "qr",
                clicks: qrResult[0]?.clicks ?? 0,
                uniqueVisitors: qrResult[0]?.visitors ?? 0,
            },
        ];
    },
};

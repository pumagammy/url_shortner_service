import { Types } from "mongoose";
import {
  DeviceType,
  ILinkEvent,
  LinkEventModel,
  LinkEventSource,
} from "../models/link-events-schema";

export interface CreateLinkEventInput {
  urlId: Types.ObjectId;
  timestamp: Date;
  visitorId: string;
  country: string;
  region?: string;
  deviceType: DeviceType;
  browser: string;
  operatingSystem: string;
  referrer?: string;
}

export interface LinkClickTotal {
  urlId: string;
  clicks: number;
}

export interface DailyLinkTraffic {
  date: string;
  clicks: number;
  uniqueVisitors: number;
}

export interface GeolocationBreakdown {
  country: string;
  region?: string;
  clicks: number;
  uniqueVisitors: number;
}

export interface DeviceBreakdown {
  deviceType: string;
  clicks: number;
  uniqueVisitors: number;
}

export interface BrowserBreakdown {
  browser: string;
  clicks: number;
  uniqueVisitors: number;
}

export interface OSBreakdown {
  operatingSystem: string;
  clicks: number;
  uniqueVisitors: number;
}

export interface ReferrerBreakdown {
  referrer: string;
  clicks: number;
  uniqueVisitors: number;
}

export interface SourceBreakdown {
  source: "qr" | "direct";
  clicks: number;
  uniqueVisitors: number;
}

export const LinkEventRepo = {
  async recordClick(
    event: CreateLinkEventInput,
    source: LinkEventSource
  ): Promise<ILinkEvent> {
    const linkEvent = new LinkEventModel({
      ...event,
      clicks: 1,
      directSourceCount: source === "direct" ? 1 : 0,
      qrSourceCount: source === "qr" ? 1 : 0,
    });

    return linkEvent.save();
  },

  async getClickTotals(urlIds: Types.ObjectId[]): Promise<LinkClickTotal[]> {
    if (urlIds.length === 0) return [];

    return LinkEventModel.aggregate<{ _id: Types.ObjectId; clicks: number }>([
      { $match: { urlId: { $in: urlIds } } },
      { $group: { _id: "$urlId", clicks: { $sum: 1 } } },
    ])
      .exec()
      .then((rows) => rows.map((row) => ({ urlId: row._id.toString(), clicks: row.clicks })));
  },

  async getUniqueVisitorCount(urlIds: Types.ObjectId[]): Promise<number> {
    if (urlIds.length === 0) return 0;

    const rows = await LinkEventModel.aggregate<{ count: number }>([
      { $match: { urlId: { $in: urlIds } } },
      { $group: { _id: "$visitorId" } },
      { $count: "count" },
    ]).exec();

    return rows[0]?.count ?? 0;
  },

  async getDailyTraffic(urlIds: Types.ObjectId[], from: Date): Promise<DailyLinkTraffic[]> {
    if (urlIds.length === 0) return [];

    return LinkEventModel.aggregate<DailyLinkTraffic>([
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

  async getGeolocationBreakdown(urlIds: Types.ObjectId[]): Promise<GeolocationBreakdown[]> {
    if (urlIds.length === 0) return [];

    return LinkEventModel.aggregate<GeolocationBreakdown>([
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

  async getDeviceBreakdown(urlIds: Types.ObjectId[]): Promise<DeviceBreakdown[]> {
    if (urlIds.length === 0) return [];

    return LinkEventModel.aggregate<DeviceBreakdown>([
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

  async getBrowserBreakdown(urlIds: Types.ObjectId[]): Promise<BrowserBreakdown[]> {
    if (urlIds.length === 0) return [];

    return LinkEventModel.aggregate<BrowserBreakdown>([
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

  async getOSBreakdown(urlIds: Types.ObjectId[]): Promise<OSBreakdown[]> {
    if (urlIds.length === 0) return [];

    return LinkEventModel.aggregate<OSBreakdown>([
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

  async getReferrerBreakdown(urlIds: Types.ObjectId[]): Promise<ReferrerBreakdown[]> {
    if (urlIds.length === 0) return [];

    return LinkEventModel.aggregate<ReferrerBreakdown>([
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

  async getSourceBreakdown(urlIds: Types.ObjectId[]): Promise<SourceBreakdown[]> {
    if (urlIds.length === 0) return [];

    const directResult = await LinkEventModel.aggregate<{ clicks: number; visitors: number }>([
      { $match: { urlId: { $in: urlIds }, source: "direct" } },
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

    console.log("Direct result:", directResult);

    const qrResult = await LinkEventModel.aggregate<{ clicks: number; visitors: number }>([
      { $match: { urlId: { $in: urlIds }, source:'qr' } },
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
    console.log("QR result:", qrResult);

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

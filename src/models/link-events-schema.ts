import { Document, Schema, Types, model } from "mongoose";

export type DeviceType = "mobile" | "desktop" | "tablet" | "unknown";
export type LinkEventSource = "qr" | "direct";

export interface ILinkEvent extends Document {
  urlId: Types.ObjectId;
  timestamp: Date;
  visitorId: string;
  country: string;
  region?: string;
  deviceType: DeviceType;
  browser: string;
  operatingSystem: string;
  referrer?: string;
  clicks: number;
  directSourceCount: number;
  qrSourceCount: number;
}

const LinkEventSchema = new Schema<ILinkEvent>(
  {
    urlId: {
      type: Schema.Types.ObjectId,
      ref: "Url",
      required: true,
      index: true,
    },
    timestamp: { type: Date, required: true, default: Date.now },
    visitorId: { type: String, required: true, trim: true, index: true },
    country: { type: String, required: true, trim: true },
    region: { type: String, trim: true },
    deviceType: {
      type: String,
      required: true,
      enum: ["mobile", "desktop", "tablet", "unknown"],
      default: "unknown",
    },
    browser: { type: String, required: true, trim: true },
    operatingSystem: { type: String, required: true, trim: true },
    referrer: { type: String, trim: true },
    clicks: { type: Number, required: true, default: 0, min: 0 },
    directSourceCount: { type: Number, required: true, default: 0, min: 0 },
    qrSourceCount: { type: Number, required: true, default: 0, min: 0 },
  },
  { collection: "linkEvents" }
);

// Each document represents one click. Keeping individual events preserves the
// timestamp needed for daily and weekly analytics.
LinkEventSchema.index({ urlId: 1, timestamp: -1 });
LinkEventSchema.index({ urlId: 1, visitorId: 1, timestamp: -1 });

export const LinkEventModel = model<ILinkEvent>("LinkEvent", LinkEventSchema);

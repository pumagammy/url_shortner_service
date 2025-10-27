import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface Iurl extends Document {
  requestId: String;
  originalUrl: String;
  shortCode: String;
  customizedCode: string;
  shortUrl:String;
  createdAt: Date;
}

const UrlSchema: Schema = new mongoose.Schema<Iurl>({
  requestId: { type: String, required: true, unique: true, default: uuidv4 },
  originalUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  shortUrl: { type: String, required: true, unique: true },
  customizedCode: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const UrlModel = mongoose.model<Iurl>("Url", UrlSchema);

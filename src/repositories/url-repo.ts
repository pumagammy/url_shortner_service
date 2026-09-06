import { Iurl, UrlModel } from "../models/url-schems";


export const UrlRepo = {
  async findByShortCode(shortCode: string): Promise<Iurl | null> {
    return UrlModel.findOne({ shortCode }).exec();
  },

  async findByShortCodeAndUserId(shortCode: string, userId: string): Promise<Iurl | null> {
    return UrlModel.findOne({ shortCode, userId }).exec();
  },

  async findByUserId(userId: string): Promise<Iurl[]> {
    return UrlModel.find({ userId }).sort({ updatedAt: -1 }).exec();
  },

  async existsByShortCode(shortCode: string): Promise<boolean> {
    const exists = await UrlModel.exists({ shortCode });
    return !!exists;
  },

  async createUrl(data: Partial<Iurl>): Promise<Iurl> {
    const doc = new UrlModel(data);
    return doc.save();
  },
  async updateByGuid(guid: string, updates: Partial<Iurl>): Promise<Iurl | null> {
    return UrlModel.findOneAndUpdate({ guid }, { $set: updates }, { new: true }).exec();
  },
};

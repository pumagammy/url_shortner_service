import { Iurl, UrlModel } from "../models/url-schems";


export const UrlRepo = {
  async findByShortCode(shortCode: string): Promise<Iurl | null> {
    return UrlModel.findOne({ shortCode }).exec();
  },

  async existsByShortCode(shortCode: string): Promise<boolean> {
    const exists = await UrlModel.exists({ shortCode });
    return !!exists;
  },

  async createUrl(data: Partial<Iurl>): Promise<Iurl> {
    const doc = new UrlModel(data);
    return doc.save();
  },
};

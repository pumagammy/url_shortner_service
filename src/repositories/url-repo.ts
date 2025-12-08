import { Iurl, UrlModel } from "../models/url-schems";


export const UrlRepo = {
  async findByShortCode(guid: string): Promise<Iurl | null> {
    return UrlModel.findOne({ guid }).exec();
  },

  async existsByUniqueId(guid: string): Promise<boolean> {
    const exists = await UrlModel.exists({ guid });
    return !!exists;
  },

  async createUrl(data: Partial<Iurl>): Promise<Iurl> {
    const doc = new UrlModel(data);
    return doc.save();
  },
};

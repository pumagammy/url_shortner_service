"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlRepo = void 0;
const url_schems_1 = require("../models/url-schems");
exports.UrlRepo = {
    async findByShortCode(shortCode) {
        return url_schems_1.UrlModel.findOne({ shortCode }).exec();
    },
    async findByShortCodeAndUserId(shortCode, userId) {
        return url_schems_1.UrlModel.findOne({ shortCode, userId }).exec();
    },
    async findByUserId(userId) {
        return url_schems_1.UrlModel.find({ userId }).sort({ updatedAt: -1 }).exec();
    },
    async existsByShortCode(shortCode) {
        const exists = await url_schems_1.UrlModel.exists({ shortCode });
        return !!exists;
    },
    async createUrl(data) {
        const doc = new url_schems_1.UrlModel(data);
        return doc.save();
    },
    async updateByGuid(guid, updates) {
        return url_schems_1.UrlModel.findOneAndUpdate({ guid }, { $set: updates }, { new: true }).exec();
    },
};

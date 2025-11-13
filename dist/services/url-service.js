"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlService = void 0;
const url_repo_1 = require("../repositories/url-repo");
const response_message_1 = require("../utils/response/response-message");
const generate_expirydate_1 = require("../utils/short-code-utils/generate-expirydate");
const generate_shortcode_1 = require("../utils/short-code-utils/generate-shortcode");
exports.UrlService = {
    async createShortCode({ originalUrl, customizedCode, expiryDays, expiryDate }) {
        if (!originalUrl || !(0, generate_shortcode_1.isValidUrl)(originalUrl)) {
            throw new Error(response_message_1.INVALID_DATA);
        }
        let shortCode = customizedCode;
        // If custom code provided, validate and check duplicate
        if (shortCode) {
            if (!generate_shortcode_1.CODE_REGEX.test(shortCode))
                throw new Error(response_message_1.INVALID_DATA);
            const exists = await url_repo_1.UrlRepo.findByShortCode(shortCode);
            if (exists)
                throw new Error(response_message_1.ALREADY_IN_USE);
        }
        // Otherwise auto generate unique code
        else {
            shortCode = await url_repo_1.UrlRepo.generateUniqueShortCode();
        }
        const base = process.env.BASE_URL?.replace(/\/+$/, "");
        if (!base)
            throw new Error(response_message_1.INTERNAL_SERVER_ERROR_MESSAGE);
        const shortUrl = `${base}/${shortCode}`;
        const expiresAt = (0, generate_expirydate_1.getExpiryDate)(expiryDays, expiryDate);
        return await url_repo_1.UrlRepo.create({
            originalUrl,
            shortCode,
            shortUrl,
            expiresAt,
            customizedCode,
        });
    },
    async redirectToOriginal(shortCode) {
        const urlEntry = await url_repo_1.UrlRepo.findByShortCode(shortCode);
        if (!urlEntry) {
            throw new Error(response_message_1.BAD_REQUEST);
        }
        // Check if expired
        if (urlEntry.expiresAt && urlEntry.expiresAt < new Date()) {
            throw new Error(response_message_1.DATA_EXPIRED);
        }
        // Increment click count
        urlEntry.clicks += 1;
        await urlEntry.save();
        return urlEntry.originalUrl;
    }
};

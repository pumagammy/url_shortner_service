"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlRepo = void 0;
const url_schems_1 = require("../models/url-schems");
const generate_shortcode_1 = require("../utils/short-code-utils/generate-shortcode");
exports.UrlRepo = {
    async findByShortCode(shortCode) {
        return url_schems_1.UrlModel.findOne({ shortCode });
    },
    async generateUniqueShortCode() {
        let attempts = 0;
        while (attempts < 5) {
            const code = (0, generate_shortcode_1.generateShortCode)();
            const exists = await url_schems_1.UrlModel.exists({ shortCode: code });
            if (!exists)
                return code;
            attempts++;
        }
        throw new Error("Failed to generate unique short code");
    },
    async create(data) {
        return url_schems_1.UrlModel.create(data);
    },
};

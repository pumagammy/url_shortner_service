"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const create_shortcode_1 = require("../controllers/create-shortcode");
const redirect_original_url_1 = require("../controllers/redirect-original-url");
const router = express_1.default.Router();
router.post("/create-shortUrl", async (req, res) => {
    const createShortUrl = await (0, create_shortcode_1.createShortCode)(req, res);
    return createShortUrl;
});
// always redirect route should be at the end to avoid conflicts with other routes
router.get("/:shortCode", async (req, res) => {
    const redirectToOriginalUrl = await (0, redirect_original_url_1.getRedirectToOriginalUrl)(req, res);
    return redirectToOriginalUrl;
});
exports.default = router;

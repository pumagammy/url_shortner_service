"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const create_shortcode_1 = require("../controllers/create-shortcode");
const get_link_safety_1 = require("../controllers/get-link-safety");
const get_ai_analysis_1 = require("../controllers/get-ai-analysis");
const authenticate_1 = require("../middlewares/auth/authenticate");
const router = express_1.default.Router();
router.use(authenticate_1.authenticateToken);
router.post("/create-shortUrl", async (req, res) => {
    const createShortUrl = await (0, create_shortcode_1.createShortCode)(req, res);
    return createShortUrl;
});
router.get("/links/:shortCode/safety", get_link_safety_1.getLinkSafety);
router.get("/links/:shortCode/ai-analysis", get_ai_analysis_1.getAiAnalysis);
exports.default = router;

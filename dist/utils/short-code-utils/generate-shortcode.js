"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUrl = exports.CODE_REGEX = exports.generateShortCode = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateShortCode = () => {
    return crypto_1.default.randomBytes(4).toString('hex');
};
exports.generateShortCode = generateShortCode;
exports.CODE_REGEX = /^[A-Za-z0-9_-]{3,20}$/;
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
exports.isValidUrl = isValidUrl;

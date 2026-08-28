"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueIdAndShortCode = void 0;
const ulid_1 = require("ulid");
/**
 * Generates a full ULID and a 6-char shortCode derived from it.
 *  - ulid: globally unique (time + randomness)
 *  - shortCode: last 6 chars of ULID (you can choose first 6 if you prefer)
 */
const generateUniqueIdAndShortCode = () => {
    const id = (0, ulid_1.ulid)();
    const shortCode = id.slice(-6);
    return { ulidId: id, shortCode };
};
exports.generateUniqueIdAndShortCode = generateUniqueIdAndShortCode;

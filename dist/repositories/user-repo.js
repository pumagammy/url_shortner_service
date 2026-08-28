"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepo = void 0;
const user_schema_1 = require("../models/user-schema");
exports.UserRepo = {
    async findByEmail(email) {
        return user_schema_1.UserModel.findOne({ email: email.toLowerCase().trim() }).exec();
    },
    async findByUserId(userId) {
        return user_schema_1.UserModel.findOne({ userId }).exec();
    },
    async findByGoogleId(googleId) {
        return user_schema_1.UserModel.findOne({ googleId }).exec();
    },
    async createUser(data) {
        const user = new user_schema_1.UserModel(data);
        return user.save();
    },
};

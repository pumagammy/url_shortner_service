"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./config/db");
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const url_route_1 = __importDefault(require("./routes/url-route"));
const auth_route_1 = __importDefault(require("./routes/auth-route"));
const cors_1 = require("./middlewares/cors");
//load .env variables
dotenv_1.default.config();
// initialize express
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
//middleware to parse json
app.use(express_1.default.json());
//middleware to enable CORS
app.use((0, cors_1.corsMiddleware)());
//health check route
app.get("/health-check", (req, res) => {
    res.send({ message: 'Server is healthy', status: 'OK' });
});
// public routes
app.use('/', auth_route_1.default);
app.get("/health-check", (req, res) => {
    res.send({ message: "Server is healthy", status: "OK" });
});
app.use('/', url_route_1.default);
//global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Something went wrong!' });
});
//first connct to db then start the server
(0, db_1.connectDB)().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to the database", error);
});

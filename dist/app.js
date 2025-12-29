"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const transfer_routes_js_1 = __importDefault(require("./routes/transfer.routes.js"));
const account_routes_js_1 = __importDefault(require("./routes/account.routes.js"));
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});
app.use('/transfer', transfer_routes_js_1.default);
app.use('/accounts', account_routes_js_1.default);
app.use('/auth', auth_routes_js_1.default);
exports.default = app;

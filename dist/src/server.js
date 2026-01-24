"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./utils/bigint-serializer.js");
const app_js_1 = __importDefault(require("./app.js"));
const dotenv_1 = __importDefault(require("dotenv"));
require("../queues/webhook-sweeper.js");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
app_js_1.default.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

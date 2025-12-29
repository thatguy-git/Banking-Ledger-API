"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transfer_controller_js_1 = require("../controllers/transfer.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_js_1.authenticateToken, transfer_controller_js_1.TransferController.transfer);
router.post('/deposit', auth_middleware_js_1.authenticateToken, transfer_controller_js_1.TransferController.deposit);
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const messageCard_controller_1 = require("./controller/messageCard.controller");
const router = (0, express_1.Router)();
router.get('/', (0, asyncHandler_1.asyncHandler)(messageCard_controller_1.listMessageCardsController));
router.get('/popular', (0, asyncHandler_1.asyncHandler)(messageCard_controller_1.popularMessageCardsController));
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.get('/provinces', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const provinces = await prisma.province.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json(provinces);
}));
router.get('/towns', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const provinceId = Number(req.query.provinceId);
    if (!provinceId || Number.isNaN(provinceId))
        return res.status(400).json({ message: 'provinceId is required' });
    const towns = await prisma.town.findMany({ where: { provinceId }, orderBy: { name: 'asc' } });
    res.status(200).json(towns);
}));
router.get('/districts', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const townId = Number(req.query.townId);
    if (!townId || Number.isNaN(townId))
        return res.status(400).json({ message: 'townId is required' });
    const districts = await prisma.district.findMany({ where: { townId }, orderBy: { name: 'asc' } });
    res.status(200).json(districts);
}));
router.get('/quarters', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const districtId = Number(req.query.districtId);
    if (!districtId || Number.isNaN(districtId))
        return res.status(400).json({ message: 'districtId is required' });
    const quarters = await prisma.quarter.findMany({ where: { districtId }, orderBy: { name: 'asc' } });
    res.status(200).json(quarters);
}));
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAddressesController = listAddressesController;
exports.getAddressController = getAddressController;
exports.createAddressController = createAddressController;
exports.updateAddressController = updateAddressController;
exports.setDefaultAddressController = setDefaultAddressController;
exports.deleteAddressController = deleteAddressController;
exports.getDefaultAddressController = getDefaultAddressController;
const address_service_1 = require("../service/address.service");
const addresses_dto_1 = require("../dto/addresses.dto");
const addressService = new address_service_1.AddressService();
/**
 * List user addresses
 * GET /api/v1/addresses
 */
async function listAddressesController(req, res) {
    const userId = req.user.id;
    const addresses = await addressService.listAddresses(userId);
    res.status(200).json({ addresses });
}
/**
 * Get single address
 * GET /api/v1/addresses/:id
 */
async function getAddressController(req, res) {
    const userId = req.user.id;
    const { id } = addresses_dto_1.addressIdParamSchema.parse(req.params);
    const address = await addressService.getAddress(userId, id);
    res.status(200).json(address);
}
/**
 * Create new address
 * POST /api/v1/addresses
 */
async function createAddressController(req, res) {
    const userId = req.user.id;
    const data = addresses_dto_1.createAddressSchema.parse(req.body);
    const address = await addressService.createAddress({
        userId,
        label: data.label,
        fullName: data.fullName,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        districtName: data.district, // Changed from district to districtName to match schema
        postalCode: data.postalCode,
        country: data.country,
        isDefault: data.isDefault,
    });
    res.status(201).json(address);
}
/**
 * Update existing address
 * PUT /api/v1/addresses/:id
 */
async function updateAddressController(req, res) {
    const userId = req.user.id;
    const { id } = addresses_dto_1.addressIdParamSchema.parse(req.params);
    const data = addresses_dto_1.updateAddressSchema.parse(req.body);
    const address = await addressService.updateAddress({
        ...data,
        id,
        userId
    });
    res.status(200).json(address);
}
/**
 * Set address as default
 * POST /api/v1/addresses/:id/default
 */
async function setDefaultAddressController(req, res) {
    const userId = req.user.id;
    const { id } = addresses_dto_1.addressIdParamSchema.parse(req.params);
    const address = await addressService.setDefault(userId, id);
    res.status(200).json(address);
}
/**
 * Delete address
 * DELETE /api/v1/addresses/:id
 */
async function deleteAddressController(req, res) {
    const userId = req.user.id;
    const { id } = addresses_dto_1.addressIdParamSchema.parse(req.params);
    await addressService.deleteAddress(userId, id);
    res.status(204).send();
}
/**
 * Get default address
 * GET /api/v1/addresses/default
 */
async function getDefaultAddressController(req, res) {
    const userId = req.user.id;
    const address = await addressService.getDefaultAddress(userId);
    if (!address) {
        return res.status(404).json({
            message: 'Varsayılan adres bulunamadı.'
        });
    }
    res.status(200).json(address);
}

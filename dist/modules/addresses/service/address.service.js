"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressService = void 0;
const database_1 = require("../../../config/database");
const ApiError_1 = require("../../../shared/errors/ApiError");
const env_1 = require("../../../config/env");
class AddressService {
    /**
     * List user addresses
     */
    async listAddresses(userId) {
        const addresses = await database_1.prisma.address.findMany({
            where: { userId },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        return addresses;
    }
    /**
     * Get single address by ID
     */
    async getAddress(userId, addressId) {
        const address = await database_1.prisma.address.findFirst({
            where: {
                id: addressId,
                userId
            }
        });
        if (!address) {
            throw (0, ApiError_1.notFound)('Adres bulunamadı.');
        }
        return address;
    }
    /**
     * Create new address
     */
    async createAddress(data) {
        const { userId } = data;
        // Check address limit
        const count = await database_1.prisma.address.count({
            where: { userId }
        });
        if (count >= env_1.env.MAX_USER_ADDRESSES) {
            throw (0, ApiError_1.badRequest)(`En fazla ${env_1.env.MAX_USER_ADDRESSES} adres ekleyebilirsiniz. ` +
                `Yeni adres eklemek için mevcut bir adresi silin.`);
        }
        // If this is first address or explicitly set as default
        const isFirstAddress = count === 0;
        const shouldBeDefault = isFirstAddress || data.isDefault;
        // Create address in transaction
        return await database_1.prisma.$transaction(async (tx) => {
            // If setting as default, unset other defaults
            if (shouldBeDefault) {
                await tx.address.updateMany({
                    where: { userId },
                    data: { isDefault: false }
                });
            }
            // Create new address
            const address = await tx.address.create({
                data: {
                    ...data,
                    isDefault: shouldBeDefault
                }
            });
            return address;
        });
    }
    /**
     * Update existing address
     */
    async updateAddress(data) {
        const { id, userId, ...updateData } = data;
        // Verify ownership
        const existing = await database_1.prisma.address.findFirst({
            where: { id, userId }
        });
        if (!existing) {
            throw (0, ApiError_1.notFound)('Adres bulunamadı veya size ait değil.');
        }
        // Update in transaction
        return await database_1.prisma.$transaction(async (tx) => {
            // If setting as default, unset other defaults
            if (updateData.isDefault) {
                await tx.address.updateMany({
                    where: {
                        userId,
                        NOT: { id }
                    },
                    data: { isDefault: false }
                });
            }
            // Update address
            const updated = await tx.address.update({
                where: { id },
                data: updateData
            });
            return updated;
        });
    }
    /**
     * Set address as default
     */
    async setDefault(userId, addressId) {
        // Verify ownership
        const address = await database_1.prisma.address.findFirst({
            where: { id: addressId, userId }
        });
        if (!address) {
            throw (0, ApiError_1.notFound)('Adres bulunamadı veya size ait değil.');
        }
        // Update in transaction
        return await database_1.prisma.$transaction(async (tx) => {
            // Unset all defaults
            await tx.address.updateMany({
                where: { userId },
                data: { isDefault: false }
            });
            // Set new default
            const updated = await tx.address.update({
                where: { id: addressId },
                data: { isDefault: true }
            });
            return updated;
        });
    }
    /**
     * Delete address
     */
    async deleteAddress(userId, addressId) {
        // Verify ownership
        const address = await database_1.prisma.address.findFirst({
            where: { id: addressId, userId }
        });
        if (!address) {
            throw (0, ApiError_1.notFound)('Adres bulunamadı veya size ait değil.');
        }
        // Check if it's the only address
        const count = await database_1.prisma.address.count({
            where: { userId }
        });
        // Allow deletion even if it's the only address (no minimum requirement)
        // Delete in transaction
        await database_1.prisma.$transaction(async (tx) => {
            await tx.address.delete({
                where: { id: addressId }
            });
            // If deleted address was default, set another as default
            if (address.isDefault && count > 1) {
                const nextAddress = await tx.address.findFirst({
                    where: { userId },
                    orderBy: { createdAt: 'desc' }
                });
                if (nextAddress) {
                    await tx.address.update({
                        where: { id: nextAddress.id },
                        data: { isDefault: true }
                    });
                }
            }
        });
    }
    /**
     * Get default address
     */
    async getDefaultAddress(userId) {
        const address = await database_1.prisma.address.findFirst({
            where: {
                userId,
                isDefault: true
            }
        });
        return address;
    }
    /**
     * Validate address for order
     * Checks if address exists and belongs to user
     */
    async validateAddressForOrder(userId, addressId) {
        const address = await database_1.prisma.address.findFirst({
            where: {
                id: addressId,
                userId
            }
        });
        return !!address;
    }
}
exports.AddressService = AddressService;

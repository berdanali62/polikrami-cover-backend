import { prisma } from '../../../config/database';
import { notFound, badRequest, forbidden } from '../../../shared/errors/ApiError';

// Maximum addresses per user
const MAX_ADDRESSES = 5;

interface CreateAddressData {
  userId: string;
  label?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  district?: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
}

interface UpdateAddressData {
  id: string;
  userId: string;
  label?: string;
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export class AddressService {
  /**
   * List user addresses
   */
  async listAddresses(userId: string) {
    const addresses = await prisma.address.findMany({
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
  async getAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId
      }
    });

    if (!address) {
      throw notFound('Adres bulunamadı.');
    }

    return address;
  }

  /**
   * Create new address
   */
  async createAddress(data: CreateAddressData) {
    const { userId } = data;

    // Check address limit
    const count = await prisma.address.count({
      where: { userId }
    });

    if (count >= MAX_ADDRESSES) {
      throw badRequest(
        `En fazla ${MAX_ADDRESSES} adres ekleyebilirsiniz. ` +
        `Yeni adres eklemek için mevcut bir adresi silin.`
      );
    }

    // If this is first address or explicitly set as default
    const isFirstAddress = count === 0;
    const shouldBeDefault = isFirstAddress || data.isDefault;

    // Create address in transaction
    return await prisma.$transaction(async (tx) => {
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
  async updateAddress(data: UpdateAddressData) {
    const { id, userId, ...updateData } = data;

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw notFound('Adres bulunamadı veya size ait değil.');
    }

    // Update in transaction
    return await prisma.$transaction(async (tx) => {
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
  async setDefault(userId: string, addressId: string) {
    // Verify ownership
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId }
    });

    if (!address) {
      throw notFound('Adres bulunamadı veya size ait değil.');
    }

    // Update in transaction
    return await prisma.$transaction(async (tx) => {
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
  async deleteAddress(userId: string, addressId: string) {
    // Verify ownership
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId }
    });

    if (!address) {
      throw notFound('Adres bulunamadı veya size ait değil.');
    }

    // Check if it's the only address
    const count = await prisma.address.count({
      where: { userId }
    });

    // Allow deletion even if it's the only address (no minimum requirement)

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
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
  async getDefaultAddress(userId: string) {
    const address = await prisma.address.findFirst({
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
  async validateAddressForOrder(userId: string, addressId: string): Promise<boolean> {
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId
      }
    });

    return !!address;
  }
}
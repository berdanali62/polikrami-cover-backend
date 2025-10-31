interface CreateAddressData {
    userId: string;
    label?: string;
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    districtName?: string;
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
    districtName?: string;
    postalCode?: string;
    country?: string;
    isDefault?: boolean;
}
export declare class AddressService {
    /**
     * List user addresses
     */
    listAddresses(userId: string): Promise<{
        userId: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        label: string | null;
        fullName: string | null;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        districtName: string | null;
        postalCode: string | null;
        country: string;
        isDefault: boolean;
        provinceId: number | null;
        townId: number | null;
        districtId: number | null;
        quarterId: number | null;
    }[]>;
    /**
     * Get single address by ID
     */
    getAddress(userId: string, addressId: string): Promise<{
        userId: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        label: string | null;
        fullName: string | null;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        districtName: string | null;
        postalCode: string | null;
        country: string;
        isDefault: boolean;
        provinceId: number | null;
        townId: number | null;
        districtId: number | null;
        quarterId: number | null;
    }>;
    /**
     * Create new address
     */
    createAddress(data: CreateAddressData): Promise<{
        userId: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        label: string | null;
        fullName: string | null;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        districtName: string | null;
        postalCode: string | null;
        country: string;
        isDefault: boolean;
        provinceId: number | null;
        townId: number | null;
        districtId: number | null;
        quarterId: number | null;
    }>;
    /**
     * Update existing address
     */
    updateAddress(data: UpdateAddressData): Promise<{
        userId: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        label: string | null;
        fullName: string | null;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        districtName: string | null;
        postalCode: string | null;
        country: string;
        isDefault: boolean;
        provinceId: number | null;
        townId: number | null;
        districtId: number | null;
        quarterId: number | null;
    }>;
    /**
     * Set address as default
     */
    setDefault(userId: string, addressId: string): Promise<{
        userId: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        label: string | null;
        fullName: string | null;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        districtName: string | null;
        postalCode: string | null;
        country: string;
        isDefault: boolean;
        provinceId: number | null;
        townId: number | null;
        districtId: number | null;
        quarterId: number | null;
    }>;
    /**
     * Delete address
     */
    deleteAddress(userId: string, addressId: string): Promise<void>;
    /**
     * Get default address
     */
    getDefaultAddress(userId: string): Promise<{
        userId: string;
        createdAt: Date;
        id: string;
        updatedAt: Date;
        label: string | null;
        fullName: string | null;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        districtName: string | null;
        postalCode: string | null;
        country: string;
        isDefault: boolean;
        provinceId: number | null;
        townId: number | null;
        districtId: number | null;
        quarterId: number | null;
    } | null>;
    /**
     * Validate address for order
     * Checks if address exists and belongs to user
     */
    validateAddressForOrder(userId: string, addressId: string): Promise<boolean>;
}
export {};

import { z } from 'zod';
export declare const TURKISH_CITIES: readonly ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Şırnak", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"];
/**
 * Create/Update address schema
 */
export declare const createAddressSchema: z.ZodObject<{
    label: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    fullName: z.ZodEffects<z.ZodString, string, string>;
    phone: z.ZodEffects<z.ZodString, string, string>;
    line1: z.ZodEffects<z.ZodString, string, string>;
    line2: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    city: z.ZodEnum<z.Writeable<any>>;
    district: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    postalCode: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    country: z.ZodDefault<z.ZodString>;
    isDefault: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    phone: string;
    line1: string;
    country: string;
    isDefault: boolean;
    label?: string | undefined;
    line2?: string | undefined;
    city?: any;
    district?: string | undefined;
    postalCode?: string | undefined;
}, {
    fullName: string;
    phone: string;
    line1: string;
    label?: string | undefined;
    line2?: string | undefined;
    city?: any;
    district?: string | undefined;
    postalCode?: string | undefined;
    country?: string | undefined;
    isDefault?: boolean | undefined;
}>;
/**
 * Update address schema (includes ID)
 */
export declare const updateAddressSchema: z.ZodObject<{
    label: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    fullName: z.ZodEffects<z.ZodString, string, string>;
    phone: z.ZodEffects<z.ZodString, string, string>;
    line1: z.ZodEffects<z.ZodString, string, string>;
    line2: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    city: z.ZodEnum<z.Writeable<any>>;
    district: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    postalCode: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    country: z.ZodDefault<z.ZodString>;
    isDefault: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
} & {
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    fullName: string;
    phone: string;
    line1: string;
    country: string;
    isDefault: boolean;
    label?: string | undefined;
    line2?: string | undefined;
    city?: any;
    district?: string | undefined;
    postalCode?: string | undefined;
}, {
    id: string;
    fullName: string;
    phone: string;
    line1: string;
    label?: string | undefined;
    line2?: string | undefined;
    city?: any;
    district?: string | undefined;
    postalCode?: string | undefined;
    country?: string | undefined;
    isDefault?: boolean | undefined;
}>;
/**
 * Address ID param schema
 */
export declare const addressIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
/**
 * Set default address schema
 */
export declare const setDefaultSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type CreateAddressDto = z.infer<typeof createAddressSchema>;
export type UpdateAddressDto = z.infer<typeof updateAddressSchema>;
export type AddressIdParamDto = z.infer<typeof addressIdParamSchema>;
export type SetDefaultDto = z.infer<typeof setDefaultSchema>;

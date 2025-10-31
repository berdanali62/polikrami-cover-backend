"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultSchema = exports.addressIdParamSchema = exports.updateAddressSchema = exports.createAddressSchema = exports.TURKISH_CITIES = void 0;
const zod_1 = require("zod");
/*
 * Turkish cities list (81 cities)
 * In production, this should come from database or external API
 */
exports.TURKISH_CITIES = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara',
    'Antalya', 'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman',
    'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
    'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce',
    'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep',
    'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
    'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu',
    'Kayseri', 'Kilis', 'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli',
    'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla',
    'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya',
    'Samsun', 'Şanlıurfa', 'Siirt', 'Sinop', 'Şırnak', 'Sivas', 'Tekirdağ',
    'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
];
/**
 * Create/Update address schema
 */
exports.createAddressSchema = zod_1.z.object({
    label: zod_1.z.string()
        .min(2, { message: 'Adres etiketi en az 2 karakter olmalıdır.' })
        .max(60, { message: 'Adres etiketi en fazla 60 karakter olabilir.' })
        .optional()
        .transform(val => val?.trim()),
    fullName: zod_1.z.string()
        .min(3, { message: 'Ad soyad en az 3 karakter olmalıdır.' })
        .max(120, { message: 'Ad soyad en fazla 120 karakter olabilir.' })
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, {
        message: 'Ad soyad sadece harf içermelidir.'
    })
        .transform(val => val.trim()),
    phone: zod_1.z.string()
        .min(10, { message: 'Telefon numarası en az 10 karakter olmalıdır.' })
        .max(20, { message: 'Telefon numarası en fazla 20 karakter olabilir.' })
        .regex(/^[\d\s\-\+\(\)]+$/, {
        message: 'Geçersiz telefon numarası formatı.'
    })
        .transform(val => val.trim()),
    line1: zod_1.z.string()
        .min(10, { message: 'Adres en az 10 karakter olmalıdır.' })
        .max(200, { message: 'Adres en fazla 200 karakter olabilir.' })
        .transform(val => val.trim()),
    line2: zod_1.z.string()
        .max(200, { message: 'Ek adres bilgisi en fazla 200 karakter olabilir.' })
        .optional()
        .transform(val => val?.trim() || undefined),
    city: zod_1.z.enum(exports.TURKISH_CITIES, {
        errorMap: () => ({ message: 'Geçerli bir şehir seçiniz.' })
    }),
    district: zod_1.z.string()
        .min(2, { message: 'İlçe en az 2 karakter olmalıdır.' })
        .max(50, { message: 'İlçe en fazla 50 karakter olabilir.' })
        .optional()
        .transform(val => val?.trim()),
    postalCode: zod_1.z.string()
        .regex(/^\d{5}$/, { message: 'Posta kodu 5 haneli olmalıdır.' })
        .optional()
        .transform(val => val?.trim()),
    country: zod_1.z.string()
        .length(2, { message: 'Ülke kodu 2 karakter olmalıdır.' })
        .default('TR'),
    isDefault: zod_1.z.boolean()
        .optional()
        .default(false)
});
/**
 * Update address schema (includes ID)
 */
exports.updateAddressSchema = exports.createAddressSchema.extend({
    id: zod_1.z.string().uuid({ message: 'Geçerli bir adres ID giriniz.' })
});
/**
 * Address ID param schema
 */
exports.addressIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: 'Geçerli bir adres ID giriniz.' })
});
/**
 * Set default address schema
 */
exports.setDefaultSchema = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: 'Geçerli bir adres ID giriniz.' })
});

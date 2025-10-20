import { z } from 'zod';

/*
 * Turkish cities list (81 cities)
 * In production, this should come from database or external API
 */
export const TURKISH_CITIES = [
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
] as const;

/**
 * Create/Update address schema
 */
export const createAddressSchema = z.object({
  label: z.string()
    .min(2, { message: 'Adres etiketi en az 2 karakter olmalıdır.' })
    .max(60, { message: 'Adres etiketi en fazla 60 karakter olabilir.' })
    .optional()
    .transform(val => val?.trim()),
  
  fullName: z.string()
    .min(3, { message: 'Ad soyad en az 3 karakter olmalıdır.' })
    .max(120, { message: 'Ad soyad en fazla 120 karakter olabilir.' })
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, { 
      message: 'Ad soyad sadece harf içermelidir.' 
    })
    .transform(val => val.trim()),
  
  phone: z.string()
    .min(10, { message: 'Telefon numarası en az 10 karakter olmalıdır.' })
    .max(20, { message: 'Telefon numarası en fazla 20 karakter olabilir.' })
    .regex(/^[\d\s\-\+\(\)]+$/, { 
      message: 'Geçersiz telefon numarası formatı.' 
    })
    .transform(val => val.trim()),
  
  line1: z.string()
    .min(10, { message: 'Adres en az 10 karakter olmalıdır.' })
    .max(200, { message: 'Adres en fazla 200 karakter olabilir.' })
    .transform(val => val.trim()),
  
  line2: z.string()
    .max(200, { message: 'Ek adres bilgisi en fazla 200 karakter olabilir.' })
    .optional()
    .transform(val => val?.trim() || undefined),
  
  city: z.enum(TURKISH_CITIES as any, {
    errorMap: () => ({ message: 'Geçerli bir şehir seçiniz.' })
  }),
  
  district: z.string()
    .min(2, { message: 'İlçe en az 2 karakter olmalıdır.' })
    .max(50, { message: 'İlçe en fazla 50 karakter olabilir.' })
    .optional()
    .transform(val => val?.trim()),
  
  postalCode: z.string()
    .regex(/^\d{5}$/, { message: 'Posta kodu 5 haneli olmalıdır.' })
    .optional()
    .transform(val => val?.trim()),
  
  country: z.string()
    .length(2, { message: 'Ülke kodu 2 karakter olmalıdır.' })
    .default('TR'),
  
  isDefault: z.boolean()
    .optional()
    .default(false)
});

/**
 * Update address schema (includes ID)
 */
export const updateAddressSchema = createAddressSchema.extend({
  id: z.string().uuid({ message: 'Geçerli bir adres ID giriniz.' })
});

/**
 * Address ID param schema
 */
export const addressIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Geçerli bir adres ID giriniz.' })
});

/**
 * Set default address schema
 */
export const setDefaultSchema = z.object({
  id: z.string().uuid({ message: 'Geçerli bir adres ID giriniz.' })
});

// Type exports
export type CreateAddressDto = z.infer<typeof createAddressSchema>;
export type UpdateAddressDto = z.infer<typeof updateAddressSchema>;
export type AddressIdParamDto = z.infer<typeof addressIdParamSchema>;
export type SetDefaultDto = z.infer<typeof setDefaultSchema>;
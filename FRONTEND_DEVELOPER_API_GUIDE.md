# Frontend Developer API Kılavuzu

## 📋 İçindekiler

1. [Kimlik Doğrulama (Authentication)](#-kimlik-doğrulama-authentication)
2. [Kullanıcı İşlemleri (Users)](#-kullanıcı-i̇şlemleri-users)
3. [Taslaklar (Drafts)](#-taslaklar-drafts)
4. [Siparişler (Orders)](#️-siparişler-orders)
5. [Ödemeler (Payments)](#-ödemeler-payments)
6. [Tasarımcılar (Designers)](#-tasarımcılar-designers)
7. [Yorumlar (Reviews)](#-yorumlar-reviews)
8. [Bildirimler (Notifications)](#-bildirimler-notifications)
9. [Adresler (Addresses)](#-adresler-addresses)
10. [Şablonlar (Templates)](#-şablonlar-templates)
11. [Kategoriler (Categories)](#-kategoriler-categories)
12. [Arama (Search)](#-arama-search)
13. [AI Üretimi (AI Generation)](#-ai-üretimi-ai-generation)
14. [Beğeniler (Likes)](#️-beğeniler-likes)
15. [Mesaj Kartları (Message Cards)](#-mesaj-kartları-message-cards)
16. [Dosya İşlemleri (Files)](#-dosya-i̇şlemleri-files)
17. [Cüzdan (Wallet)](#-cüzdan-wallet)
18. [Projeler (Projects)](#-projeler-projects)
19. [Organizasyonlar (Organizations)](#-organizasyonlar-organizations)
20. [İadeler (Returns)](#-i̇adeler-returns)
21. [İletişim (Contact)](#-i̇letişim-contact)
22. [Varlıklar (Assets)](#-varlıklar-assets)

---

## 🔐 Kimlik Doğrulama (Authentication)

1.1. Kayıt Olma
Endpoint: POST /api/v1/auth/register
Auth: Gerekli değil
Açıklama: function registerUser()
Frontend'den Gelecek Veriler:
typescript{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: "customer" | "designer";
}
Backend'in Döndüreceği Cevap:
typescript{
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}
1.2. Giriş Yapma
Endpoint: POST /api/v1/auth/login
Auth: Gerekli değil
Açıklama: function loginUser()
Frontend'den Gelecek Veriler:
typescript{
  email: string;
  password: string;
}
Backend'in Döndüreceği Cevap:
typescript{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}
1.3. Token Yenileme
Endpoint: POST /api/v1/auth/refresh
Auth: Gerekli değil
Açıklama: function refreshToken()
Frontend'den Gelecek Veriler:
typescript{
  refreshToken: string;
}
Backend'in Döndüreceği Cevap:
typescript{
  accessToken: string;
  refreshToken: string;
}
1.4. Çıkış Yapma
Endpoint: POST /api/v1/auth/logout
Auth: Gerekli
Açıklama: function logoutUser()
Backend'in Döndüreceği Cevap:
typescript{
  message: string;
}
1.5. Şifre Sıfırlama İsteği
Endpoint: POST /api/v1/auth/forgot-password
Auth: Gerekli değil
Açıklama: function forgotPassword()
Frontend'den Gelecek Veriler:
typescript{
  email: string;
}
Backend'in Döndüreceği Cevap:
typescript{
  message: string;
}
1.6. Şifre Sıfırlama
Endpoint: POST /api/v1/auth/reset-password
Auth: Gerekli değil
Açıklama: function resetPassword()
Frontend'den Gelecek Veriler:
typescript{
  token: string;
  newPassword: string;
}
Backend'in Döndüreceği Cevap:
typescript{
  message: string;
}
1.7. Email Doğrulama
Endpoint: POST /api/v1/auth/verify-email
Auth: Gerekli değil
Açıklama: function verifyEmail()
Frontend'den Gelecek Veriler:
typescript{
  token: string;
}
Backend'in Döndüreceği Cevap:
typescript{
  message: string;
  user: User;
}
1.8. Email Doğrulama Linki Gönderme
Endpoint: POST /api/v1/auth/resend-verification
Auth: Gerekli
Açıklama: function resendVerificationEmail()
Backend'in Döndüreceği Cevap:
typescript{
  message: string;
}

---
## 👤 Kullanıcı İşlemleri (Users)

### 2.1. Profil Bilgilerini Getirme

**Endpoint**: `GET /api/v1/users/me`  
**Auth**: Gerekli

**Açıklama**: function getUserProfile()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}
```

### 2.2. Profil Güncelleme

**Endpoint**: `PUT /api/v1/users/me`  
**Auth**: Gerekli

**Açıklama**: function updateUserProfile()

**Frontend'den Gelecek Veriler:**
```typescript
{
  firstName?: string;
  lastName?: string;
  phone?: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  updatedAt: string;
}
```

### 2.3. Avatar Yükleme

**Endpoint**: `POST /api/v1/users/me/avatar`  
**Auth**: Gerekli

**Açıklama**: function uploadAvatar()

**Frontend'den Gelecek Veriler:** FormData with file

**Backend'in Döndüreceği Cevap:**
```typescript
{
  avatarUrl: string;
}
```

### 2.4. Şifre Değiştirme

**Endpoint**: `PUT /api/v1/users/me/password`  
**Auth**: Gerekli

**Açıklama**: function changePassword()

**Frontend'den Gelecek Veriler:**
```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
}
```

### 2.5. Tasarımcı Profili Oluşturma

**Endpoint**: `POST /api/v1/users/me/designer-profile`  
**Auth**: Gerekli

**Açıklama**: function createDesignerProfile()

**Frontend'den Gelecek Veriler:**
```typescript
{
  artistBio: string;
  specialization: string;
  portfolio?: string[];
  behanceUrl?: string;
  dribbbleUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
  designerProfile: DesignerProfile;
}
```

### 2.6. Tasarımcı Profili Güncelleme

**Endpoint**: `PUT /api/v1/users/me/designer-profile`  
**Auth**: Gerekli

**Açıklama**: function updateDesignerProfile()

**Frontend'den Gelecek Veriler:**
```typescript
{
  artistBio?: string;
  specialization?: string;
  portfolio?: string[];
  isAvailable?: boolean;
  behanceUrl?: string;
  dribbbleUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
  designerProfile: DesignerProfile;
}
```

### 2.7. Gizlilik Ayarları

**Endpoint**: `PUT /api/v1/users/me/privacy`  
**Auth**: Gerekli

**Açıklama**: function updatePrivacySettings()

**Frontend'den Gelecek Veriler:**
```typescript
{
  showEmail?: boolean;
  showPhone?: boolean;
  showAddress?: boolean;
  showPortfolio?: boolean;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
  settings: {
    showEmail: boolean;
    showPhone: boolean;
    showAddress: boolean;
    showPortfolio: boolean;
  };
}
```

---

## 📝 Taslaklar (Drafts)

### 3.1. Taslak Oluşturma

**Endpoint**: `POST /api/v1/drafts`  
**Auth**: Gerekli

**Açıklama**: function createDraft()

**Frontend'den Gelecek Veriler:**
```typescript
{
  method: "ai" | "template" | "designer";
  categoryId: string;
  aiPrompt?: string;
  templateId?: string;
  assignedDesignerId?: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  userId: string;
  method: string;
  categoryId: string;
  status: string;
  workflowStatus: string;
  createdAt: string;
}
```

### 3.2. Taslakları Listeleme

**Endpoint**: `GET /api/v1/drafts`  
**Auth**: Gerekli

**Açıklama**: function listDrafts()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  drafts: Draft[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 3.3. Taslak Detayı

**Endpoint**: `GET /api/v1/drafts/:id`  
**Auth**: Gerekli

**Açıklama**: function getDraftById()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  userId: string;
  method: string;
  status: string;
  assignedDesigner: Designer | null;
  files: File[];
  messageCard: MessageCard | null;
  shipping: ShippingAddress | null;
  billingAddress: BillingAddress | null;
  workflowHistory: WorkflowStep[];
}
```

### 3.4. Taslak Güncelleme

**Endpoint**: `PUT /api/v1/drafts/:id`  
**Auth**: Gerekli

**Açıklama**: function updateDraft()

**Frontend'den Gelecek Veriler:**
```typescript
{
  aiPrompt?: string;
  coverType?: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  aiPrompt: string | null;
  updatedAt: string;
}
```

### 3.5. Dosya Yükleme URL'i Alma

**Endpoint**: `POST /api/v1/drafts/:id/presign`  
**Auth**: Gerekli

**Açıklama**: function getUploadUrl()

**Frontend'den Gelecek Veriler:**
```typescript
{
  filename: string;
  contentType: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  url: string;
  key: string;
  expiresIn: number;
}
```

### 3.6. Dosya Yükleme

**Endpoint**: `POST /api/v1/drafts/:id/upload`  
**Auth**: Gerekli

**Açıklama**: function uploadFile()

**Frontend'den Gelecek Veriler:** FormData with file

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
  fileUrl: string;
  fileId: string;
}
```

### 3.7. Mesaj Kartı Ayarlama

**Endpoint**: `POST /api/v1/drafts/:id/message-card`  
**Auth**: Gerekli

**Açıklama**: function setMessageCard()

**Frontend'den Gelecek Veriler:**
```typescript
{
  messageCard: {
    text: string;
    cardType: string;
  };
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  messageCard: MessageCard;
  updatedAt: string;
}
```

### 3.8. Teslimat Adresi Ayarlama

**Endpoint**: `POST /api/v1/drafts/:id/shipping`  
**Auth**: Gerekli

**Açıklama**: function setShippingAddress()

**Frontend'den Gelecek Veriler:**
```typescript
{
  shipping: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  shipping: ShippingAddress;
  updatedAt: string;
}
```

### 3.9. Teslimat Adresini Mevcut Adresten Ayarlama

**Endpoint**: `POST /api/v1/drafts/:id/shipping/address`  
**Auth**: Gerekli

**Açıklama**: function setShippingFromAddress()

**Frontend'den Gelecek Veriler:**
```typescript
{
  addressId: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  shipping: ShippingAddress;
}
```

### 3.10. Fatura Adresi Ayarlama

**Endpoint**: `POST /api/v1/drafts/:id/billing`  
**Auth**: Gerekli

**Açıklama**: function setBillingAddress()

**Frontend'den Gelecek Veriler:**
```typescript
{
  billingAddress: BillingAddress | "same_as_shipping";
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  billingAddress: BillingAddress;
}
```

### 3.11. Tasarımcı Atama

**Endpoint**: `POST /api/v1/drafts/:id/assign-designer`  
**Auth**: Gerekli

**Açıklama**: function assignDesigner()

**Frontend'den Gelecek Veriler:**
```typescript
{
  designerId: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  assignedDesigner: Designer;
  workflowStatus: string;
}
```

### 3.12. Taslağı Siparişe Dönüştürme

**Endpoint**: `POST /api/v1/drafts/:id/commit`  
**Auth**: Gerekli

**Açıklama**: function commitDraft()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  order: Order;
}
```

### 3.13. Önizleme Gönderme

**Endpoint**: `POST /api/v1/drafts/:id/preview`  
**Auth**: Gerekli (Designer)

**Açıklama**: function sendPreview()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
  workflowStatus: string;
  updatedAt: string;
}
```

### 3.14. Revize Talebi

**Endpoint**: `POST /api/v1/drafts/:id/revision`  
**Auth**: Gerekli

**Açıklama**: function requestRevision()

**Frontend'den Gelecek Veriler:**
```typescript
{
  comments: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
  workflowStatus: string;
  revisionComments: string;
  updatedAt: string;
}
```

### 3.15. Onaylama

**Endpoint**: `POST /api/v1/drafts/:id/approve`  
**Auth**: Gerekli

**Açıklama**: function approveDraft()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
  workflowStatus: string;
  status: string;
  updatedAt: string;
}
```

### 3.16. İptal Etme

**Endpoint**: `POST /api/v1/drafts/:id/cancel`  
**Auth**: Gerekli

**Açıklama**: function cancelDraft()

**Frontend'den Gelecek Veriler:**
```typescript
{
  reason?: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
  status: string;
  cancelReason: string | null;
}
```

### 3.17. İş Akışı Geçmişi

**Endpoint**: `GET /api/v1/drafts/:id/workflow-history`  
**Auth**: Gerekli

**Açıklama**: function getWorkflowHistory()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  history: WorkflowStep[];
}
```

### 3.18. Revize Detayları

**Endpoint**: `GET /api/v1/drafts/:id/revisions`  
**Auth**: Gerekli

**Açıklama**: function getRevisionDetails()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  revisions: Revision[];
  totalRevisions: number;
}
```

---

## 🛍️ Siparişler (Orders)

### 4.1. Siparişleri Listeleme

**Endpoint**: `GET /api/v1/orders`  
**Auth**: Gerekli  
**Rate Limit**: 100 istek/saat  

**Açıklama**: function listMyOrdersController()

**Backend'in Döndüreceği Cevap:**
```typescript
Array<{
  id: string;
  userId: string;
  status: "pending" | "paid" | "failed" | "canceled" | "refunded";
  totalCents: number;
  currency: string;
  cancelReason: string | null;
  createdAt: string;
  orderNumber: string;        // CP-YYYYMMDD-XXXXXXXX formatında
  paymentStatus: string;      // not_paid, pending, paid, failed, refunded
  canPay: boolean;           // status === "pending" ise true
  canCancel: boolean;        // status === "pending" veya "paid" ise true
  items: Array<{
    id: string;
    orderId: string;
    type: string;
    referenceId: string | null;
    quantity: number;
    unitPriceCents: number;
  }>;
  payments: Array<{
    id: string;
    orderId: string;
    provider: string;
    providerPaymentId: string | null;
    status: string;
    amountCents: number;
    receiptUrl: string | null;
    createdAt: string;
  }>;
}>
```

### 4.2. Sipariş Detayı

**Endpoint**: `GET /api/v1/orders/:id`  
**Auth**: Gerekli  
**Rate Limit**: 100 istek/saat  

**Açıklama**: function getOrderController()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  userId: string;
  status: "pending" | "paid" | "failed" | "canceled" | "refunded";
  totalCents: number;
  currency: string;
  cancelReason: string | null;
  createdAt: string;
  orderNumber: string;        // CP-YYYYMMDD-XXXXXXXX formatında
  paymentStatus: string;      // not_paid, pending, paid, failed, refunded
  canPay: boolean;           // status === "pending" ise true
  canCancel: boolean;        // status === "pending" veya "paid" ise true
  items: Array<{
    id: string;
    orderId: string;
    type: string;
    referenceId: string | null;
    quantity: number;
    unitPriceCents: number;
  }>;
  payments: Array<{
    id: string;
    orderId: string;
    provider: string;
    providerPaymentId: string | null;
    status: string;
    amountCents: number;
    receiptUrl: string | null;
    createdAt: string;
  }>;
}
```

### 4.3. Sipariş İptal Etme

**Endpoint**: `POST /api/v1/orders/:id/cancel`  
**Auth**: Gerekli  
**Rate Limit**: 10 istek/saat  

**Açıklama**: function cancelOrderController()

**Frontend'den Gelecek Veriler:**
```typescript
{
  reason?: string;           // Min 3, Max 500 karakter (opsiyonel)
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  userId: string;
  status: "canceled";
  totalCents: number;
  currency: string;
  cancelReason: string | null;
  createdAt: string;
  orderNumber: string;
  paymentStatus: string;
  canPay: boolean;
  canCancel: boolean;
  items: Array<{
    id: string;
    orderId: string;
    type: string;
    referenceId: string | null;
    quantity: number;
    unitPriceCents: number;
  }>;
  payments: Array<{
    id: string;
    orderId: string;
    provider: string;
    providerPaymentId: string | null;
    status: string;
    amountCents: number;
    receiptUrl: string | null;
    createdAt: string;
  }>;
}
```

### 4.4. Sipariş Durumu Güncelleme (Test)

**Endpoint**: `POST /api/v1/orders/:id/status`  
**Auth**: Gerekli (Admin)  
**Rate Limit**: 50 istek/saat  

**Açıklama**: function updateOrderStatusTestController()

**Frontend'den Gelecek Veriler:**
```typescript
{
  status: "pending" | "paid" | "failed" | "canceled" | "refunded";
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  userId: string;
  status: string;
  totalCents: number;
  currency: string;
  cancelReason: string | null;
  createdAt: string;
  orderNumber: string;
  paymentStatus: string;
  canPay: boolean;
  canCancel: boolean;
  items: Array<{
    id: string;
    orderId: string;
    type: string;
    referenceId: string | null;
    quantity: number;
    unitPriceCents: number;
  }>;
  payments: Array<{
    id: string;
    orderId: string;
    provider: string;
    providerPaymentId: string | null;
    status: string;
    amountCents: number;
    receiptUrl: string | null;
    createdAt: string;
  }>;
}
```

---

## 💳 Ödemeler (Payments)

### 5.1. Ödeme Başlatma

**Endpoint**: `POST /api/v1/payments/initiate`  
**Auth**: Gerekli

**Açıklama**: function initiatePayment()

**Frontend'den Gelecek Veriler:**
```typescript
{
  orderId: string;
  paymentMethod: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  paymentId: string;
  redirectUrl: string;
  status: string;
  expiresAt: string;
}
```

### 5.2. Kredi Kartı Ödemesi

**Endpoint**: `POST /api/v1/payments/credit-card`  
**Auth**: Gerekli

**Açıklama**: function processCreditCardPayment()

**Frontend'den Gelecek Veriler:**
```typescript
{
  orderId: string;
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  saveCard?: boolean;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  paymentId: string;
  status: string;
  transactionId: string;
  message: string;
}
```

### 5.3. Ödeme Durumu Sorgulama

**Endpoint**: `GET /api/v1/payments/:paymentId/status`  
**Auth**: Gerekli

**Açıklama**: function getPaymentStatus()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  paymentId: string;
  orderId: string;
  status: string;
  amount: number;
  currency: string;
  method: string;
  transactionId: string;
  paidAt: string;
  cardInfo: CardInfo;
}
```

### 5.4. Ödeme İadesi

**Endpoint**: `POST /api/v1/payments/refund`  
**Auth**: Gerekli

**Açıklama**: function refundPayment()

**Frontend'den Gelecek Veriler:**
```typescript
{
  paymentId: string;
  reason?: string;
  amount?: number;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  refundId: string;
  paymentId: string;
  amount: number;
  status: string;
  estimatedCompletionDate: string;
  message: string;
}
```

---

## 👨‍🎨 Tasarımcılar (Designers)

### 6.1. Tasarımcıları Listeleme

**Endpoint**: `GET /api/v1/designers`  
**Auth**: Gerekli  
**Rate Limit**: 100 istek/saat  

**Açıklama**: function listDesignersController()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  success: true;
  data: Array<{
    id: string;
    name: string | null;
    email: string | null;
    profile: {
      specialization: string | null;
      artistBio: string | null;
      isAvailable: boolean | null;
      behanceUrl: string | null;
      dribbbleUrl: string | null;
      linkedinUrl: string | null;
      websiteUrl: string | null;
      iban: string | null;
    } | null;
  }>;
}
```

### 6.2. Önerilen Tasarımcılar

**Endpoint**: `GET /api/v1/designers/recommended`  
**Auth**: Gerekli  
**Rate Limit**: 100 istek/saat  

**Açıklama**: function recommendedDesignersController()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  success: true;
  data: {
    slate: Array<{
      id: string;
      name: string | null;
      avatarUrl: string | null;
      createdAt: string;
      ratingAvg: number;        // 0-5 arası
      ratingCount: number;      // Toplam yorum sayısı
      recentJobs30d: number;   // Son 30 gündeki iş sayısı
    }>;
    rest: Array<{
      id: string;
      name: string | null;
      avatarUrl: string | null;
      createdAt: string;
      ratingAvg: number;
      ratingCount: number;
      recentJobs30d: number;
    }>;
  };
}
```

### 6.3. Sıralı Tasarımcılar

**Endpoint**: `GET /api/v1/designers/sorted`  
**Auth**: Gerekli  
**Rate Limit**: 100 istek/saat  

**Açıklama**: function listDesignersSortedController()

**Frontend'den Gelecek Veriler:**
```typescript
{
  sort?: "recommended" | "rating" | "newest" | "active30d";  // Default: "recommended"
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  success: true;
  data: {
    designers: Array<{
      id: string;
      name: string | null;
      avatarUrl: string | null;
      createdAt: string;
      ratingAvg: number;        // 0-5 arası
      ratingCount: number;      // Toplam yorum sayısı
      recentJobs30d: number;   // Son 30 gündeki iş sayısı
    }>;
  };
}
```

### 6.4. Tasarımcı Yorumu Oluşturma

**Endpoint**: `POST /api/v1/designers/:id/reviews`  
**Auth**: Gerekli  
**Rate Limit**: 10 istek/saat  

**Açıklama**: function createReviewController()

**Frontend'den Gelecek Veriler:**
```typescript
{
  rating: number;              // 1-5 arası tam sayı
  comment?: string;            // Min 1, Max 1000 karakter (opsiyonel)
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  success: true;
  data: {
    id: string;
    rating: number;
    comment: string | null;
  };
}
```

### 6.5. Tasarımcı Yorumları Listeleme

**Endpoint**: `GET /api/v1/designers/:id/reviews`  
**Auth**: Gerekli  
**Rate Limit**: 100 istek/saat  

**Açıklama**: function listReviewsController()

**Frontend'den Gelecek Veriler:**
```typescript
{
  page?: number;               // Default: 1
  limit?: number;              // Default: 20, Max: 50
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  success: true;
  data: {
    items: Array<{
      id: string;
      designerId: string;
      reviewerId: string;
      rating: number;
      comment: string | null;
      createdAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
  };
}
```

### 6.6. Tasarımcı Genel Profili (Public)

**Endpoint**: `GET /api/v1/designers/public/:id`  
**Auth**: Gerekli değil  
**Rate Limit**: 200 istek/saat  

**Açıklama**: function publicProfileController()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  name: string | null;
  avatarUrl: string | null;
  profile: {
    artistBio: string | null;
    specialization: string | null;
    isAvailable: boolean | null;
    behanceUrl: string | null;
    dribbbleUrl: string | null;
    linkedinUrl: string | null;
    websiteUrl: string | null;
  } | null;
  rating: {
    avg: number;               // Ortalama puan
    count: number;             // Toplam yorum sayısı
  };
}
```

### 6.7. Tasarımcı Arama (Public)

**Endpoint**: `GET /api/v1/designers/public`  
**Auth**: Gerekli değil  
**Rate Limit**: 200 istek/saat  

**Açıklama**: function searchDesignersController()

**Frontend'den Gelecek Veriler:**
```typescript
{
  q?: string;                  // İsim, email veya bio arama
  skill?: string;              // Uzmanlık alanına göre filtreleme
  limit?: number;              // Default: 20, Max: 50
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  items: Array<{
    id: string;
    name: string | null;
    avatarUrl: string | null;
    profile: {
      specialization: string | null;
      artistBio: string | null;
      isAvailable: boolean | null;
      behanceUrl: string | null;
      dribbbleUrl: string | null;
      linkedinUrl: string | null;
      websiteUrl: string | null;
      iban: string | null;
    } | null;
  }>;
}
```

---

## ⭐ Yorumlar (Comments)

### 7.1. Yorumları Listeleme

**Endpoint**: `GET /api/v1/comments`  
**Auth**: Gerekli  
**Rate Limit**: 100 istek/saat  

**Açıklama**: function listCommentsController()

**Frontend'den Gelecek Veriler:**
```typescript
{
  projectId?: string;          // UUID formatında proje ID (opsiyonel)
  layerId?: string;            // UUID formatında katman ID (opsiyonel)
  status?: "open" | "resolved" | "all";  // Default: "all"
  page?: number;               // Default: 1
  limit?: number;              // Default: 20, Max: 100
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  comments: Array<{
    id: string;
    body: string;
    status: "open" | "resolved";
    rating: number | null;     // 1-5 arası yıldız puanı
    createdAt: string;
    author: {
      id: string;
      name: string | null;
      email: string | null;
      avatarUrl: string | null;
    };
    project: {
      id: string;
      title: string | null;
    };
    layer: {
      id: string;
      type: string | null;
    } | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 7.2. Yorum Detayı

**Endpoint**: `GET /api/v1/comments/:id`  
**Auth**: Gerekli  
**Rate Limit**: 100 istek/saat  

**Açıklama**: function getCommentController()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  body: string;
  status: "open" | "resolved";
  rating: number | null;       // 1-5 arası yıldız puanı
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  project: {
    id: string;
    title: string | null;
  };
  layer: {
    id: string;
    type: string | null;
  } | null;
}
```

### 7.3. Yorum Oluşturma

**Endpoint**: `POST /api/v1/comments`  
**Auth**: Gerekli  
**Rate Limit**: 50 istek/saat  

**Açıklama**: function createCommentController()

**Frontend'den Gelecek Veriler:**
```typescript
{
  projectId: string;           // UUID formatında proje ID (zorunlu)
  body: string;                // Min 1, Max 1000 karakter
  targetLayerId?: string;      // UUID formatında katman ID (opsiyonel)
  rating?: number;             // 1-5 arası tam sayı (opsiyonel)
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  body: string;
  status: "open";
  rating: number | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  project: {
    id: string;
    title: string | null;
  };
  layer: {
    id: string;
    type: string | null;
  } | null;
}
```

### 7.4. Yorum Güncelleme

**Endpoint**: `PUT /api/v1/comments/:id`  
**Auth**: Gerekli  
**Rate Limit**: 50 istek/saat  

**Açıklama**: function updateCommentController()

**Frontend'den Gelecek Veriler:**
```typescript
{
  body?: string;               // Min 1, Max 1000 karakter (opsiyonel)
  status?: "open" | "resolved"; // Durum güncelleme (opsiyonel)
  rating?: number;             // 1-5 arası tam sayı (opsiyonel)
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  body: string;
  status: "open" | "resolved";
  rating: number | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  project: {
    id: string;
    title: string | null;
  };
  layer: {
    id: string;
    type: string | null;
  } | null;
}
```

### 7.5. Yorum Silme

**Endpoint**: `DELETE /api/v1/comments/:id`  
**Auth**: Gerekli  
**Rate Limit**: 50 istek/saat  

**Açıklama**: function deleteCommentController()

**Backend'in Döndüreceği Cevap:**
```typescript
// HTTP 204 No Content - Başarılı silme işlemi
```

### 7.6. Proje Yorum İstatistikleri

**Endpoint**: `GET /api/v1/comments/projects/:projectId/stats`  
**Auth**: Gerekli  
**Rate Limit**: 100 istek/saat  

**Açıklama**: function getProjectStatsController()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  total: number;               // Toplam yorum sayısı
  open: number;                // Açık yorum sayısı
  resolved: number;            // Çözümlenmiş yorum sayısı
}
```

---

## 🔔 Bildirimler (Notifications)

### 8.1. Bildirimleri Listeleme

**Endpoint**: `GET /api/v1/notifications`  
**Auth**: Gerekli

**Açıklama**: function listNotifications()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  notifications: Notification[];
  unreadCount: number;
}
```

### 8.2. Bildirimi Okundu Olarak İşaretleme

**Endpoint**: `PUT /api/v1/notifications/:id/read`  
**Auth**: Gerekli

**Açıklama**: function markNotificationAsRead()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
  notificationId: string;
}
```

### 8.3. Tüm Bildirimleri Okundu Olarak İşaretleme

**Endpoint**: `PUT /api/v1/notifications/read-all`  
**Auth**: Gerekli

**Açıklama**: function markAllNotificationsAsRead()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
  markedCount: number;
}
```

### 8.4. Bildirimi Silme

**Endpoint**: `DELETE /api/v1/notifications/:id`  
**Auth**: Gerekli

**Açıklama**: function deleteNotification()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
}
```

---

## 📍 Adresler (Addresses)

### 9.1. Adresleri Listeleme

**Endpoint**: `GET /api/v1/addresses`  
**Auth**: Gerekli  
**Rate Limit**: 100 istek/saat  

**Açıklama**: function listAddressesController()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  addresses: Array<{
    id: string;
    userId: string;
    label: string | null;        // Adres etiketi (örn: "Ev", "İş")
    fullName: string | null;     // Ad soyad
    phone: string | null;        // Telefon numarası
    line1: string;               // Ana adres
    line2: string | null;        // Ek adres bilgisi
    city: string;                // Şehir (81 Türk şehrinden biri)
    district: string | null;     // İlçe
    postalCode: string | null;   // Posta kodu (5 haneli)
    country: string;             // Ülke kodu (default: "TR")
    isDefault: boolean;          // Varsayılan adres mi?
    createdAt: string;
    updatedAt: string;
  }>;
}
```

### 9.2. Varsayılan Adres

**Endpoint**: `GET /api/v1/addresses/default`  
**Auth**: Gerekli  
**Rate Limit**: 100 istek/saat  

**Açıklama**: function getDefaultAddressController()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  userId: string;
  label: string | null;
  fullName: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  district: string | null;
  postalCode: string | null;
  country: string;
  isDefault: true;
  createdAt: string;
  updatedAt: string;
}
```

### 9.3. Adres Detayı

**Endpoint**: `GET /api/v1/addresses/:id`  
**Auth**: Gerekli  
**Rate Limit**: 100 istek/saat  

**Açıklama**: function getAddressController()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  userId: string;
  label: string | null;
  fullName: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  district: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 9.4. Yeni Adres Oluşturma

**Endpoint**: `POST /api/v1/addresses`  
**Auth**: Gerekli  
**Rate Limit**: 20 istek/saat  

**Açıklama**: function createAddressController()

**Frontend'den Gelecek Veriler:**
```typescript
{
  label?: string;                // Min 2, Max 60 karakter (opsiyonel)
  fullName: string;              // Min 3, Max 120 karakter, sadece harf
  phone: string;                 // Min 10, Max 20 karakter, telefon formatı
  line1: string;                 // Min 10, Max 200 karakter
  line2?: string;                // Max 200 karakter (opsiyonel)
  city: string;                  // 81 Türk şehrinden biri
  district?: string;             // Min 2, Max 50 karakter (opsiyonel)
  postalCode?: string;           // 5 haneli posta kodu (opsiyonel)
  country?: string;              // Default: "TR"
  isDefault?: boolean;           // Default: false
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  userId: string;
  label: string | null;
  fullName: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  district: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 9.5. Adres Güncelleme

**Endpoint**: `PUT /api/v1/addresses/:id`  
**Auth**: Gerekli  
**Rate Limit**: 20 istek/saat  

**Açıklama**: function updateAddressController()

**Frontend'den Gelecek Veriler:**
```typescript
{
  label?: string;                // Min 2, Max 60 karakter (opsiyonel)
  fullName?: string;             // Min 3, Max 120 karakter, sadece harf (opsiyonel)
  phone?: string;                // Min 10, Max 20 karakter, telefon formatı (opsiyonel)
  line1?: string;                // Min 10, Max 200 karakter (opsiyonel)
  line2?: string;                // Max 200 karakter (opsiyonel)
  city?: string;                 // 81 Türk şehrinden biri (opsiyonel)
  district?: string;             // Min 2, Max 50 karakter (opsiyonel)
  postalCode?: string;           // 5 haneli posta kodu (opsiyonel)
  country?: string;              // Ülke kodu (opsiyonel)
  isDefault?: boolean;           // Varsayılan adres yapma (opsiyonel)
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  userId: string;
  label: string | null;
  fullName: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  district: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 9.6. Varsayılan Adres Ayarlama

**Endpoint**: `POST /api/v1/addresses/:id/default`  
**Auth**: Gerekli  
**Rate Limit**: 20 istek/saat  

**Açıklama**: function setDefaultAddressController()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  userId: string;
  label: string | null;
  fullName: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  district: string | null;
  postalCode: string | null;
  country: string;
  isDefault: true;
  createdAt: string;
  updatedAt: string;
}
```

### 9.7. Adres Silme

**Endpoint**: `DELETE /api/v1/addresses/:id`  
**Auth**: Gerekli  
**Rate Limit**: 20 istek/saat  

**Açıklama**: function deleteAddressController()

**Backend'in Döndüreceği Cevap:**
```typescript
// HTTP 204 No Content - Başarılı silme işlemi
```

---

## 📄 Şablonlar (Templates)

### 10.1. Şablonları Listeleme

**Endpoint**: `GET /api/v1/templates`  
**Auth**: Gerekli değil

**Açıklama**: function listTemplates()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  templates: Template[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 10.2. Popüler Şablonlar

**Endpoint**: `GET /api/v1/templates/popular`  
**Auth**: Gerekli değil

**Açıklama**: function getPopularTemplates()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  templates: Template[];
}
```

### 10.3. Slug ile Şablon Getirme

**Endpoint**: `GET /api/v1/templates/slug/:slug`  
**Auth**: Gerekli değil

**Açıklama**: function getTemplateBySlug()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  name: string;
  slug: string;
  description: string;
  previewImages: string[];
  features: string[];
  customizableElements: string[];
  dimensions: {
    width: number;
    height: number;
  };
  fileFormats: string[];
  category: Category;
  tags: string[];
  isPremium: boolean;
  price: number;
  designer: Designer;
  usageCount: number;
  rating: number;
}
```

### 10.4. ID ile Şablon Getirme

**Endpoint**: `GET /api/v1/templates/:id`  
**Auth**: Gerekli değil

**Açıklama**: function getTemplateById()

**Backend'in Döndüreceği Cevap:** (Slug ile aynı yapı)

### 10.5. Şablon Oluşturma

**Endpoint**: `POST /api/v1/templates`  
**Auth**: Gerekli

**Açıklama**: function createTemplate()

**Frontend'den Gelecek Veriler:**
```typescript
{
  name: string;
  description: string;
  categoryId: string;
  previewImage: string;
  tags?: string[];
  isPremium?: boolean;
  price?: number;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  name: string;
  slug: string;
  category: Category;
  isPremium: boolean;
  price: number;
  createdAt: string;
}
```

---

## 📂 Kategoriler (Categories)

### 11.1. Kategorileri Listeleme

**Endpoint**: `GET /api/v1/categories`  
**Auth**: Gerekli değil

**Açıklama**: function listCategories()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  categories: Category[];
}
```

### 11.2. Kategori Detayı

**Endpoint**: `GET /api/v1/categories/:id`  
**Auth**: Gerekli değil

**Açıklama**: function getCategoryById()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  coverImage: string;
  templateCount: number;
  designerCount: number;
  popularTemplates: Template[];
  topDesigners: Designer[];
  relatedCategories: Category[];
}
```

---

## 🔍 Arama (Search)

### 12.1. Genel Arama

**Endpoint**: `GET /api/v1/search`  
**Auth**: Gerekli değil

**Açıklama**: function globalSearch()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  query: string;
  results: {
    templates: Template[];
    designers: Designer[];
    projects: Project[];
  };
  totalResults: number;
  searchTime: number;
}
```

### 12.2. Arama Önerileri

**Endpoint**: `GET /api/v1/search/suggestions`  
**Auth**: Gerekli değil

**Açıklama**: function getSearchSuggestions()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  suggestions: string[];
}
```

---

## 🎨 AI Üretimi (AI Generation)

### 13.1. AI Görsel Üretimi

**Endpoint**: `POST /api/v1/ai/drafts/:id/ai/generate`  
**Auth**: Gerekli

**Açıklama**: function generateAIImage()

**Frontend'den Gelecek Veriler:**
```typescript
{
  prompt: string;
  coverType?: string;
  style?: string;
  aspectRatio?: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  jobId: string;
  status: string;
  message: string;
  estimatedTime: number;
  creditsUsed: number;
}
```

### 13.2. AI Sonuçları

**Endpoint**: `GET /api/v1/ai/drafts/:id/ai/results`  
**Auth**: Gerekli

**Açıklama**: function getAIResults()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  status: string;
  results: AIResult[];
  selectedResultId: string | null;
  totalResults: number;
}
```

### 13.3. AI Sonucu Seçme

**Endpoint**: `POST /api/v1/ai/drafts/:id/ai/select`  
**Auth**: Gerekli

**Açıklama**: function selectAIResult()

**Frontend'den Gelecek Veriler:**
```typescript
{
  resultId: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
  selectedResult: AIResult;
}
```

---

## ❤️ Beğeniler (Likes)

### 14.1. Beğeni Toggle

**Endpoint**: `POST /api/v1/likes/toggle`  
**Auth**: Gerekli değil

**Açıklama**: function toggleLike()

**Frontend'den Gelecek Veriler:**
```typescript
{
  messageCardId: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  liked: boolean;
  totalLikes: number;
  message: string;
}
```

### 14.2. Beğeni Özeti

**Endpoint**: `GET /api/v1/likes/cards/:id/summary`  
**Auth**: Gerekli değil

**Açıklama**: function getLikeSummary()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  totalLikes: number;
  userLiked: boolean;
}
```

---

## 💬 Mesaj Kartları (Message Cards)

### 15.1. Popüler Mesaj Kartları

**Endpoint**: `GET /api/v1/message-cards/popular`  
**Auth**: Gerekli değil

**Açıklama**: function getPopularMessageCards()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  messageCards: MessageCard[];
}
```

### 15.2. Mesaj Kartı Detayı

**Endpoint**: `GET /api/v1/message-cards/:id`  
**Auth**: Gerekli değil

**Açıklama**: function getMessageCardById()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  text: string;
  cardType: string;
  category: string;
  likes: number;
  createdAt: string;
}
```

---

## 📁 Dosya İşlemleri (Files)

### 16.1. Dosya Yükleme

**Endpoint**: `POST /api/v1/files/upload`  
**Auth**: Gerekli

**Açıklama**: function uploadFile()

**Frontend'den Gelecek Veriler:** FormData with file

**Backend'in Döndüreceği Cevap:**
```typescript
{
  fileUrl: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}
```

### 16.2. Dosya Silme

**Endpoint**: `DELETE /api/v1/files/:id`  
**Auth**: Gerekli

**Açıklama**: function deleteFile()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
  deletedId: string;
}
```

---

## 💰 Cüzdan (Wallet)

### 17.1. Cüzdan Bakiyesi

**Endpoint**: `GET /api/v1/wallet/balance`  
**Auth**: Gerekli

**Açıklama**: function getWalletBalance()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  balance: number;
  currency: string;
  lastUpdated: string;
}
```

### 17.2. İşlem Geçmişi

**Endpoint**: `GET /api/v1/wallet/transactions`  
**Auth**: Gerekli

**Açıklama**: function getWalletTransactions()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## 📊 Projeler (Projects)

### 18.1. Projeleri Listeleme

**Endpoint**: `GET /api/v1/projects`  
**Auth**: Gerekli

**Açıklama**: function listProjects()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  projects: Project[];
}
```

### 18.2. Proje Detayı

**Endpoint**: `GET /api/v1/projects/:id`  
**Auth**: Gerekli

**Açıklama**: function getProjectById()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: ProjectMember[];
  createdAt: string;
}
```

---

## 🏢 Organizasyonlar (Organizations)

### 19.1. Organizasyonları Listeleme

**Endpoint**: `GET /api/v1/organizations`  
**Auth**: Gerekli

**Açıklama**: function listOrganizations()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  organizations: Organization[];
}
```

### 19.2. Organizasyon Detayı

**Endpoint**: `GET /api/v1/organizations/:id`  
**Auth**: Gerekli

**Açıklama**: function getOrganizationById()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  members: OrganizationMember[];
  createdAt: string;
}
```

---

## 📄 İadeler (Returns)

### 20.1. İade Taleplerini Listeleme

**Endpoint**: `GET /api/v1/returns`  
**Auth**: Gerekli

**Açıklama**: function listReturns()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  returns: ReturnRequest[];
}
```

### 20.2. İade Talebi Oluşturma

**Endpoint**: `POST /api/v1/returns`  
**Auth**: Gerekli

**Açıklama**: function createReturn()

**Frontend'den Gelecek Veriler:**
```typescript
{
  orderId: string;
  reason: string;
  images?: string[];
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  id: string;
  orderId: string;
  status: string;
  reason: string;
  requestedAt: string;
  estimatedProcessTime: string;
}
```

---

## 📧 İletişim (Contact)

### 21.1. İletişim Formu

**Endpoint**: `POST /api/v1/contact`  
**Auth**: Gerekli değil

**Açıklama**: function submitContactForm()

**Frontend'den Gelecek Veriler:**
```typescript
{
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
}
```

**Backend'in Döndüreceği Cevap:**
```typescript
{
  message: string;
  submissionId: string;
  estimatedResponseTime: string;
}
```

---

## 🔎 Varlıklar (Assets)

### 22.1. Varlıkları Listeleme

**Endpoint**: `GET /api/v1/assets`  
**Auth**: Gerekli

**Açıklama**: function listAssets()

**Backend'in Döndüreceği Cevap:**
```typescript
{
  assets: Asset[];
}
```

---

## 📚 En İyi Uygulamalar

### 1. Kimlik Doğrulama
- Access Token'ı `Authorization: Bearer <token>` header'ında gönderin
- Token süresi dolduğunda Refresh Token ile yenileyin
- Güvenlik için token'ları localStorage yerine httpOnly cookie'de saklayın

### 2. Hata Yönetimi
- Tüm API yanıtlarını kontrol edin
- HTTP status kodlarını kontrol edin
- Hata mesajlarını kullanıcıya uygun şekilde gösterin

### 3. Rate Limiting
- API rate limit'lerini takip edin
- Gerekirse exponential backoff uygulayın
- Çok fazla istek göndermekten kaçının

### 4. Pagination
- Büyük listeler için pagination kullanın
- `page` ve `limit` parametrelerini kullanın
- Toplam sayfa sayısını kontrol edin

### 5. File Upload
- Dosya boyutunu kontrol edin
- Desteklenen formatları kontrol edin
- Presigned URL kullanarak güvenli yükleme yapın

### 6. Caching
- Statik veriler için cache kullanın
- ETag header'larını kontrol edin
- Cache invalidation stratejisi uygulayın

### 7. Security
- HTTPS kullanın
- CSRF token'larını gönderin
- Sensitive data'yı loglamayın
- Input validation yapın

---

**Tarih**: Ocak 2025  
**Version**: 2.0  
**Son Güncelleme**: Fonksiyon isimleri ve terminoloji güncellendi
# Frontend API Kılavuzu - Bölüm 2

> Bu dosya "FRONTEND_DEVELOPER_API_GUIDE.md" dosyasının devamıdır.

---

## 🛍️ Siparişler (Orders)

Siparişler, onaylanmış taslakların commit edilmesi ile oluşur ve ödeme sürecini başlatır.

### Sipariş Durumları (Order Status)
- `pending_payment`: Ödeme bekleniyor
- `paid`: Ödeme tamamlandı
- `in_production`: Üretimde
- `shipped`: Kargoya verildi
- `delivered`: Teslim edildi
- `completed`: Tamamlandı
- `cancelled`: İptal edildi
- `refunded`: İade edildi

---

### 5.1. Siparişlerimi Listele (List My Orders)

**Endpoint**: `GET /api/v1/orders`  
**Auth**: Gerekli ✅

**Açıklama**: Kullanıcının tüm siparişlerini listeler.

**Query Parameters**:
```typescript
{
  status?: string;      // "pending_payment", "paid", "shipped", vb.
  page?: number;        // Default: 1
  limit?: number;       // Default: 10
  sortBy?: string;      // "createdAt", "totalAmount"
  sortOrder?: string;   // "asc", "desc"
}
```

**Request Örneği**:
```http
GET /api/v1/orders?status=paid&page=1&limit=10&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "orders": [
    {
      "id": "order-uuid-1",
      "userId": "user-uuid",
      "draftId": "draft-uuid",
      "status": "shipped",
      "totalAmount": 299.99,
      "currency": "TRY",
      "items": [
        {
          "id": "item-uuid",
          "type": "cover_design",
          "description": "Kitap kapağı tasarımı - Fantasy",
          "quantity": 1,
          "unitPrice": 299.99,
          "totalPrice": 299.99
        }
      ],
      "shippingAddress": {
        "firstName": "Ahmet",
        "lastName": "Yılmaz",
        "city": "İstanbul",
        "address": "Örnek Mahallesi, No: 123"
      },
      "paymentStatus": "completed",
      "trackingNumber": "TR123456789",
      "createdAt": "2025-01-22T10:00:00.000Z",
      "updatedAt": "2025-01-23T15:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Frontend Kullanımı**:
```javascript
async function getMyOrders(filters = {}) {
  const accessToken = localStorage.getItem('access_token');
  
  // Query string oluştur
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  const response = await fetch(`https://api.polikrami.com/api/v1/orders?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Siparişler getirilemedi');
  }
  
  return await response.json();
}

// React örneği
function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await getMyOrders({ status: 'all', page: 1, limit: 10 });
        setOrders(data.orders);
      } catch (error) {
        console.error('Hata:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrders();
  }, []);
  
  if (loading) return <div>Yükleniyor...</div>;
  
  return (
    <div>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

---

### 5.2. Sipariş Detayı (Get Order)

**Endpoint**: `GET /api/v1/orders/:id`  
**Auth**: Gerekli ✅ (Sadece sahip)

**Açıklama**: Belirli bir siparişin tüm detaylarını getirir.

**Response** (200 OK):
```json
{
  "id": "order-uuid-1",
  "userId": "user-uuid",
  "draftId": "draft-uuid",
  "status": "shipped",
  "totalAmount": 299.99,
  "currency": "TRY",
  "items": [
    {
      "id": "item-uuid-1",
      "type": "cover_design",
      "description": "Kitap kapağı tasarımı - Fantasy",
      "quantity": 1,
      "unitPrice": 299.99,
      "totalPrice": 299.99
    },
    {
      "id": "item-uuid-2",
      "type": "printing",
      "description": "Baskı - 100 adet",
      "quantity": 100,
      "unitPrice": 2.50,
      "totalPrice": 250.00
    }
  ],
  "subtotal": 549.99,
  "tax": 98.99,
  "shippingCost": 50.00,
  "totalAmount": 698.98,
  "currency": "TRY",
  "shippingAddress": {
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "phone": "+905551234567",
    "address": "Örnek Mahallesi, Cadde No: 123, Daire: 5",
    "city": "İstanbul",
    "state": "İstanbul",
    "country": "Turkey",
    "postalCode": "34000"
  },
  "billingAddress": {
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "address": "Örnek Mahallesi, Cadde No: 123",
    "city": "İstanbul",
    "postalCode": "34000"
  },
  "payments": [
    {
      "id": "payment-uuid",
      "method": "credit_card",
      "amount": 698.98,
      "status": "completed",
      "transactionId": "txn_123456",
      "paidAt": "2025-01-22T18:30:00.000Z"
    }
  ],
  "shipments": [
    {
      "id": "shipment-uuid",
      "carrier": "Aras Kargo",
      "trackingNumber": "TR123456789",
      "status": "in_transit",
      "shippedAt": "2025-01-23T10:00:00.000Z",
      "estimatedDelivery": "2025-01-25T23:59:59.000Z"
    }
  ],
  "draft": {
    "id": "draft-uuid",
    "method": "designer",
    "category": "Fantasy"
  },
  "timeline": [
    {
      "status": "pending_payment",
      "timestamp": "2025-01-22T18:00:00.000Z"
    },
    {
      "status": "paid",
      "timestamp": "2025-01-22T18:30:00.000Z"
    },
    {
      "status": "in_production",
      "timestamp": "2025-01-22T20:00:00.000Z"
    },
    {
      "status": "shipped",
      "timestamp": "2025-01-23T10:00:00.000Z"
    }
  ],
  "createdAt": "2025-01-22T18:00:00.000Z",
  "updatedAt": "2025-01-23T10:00:00.000Z"
}
```

---

### 5.3. Sipariş İptal Et (Cancel Order)

**Endpoint**: `POST /api/v1/orders/:id/cancel`  
**Auth**: Gerekli ✅ (Sadece sahip)

**Açıklama**: Henüz üretim/kargo aşamasına geçmemiş siparişi iptal eder.

**Request Body**:
```typescript
{
  reason?: string;  // İptal nedeni (opsiyonel)
}
```

**Request Örneği**:
```json
{
  "reason": "Yanlış adres girmiştim, yeni sipariş vereceğim"
}
```

**Response** (200 OK):
```json
{
  "message": "Sipariş iptal edildi",
  "status": "cancelled",
  "refundStatus": "processing",
  "refundAmount": 698.98,
  "estimatedRefundDate": "2025-01-30T00:00:00.000Z"
}
```

**Hata Durumları**:
- `400 Bad Request`: Sipariş zaten kargoya verilmiş, iptal edilemez
- `409 Conflict`: Sipariş üretimdeyse iptal edilemez

**Frontend Kullanımı**:
```javascript
async function cancelOrder(orderId, reason) {
  const accessToken = localStorage.getItem('access_token');
  const csrfToken = localStorage.getItem('csrf_token');
  
  // Kullanıcıdan onay al
  if (!confirm('Siparişi iptal etmek istediğinizden emin misiniz?')) {
    return null;
  }
  
  const response = await fetch(`https://api.polikrami.com/api/v1/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-CSRF-Token': csrfToken
    },
    credentials: 'include',
    body: JSON.stringify({ reason })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }
  
  return await response.json();
}
```

---

### 5.4. Sipariş Durumu Güncelle (Test/Admin)

**Endpoint**: `POST /api/v1/orders/:id/status`  
**Auth**: Gerekli ✅ (Admin veya test ortamında)

**Açıklama**: Sipariş durumunu manuel olarak günceller (test/admin amaçlı).

**Request Body**:
```typescript
{
  status: "pending_payment" | "paid" | "in_production" | "shipped" | "delivered" | "completed" | "cancelled";
}
```

---

## 💳 Ödemeler (Payments)

### Ödeme Akışı

```
1. Sipariş oluşturulur (commit draft)
   ↓
2. Ödeme başlatılır (initiate payment)
   ↓
3. Kullanıcı ödeme sayfasına yönlendirilir
   ↓
4. Ödeme tamamlanır (callback)
   ↓
5. Sipariş durumu güncellenir (paid)
```

---

### 6.1. Ödeme Başlat (Initiate Payment)

**Endpoint**: `POST /api/v1/payments/initiate`  
**Auth**: Gerekli ✅

**Açıklama**: Sipariş için ödeme işlemini başlatır ve ödeme gateway'ine yönlendirir.

**Request Body**:
```typescript
{
  orderId: string;
  paymentMethod: "credit_card" | "bank_transfer" | "wallet";
}
```

**Request Örneği**:
```json
{
  "orderId": "order-uuid-123",
  "paymentMethod": "credit_card"
}
```

**Response** (200 OK):
```json
{
  "paymentId": "payment-uuid-456",
  "redirectUrl": "https://payment-gateway.com/pay?token=abc123",
  "status": "pending",
  "amount": 698.98,
  "currency": "TRY",
  "expiresAt": "2025-01-22T19:00:00.000Z"
}
```

**Frontend Kullanımı**:
```javascript
async function initiatePayment(orderId, paymentMethod) {
  const accessToken = localStorage.getItem('access_token');
  const csrfToken = localStorage.getItem('csrf_token');
  
  const response = await fetch('https://api.polikrami.com/api/v1/payments/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-CSRF-Token': csrfToken
    },
    credentials: 'include',
    body: JSON.stringify({ orderId, paymentMethod })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }
  
  const { redirectUrl, paymentId } = await response.json();
  
  // Ödeme sayfasına yönlendir
  window.location.href = redirectUrl;
  
  return paymentId;
}

// Kullanım
async function handleCheckout(orderId) {
  try {
    await initiatePayment(orderId, 'credit_card');
    // Kullanıcı ödeme gateway'ine yönlendirildi
  } catch (error) {
    alert('Ödeme başlatılamadı: ' + error.message);
  }
}
```

---

### 6.2. Kredi Kartı ile Ödeme

**Endpoint**: `POST /api/v1/payments/credit-card`  
**Auth**: Gerekli ✅

**Açıklama**: Kredi kartı bilgileri ile direkt ödeme yapar.

**Request Body**:
```typescript
{
  orderId: string;
  cardNumber: string;       // "4111111111111111"
  cardHolderName: string;   // "AHMET YILMAZ"
  expiryMonth: string;      // "12"
  expiryYear: string;       // "2025"
  cvv: string;              // "123"
  saveCard?: boolean;       // Kartı kaydet (opsiyonel)
}
```

**Request Örneği**:
```json
{
  "orderId": "order-uuid-123",
  "cardNumber": "4111111111111111",
  "cardHolderName": "AHMET YILMAZ",
  "expiryMonth": "12",
  "expiryYear": "2025",
  "cvv": "123",
  "saveCard": false
}
```

**Response** (200 OK):
```json
{
  "paymentId": "payment-uuid",
  "status": "completed",
  "transactionId": "txn_123456",
  "message": "Ödeme başarılı"
}
```

**Hata Durumları**:
- `400 Bad Request`: Kart bilgileri geçersiz
- `402 Payment Required`: Yetersiz bakiye
- `403 Forbidden`: Kart sahibi doğrulaması başarısız (3D Secure)

**Güvenlik Notları**:
- ⚠️ **Asla** kart bilgilerini localStorage veya sessionStorage'da saklamayın
- ⚠️ Kart bilgilerini loglamamalısınız
- ✅ HTTPS üzerinden gönderin
- ✅ PCI-DSS uyumlu olmalısınız

---

### 6.3. Ödeme Durumu Sorgula (Get Payment Status)

**Endpoint**: `GET /api/v1/payments/:paymentId/status`  
**Auth**: Gerekli ✅

**Açıklama**: Ödeme durumunu sorgular (callback sonrası kontrol için).

**Response** (200 OK):
```json
{
  "paymentId": "payment-uuid",
  "orderId": "order-uuid",
  "status": "completed",
  "amount": 698.98,
  "currency": "TRY",
  "method": "credit_card",
  "transactionId": "txn_123456",
  "paidAt": "2025-01-22T18:30:00.000Z",
  "cardInfo": {
    "last4": "1111",
    "brand": "Visa"
  }
}
```

**Ödeme Durumları**:
- `pending`: Ödeme bekliyor
- `processing`: İşleniyor
- `completed`: Tamamlandı
- `failed`: Başarısız
- `cancelled`: İptal edildi
- `refunded`: İade edildi

**Frontend Polling Örneği**:
```javascript
async function waitForPaymentCompletion(paymentId, maxAttempts = 60) {
  const accessToken = localStorage.getItem('access_token');
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle
    
    const response = await fetch(
      `https://api.polikrami.com/api/v1/payments/${paymentId}/status`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    
    if (!response.ok) {
      throw new Error('Ödeme durumu sorgulanamadı');
    }
    
    const { status } = await response.json();
    
    if (status === 'completed') {
      return { success: true, status };
    } else if (status === 'failed' || status === 'cancelled') {
      return { success: false, status };
    }
  }
  
  throw new Error('Ödeme zaman aşımına uğradı');
}

// Callback sayfasında kullanım
async function handlePaymentCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentId = urlParams.get('paymentId');
  
  if (!paymentId) {
    window.location.href = '/orders';
    return;
  }
  
  try {
    const result = await waitForPaymentCompletion(paymentId);
    
    if (result.success) {
      showSuccessMessage('Ödeme başarılı! Siparişiniz alındı.');
      setTimeout(() => {
        window.location.href = '/orders';
      }, 3000);
    } else {
      showErrorMessage('Ödeme başarısız oldu.');
      window.location.href = '/payment-failed';
    }
  } catch (error) {
    console.error('Ödeme kontrolü hatası:', error);
    window.location.href = '/payment-error';
  }
}
```

---

### 6.4. İade Talebi (Refund Payment)

**Endpoint**: `POST /api/v1/payments/refund`  
**Auth**: Gerekli ✅

**Açıklama**: Ödeme iadesi talep eder.

**Request Body**:
```typescript
{
  paymentId: string;
  reason?: string;      // İade nedeni
  amount?: number;      // Kısmi iade için (opsiyonel)
}
```

**Request Örneği**:
```json
{
  "paymentId": "payment-uuid-123",
  "reason": "Sipariş iptal edildi",
  "amount": 698.98
}
```

**Response** (200 OK):
```json
{
  "refundId": "refund-uuid",
  "paymentId": "payment-uuid",
  "amount": 698.98,
  "status": "processing",
  "estimatedCompletionDate": "2025-01-30T00:00:00.000Z",
  "message": "İade işlemi başlatıldı"
}
```

---

### 6.5. Ödeme Callback (Webhook)

**Endpoint**: `POST /api/v1/payments/callback`  
**Auth**: Gerekli değil (signature doğrulaması yapılır)

**Açıklama**: Ödeme sağlayıcısından gelen webhook'u işler (frontend'den çağrılmaz, sadece bilgi amaçlı).

---

### 6.6. Mock Ödeme Başarılı (Development)

**Endpoint**: `GET /api/v1/payments/mock/success`  
**Auth**: Gerekli değil  
**Ortam**: Sadece development

**Açıklama**: Test amaçlı başarılı ödeme simülasyonu.

---

### 6.7. Mock Ödeme Başarısız (Development)

**Endpoint**: `GET /api/v1/payments/mock/failure`  
**Auth**: Gerekli değil  
**Ortam**: Sadece development

**Açıklama**: Test amaçlı başarısız ödeme simülasyonu.

---

## 👨‍🎨 Tasarımcılar (Designers)

### 7.1. Tasarımcıları Listele

**Endpoint**: `GET /api/v1/designers`  
**Auth**: Gerekli ✅

**Açıklama**: Tüm aktif tasarımcıları listeler.

**Query Parameters**:
```typescript
{
  search?: string;      // İsim/bio araması
  category?: string;    // Kategori filtresi
  minRating?: number;   // Minimum rating (0-5)
  maxRating?: number;   // Maksimum rating (0-5)
  page?: number;
  limit?: number;
  sortBy?: string;      // "rating", "completedOrders", "name"
  sortOrder?: string;   // "asc", "desc"
}
```

**Request Örneği**:
```http
GET /api/v1/designers?category=fantasy&minRating=4.5&sortBy=rating&sortOrder=desc
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "designers": [
    {
      "id": "designer-uuid-1",
      "name": "Ayşe Demir",
      "bio": "10 yıllık deneyimli grafik tasarımcı",
      "rating": 4.9,
      "totalReviews": 234,
      "completedOrders": 189,
      "specialties": ["Fantasy", "Science Fiction", "Mystery"],
      "avatar": "https://api.polikrami.com/uploads/designers/ayse.jpg",
      "priceRange": {
        "min": 200,
        "max": 500
      },
      "responseTime": "24 saat",
      "languages": ["Türkçe", "English"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 45,
    "totalPages": 4
  }
}
```

**Frontend Kullanımı**:
```javascript
async function searchDesigners(filters = {}) {
  const accessToken = localStorage.getItem('access_token');
  
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, value.toString());
    }
  });
  
  const response = await fetch(
    `https://api.polikrami.com/api/v1/designers?${params.toString()}`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  );
  
  if (!response.ok) throw new Error('Tasarımcılar getirilemedi');
  
  return await response.json();
}

// React örneği
function DesignerGrid() {
  const [designers, setDesigners] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    minRating: 4.0,
    sortBy: 'rating'
  });
  
  useEffect(() => {
    async function loadDesigners() {
      const data = await searchDesigners(filters);
      setDesigners(data.designers);
    }
    loadDesigners();
  }, [filters]);
  
  return (
    <div className="designer-grid">
      <FilterBar filters={filters} onChange={setFilters} />
      <div className="grid">
        {designers.map(designer => (
          <DesignerCard key={designer.id} designer={designer} />
        ))}
      </div>
    </div>
  );
}
```

---

### 7.2. Önerilen Tasarımcılar

**Endpoint**: `GET /api/v1/designers/recommended`  
**Auth**: Gerekli ✅

**Açıklama**: Kullanıcının tercihlerine göre önerilen tasarımcıları getirir.

**Response** (200 OK):
```json
{
  "designers": [
    {
      "id": "designer-uuid",
      "name": "Mehmet Kaya",
      "rating": 4.8,
      "completedOrders": 156,
      "specialties": ["Romance", "Drama"],
      "matchScore": 0.92,
      "matchReason": "Daha önce Romance kategorisinde sipariş verdiniz"
    }
  ]
}
```

---

### 7.3. Tasarımcı Sıralamalı Liste

**Endpoint**: `GET /api/v1/designers/sorted`  
**Auth**: Gerekli ✅

**Açıklama**: En çok tercih edilen/başarılı tasarımcılar.

**Query Parameters**:
```typescript
{
  sortType?: "top_rated" | "most_orders" | "fastest" | "newest";
  limit?: number;  // Default: 10
}
```

**Response** (200 OK):
```json
{
  "designers": [
    {
      "id": "designer-uuid",
      "name": "Zeynep Arslan",
      "rating": 5.0,
      "completedOrders": 312,
      "badge": "Top Designer",
      "avatar": "https://api.polikrami.com/uploads/designers/zeynep.jpg"
    }
  ],
  "sortType": "top_rated"
}
```

---

### 7.4. Tasarımcı Profili (Public)

**Endpoint**: `GET /api/v1/designers/public/:id`  
**Auth**: Gerekli değil

**Açıklama**: Tasarımcının genel profil bilgilerini getirir (herkese açık).

**Response** (200 OK):
```json
{
  "id": "designer-uuid",
  "name": "Ayşe Demir",
  "bio": "10 yıllık deneyimli grafik tasarımcı. Fantasy ve sci-fi konularında uzmanım.",
  "avatar": "https://api.polikrami.com/uploads/designers/ayse.jpg",
  "coverImage": "https://api.polikrami.com/uploads/designers/ayse-cover.jpg",
  "rating": 4.9,
  "totalReviews": 234,
  "completedOrders": 189,
  "memberSince": "2020-05-15",
  "specialties": ["Fantasy", "Science Fiction", "Mystery"],
  "skills": ["Illustration", "Typography", "Digital Painting"],
  "languages": ["Türkçe", "English"],
  "responseTime": "24 saat içinde",
  "priceRange": {
    "min": 200,
    "max": 500,
    "currency": "TRY"
  },
  "portfolio": [
    {
      "id": "portfolio-1",
      "title": "Mystical Forest Cover",
      "imageUrl": "https://api.polikrami.com/uploads/portfolio/img1.jpg",
      "category": "Fantasy",
      "year": 2024
    },
    {
      "id": "portfolio-2",
      "title": "Sci-Fi Spaceship",
      "imageUrl": "https://api.polikrami.com/uploads/portfolio/img2.jpg",
      "category": "Science Fiction",
      "year": 2024
    }
  ],
  "achievements": [
    {
      "title": "Top Designer 2024",
      "icon": "🏆"
    },
    {
      "title": "100+ Completed Orders",
      "icon": "⭐"
    }
  ],
  "statistics": {
    "avgResponseTime": "12 hours",
    "deliveryOnTime": "98%",
    "revisionRate": "1.2 per project"
  }
}
```

**Frontend Kullanımı**:
```javascript
async function getDesignerProfile(designerId) {
  // Public endpoint, auth gerekmez
  const response = await fetch(
    `https://api.polikrami.com/api/v1/designers/public/${designerId}`
  );
  
  if (!response.ok) {
    throw new Error('Tasarımcı profili bulunamadı');
  }
  
  return await response.json();
}

// React Designer Profile Component
function DesignerProfile({ designerId }) {
  const [designer, setDesigner] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getDesignerProfile(designerId);
        setDesigner(data);
      } catch (error) {
        console.error('Profil yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [designerId]);
  
  if (loading) return <div>Yükleniyor...</div>;
  if (!designer) return <div>Tasarımcı bulunamadı</div>;
  
  return (
    <div className="designer-profile">
      <div className="profile-header">
        <img src={designer.avatar} alt={designer.name} />
        <h1>{designer.name}</h1>
        <div className="rating">
          <span>⭐ {designer.rating}</span>
          <span>({designer.totalReviews} değerlendirme)</span>
        </div>
      </div>
      
      <div className="bio">
        <p>{designer.bio}</p>
      </div>
      
      <div className="portfolio">
        <h2>Portfolio</h2>
        <div className="portfolio-grid">
          {designer.portfolio.map(item => (
            <PortfolioItem key={item.id} item={item} />
          ))}
        </div>
      </div>
      
      <div className="reviews">
        <h2>Değerlendirmeler</h2>
        <ReviewList designerId={designerId} />
      </div>
    </div>
  );
}
```

---

### 7.5. Tasarımcı Ara (Public Search)

**Endpoint**: `GET /api/v1/designers/public`  
**Auth**: Gerekli değil

**Açıklama**: Herkese açık tasarımcı araması.

**Query Parameters**:
```typescript
{
  q?: string;           // Arama kelimesi
  category?: string;    // Kategori
  city?: string;        // Şehir
  minRating?: number;
  page?: number;
  limit?: number;
}
```

---

### 7.6. Tasarımcıya Değerlendirme Yap

**Endpoint**: `POST /api/v1/designers/:id/reviews`  
**Auth**: Gerekli ✅

**Açıklama**: Tamamlanmış sipariş sonrası tasarımcıya değerlendirme yapar.

**Request Body**:
```typescript
{
  rating: number;      // 1-5 arası
  comment: string;     // Min 10, Max 1000 karakter
  orderId?: string;    // Hangi sipariş için (opsiyonel)
}
```

**Request Örneği**:
```json
{
  "rating": 5,
  "comment": "Harika bir çalışma! Tam istediğim gibi oldu. İletişimi de çok hızlıydı. Kesinlikle tekrar çalışırım.",
  "orderId": "order-uuid-123"
}
```

**Response** (201 Created):
```json
{
  "id": "review-uuid",
  "designerId": "designer-uuid",
  "userId": "user-uuid",
  "rating": 5,
  "comment": "Harika bir çalışma! Tam istediğim gibi oldu...",
  "orderId": "order-uuid-123",
  "createdAt": "2025-01-25T10:00:00.000Z"
}
```

**Hata Durumları**:
- `400 Bad Request`: Bu tasarımcıyla henüz tamamlanmış siparişiniz yok
- `409 Conflict`: Bu sipariş için zaten değerlendirme yaptınız

---

### 7.7. Tasarımcı Değerlendirmelerini Listele

**Endpoint**: `GET /api/v1/designers/:id/reviews`  
**Auth**: Gerekli ✅

**Açıklama**: Bir tasarımcının tüm değerlendirmelerini listeler.

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "rating";
  sortOrder?: "asc" | "desc";
}
```

**Response** (200 OK):
```json
{
  "reviews": [
    {
      "id": "review-uuid-1",
      "userId": "user-uuid",
      "userName": "Ahmet Y.",
      "userAvatar": "https://api.polikrami.com/uploads/avatars/ahmet.jpg",
      "rating": 5,
      "comment": "Harika bir çalışma! Tam istediğim gibi oldu...",
      "orderId": "order-uuid",
      "createdAt": "2025-01-25T10:00:00.000Z",
      "helpful": 12,
      "notHelpful": 1
    }
  ],
  "statistics": {
    "averageRating": 4.9,
    "totalReviews": 234,
    "ratingDistribution": {
      "5": 200,
      "4": 25,
      "3": 7,
      "2": 1,
      "1": 1
    }
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 234,
    "totalPages": 24
  }
}
```

---

## 💰 Cüzdan (Wallet)

Cüzdan sistemi, kullanıcıların AI üretimi ve diğer premium özelliklerde kullanabilecekleri kredileri yönetir.

### 8.1. Bakiye Sorgula

**Endpoint**: `GET /api/v1/wallet`  
**Auth**: Gerekli ✅

**Açıklama**: Kullanıcının mevcut kredi bakiyesini getirir.

**Response** (200 OK):
```json
{
  "balance": 150,
  "currency": "CREDIT",
  "userId": "user-uuid",
  "lastUpdated": "2025-01-22T15:30:00.000Z"
}
```

**Frontend Kullanımı**:
```javascript
async function getWalletBalance() {
  const accessToken = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.polikrami.com/api/v1/wallet', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  if (!response.ok) throw new Error('Bakiye getirilemedi');
  
  return await response.json();
}

// React Hook
function useWalletBalance() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const fetchBalance = async () => {
    try {
      const data = await getWalletBalance();
      setBalance(data.balance);
    } catch (error) {
      console.error('Bakiye hatası:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBalance();
  }, []);
  
  return { balance, loading, refetch: fetchBalance };
}

// Kullanım
function WalletWidget() {
  const { balance, loading } = useWalletBalance();
  
  if (loading) return <div>Yükleniyor...</div>;
  
  return (
    <div className="wallet-widget">
      <div className="balance">
        <span className="label">Krediniz:</span>
        <span className="amount">{balance} kredi</span>
      </div>
      <button onClick={() => window.location.href = '/wallet/purchase'}>
        Kredi Satın Al
      </button>
    </div>
  );
}
```

---

### 8.2. İşlem Geçmişi

**Endpoint**: `GET /api/v1/wallet/history`  
**Auth**: Gerekli ✅

**Açıklama**: Cüzdan işlem geçmişini listeler.

**Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  type?: "credit" | "debit" | "all";  // Gelen/Giden/Hepsi
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
}
```

**Request Örneği**:
```http
GET /api/v1/wallet/history?type=all&page=1&limit=20
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "transactions": [
    {
      "id": "txn-uuid-1",
      "type": "credit",
      "amount": 100,
      "description": "Kredi paketi satın alımı - Orta Paket",
      "referenceType": "purchase",
      "referenceId": "purchase-uuid",
      "balanceBefore": 50,
      "balanceAfter": 150,
      "createdAt": "2025-01-22T10:00:00.000Z"
    },
    {
      "id": "txn-uuid-2",
      "type": "debit",
      "amount": 10,
      "description": "AI kapak üretimi",
      "referenceType": "ai_generation",
      "referenceId": "draft-uuid",
      "balanceBefore": 150,
      "balanceAfter": 140,
      "createdAt": "2025-01-22T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "summary": {
    "totalCredits": 200,
    "totalDebits": 60,
    "netBalance": 140
  }
}
```

**Frontend Kullanımı**:
```javascript
function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({ type: 'all', page: 1 });
  
  useEffect(() => {
    async function loadTransactions() {
      const accessToken = localStorage.getItem('access_token');
      const params = new URLSearchParams(filters);
      
      const response = await fetch(
        `https://api.polikrami.com/api/v1/wallet/history?${params}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      const data = await response.json();
      setTransactions(data.transactions);
    }
    
    loadTransactions();
  }, [filters]);
  
  return (
    <div className="transaction-history">
      <div className="filters">
        <select 
          value={filters.type} 
          onChange={(e) => setFilters({...filters, type: e.target.value})}
        >
          <option value="all">Tümü</option>
          <option value="credit">Gelen</option>
          <option value="debit">Giden</option>
        </select>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Açıklama</th>
            <th>Miktar</th>
            <th>Bakiye</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(txn => (
            <tr key={txn.id}>
              <td>{new Date(txn.createdAt).toLocaleDateString('tr-TR')}</td>
              <td>{txn.description}</td>
              <td className={txn.type}>
                {txn.type === 'credit' ? '+' : '-'}{txn.amount}
              </td>
              <td>{txn.balanceAfter}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### 8.3. İstatistikler

**Endpoint**: `GET /api/v1/wallet/stats`  
**Auth**: Gerekli ✅

**Açıklama**: Cüzdan kullanım istatistiklerini getirir.

**Response** (200 OK):
```json
{
  "totalCreditsEarned": 500,
  "totalCreditsSpent": 350,
  "currentBalance": 150,
  "totalPurchases": 5,
  "totalPurchaseAmount": 2500.00,
  "averageSpendPerMonth": 87.5,
  "mostUsedFeature": "ai_generation",
  "monthlyStats": [
    {
      "month": "2025-01",
      "earned": 200,
      "spent": 150,
      "purchases": 2
    }
  ],
  "categoryBreakdown": {
    "ai_generation": 250,
    "premium_templates": 50,
    "fast_delivery": 50
  }
}
```

---

### 8.4. Kredi Satın Al

**Endpoint**: `POST /api/v1/wallet/purchase`  
**Auth**: Gerekli ✅  
**Rate Limit**: 5 alım/saat

**Açıklama**: Kredi paketi satın alır.

**Request Body**:
```typescript
{
  packageType: "small" | "medium" | "large" | "custom";
  amount?: number;  // custom için gerekli
}
```

**Kredi Paketleri**:
- **Small**: 100 kredi - 99 TL
- **Medium**: 500 kredi - 449 TL (10% indirim)
- **Large**: 1000 kredi - 799 TL (20% indirim)

**Request Örneği**:
```json
{
  "packageType": "medium"
}
```

**Response** (200 OK):
```json
{
  "purchaseId": "purchase-uuid",
  "packageType": "medium",
  "credits": 500,
  "amount": 449.00,
  "currency": "TRY",
  "paymentUrl": "https://payment-gateway.com/pay?token=abc123",
  "expiresAt": "2025-01-22T19:00:00.000Z"
}
```

**Frontend Kullanımı**:
```javascript
async function purchaseCredits(packageType) {
  const accessToken = localStorage.getItem('access_token');
  const csrfToken = localStorage.getItem('csrf_token');
  
  const response = await fetch('https://api.polikrami.com/api/v1/wallet/purchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-CSRF-Token': csrfToken
    },
    credentials: 'include',
    body: JSON.stringify({ packageType })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }
  
  const { paymentUrl } = await response.json();
  
  // Ödeme sayfasına yönlendir
  window.location.href = paymentUrl;
}

// Credit Package Component
function CreditPackages() {
  const packages = [
    { type: 'small', credits: 100, price: 99, discount: 0 },
    { type: 'medium', credits: 500, price: 449, discount: 10 },
    { type: 'large', credits: 1000, price: 799, discount: 20 }
  ];
  
  return (
    <div className="credit-packages">
      <h2>Kredi Paketleri</h2>
      <div className="packages-grid">
        {packages.map(pkg => (
          <div key={pkg.type} className="package-card">
            {pkg.discount > 0 && (
              <div className="discount-badge">%{pkg.discount} İndirim</div>
            )}
            <h3>{pkg.credits} Kredi</h3>
            <div className="price">{pkg.price} TL</div>
            <div className="per-credit">
              {(pkg.price / pkg.credits).toFixed(2)} TL / kredi
            </div>
            <button onClick={() => purchaseCredits(pkg.type)}>
              Satın Al
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 8.5. Kredi Hediye Et (Admin)

**Endpoint**: `POST /api/v1/wallet/grant`  
**Auth**: Gerekli ✅ (Sadece Admin)

**Açıklama**: Kullanıcıya admin tarafından kredi hediye edilir.

**Request Body**:
```typescript
{
  userId: string;
  amount: number;
  reason?: string;
}
```

---

Devam ediyorum...



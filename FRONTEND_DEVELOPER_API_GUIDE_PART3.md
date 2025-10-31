# Frontend API Kılavuzu - Bölüm 3

> Bu dosya "FRONTEND_DEVELOPER_API_GUIDE_PART2.md" dosyasının devamıdır.

---

## 📦 Kargo Takibi (Shipments)

### Kargo Durumları
- `pending`: Hazırlanıyor
- `picked_up`: Kargoya verildi
- `in_transit`: Yolda
- `out_for_delivery`: Dağıtımda
- `delivered`: Teslim edildi
- `failed_delivery`: Teslimat başarısız
- `returned`: İade edildi

---

### 9.1. Desteklenen Kargo Firmaları

**Endpoint**: `GET /api/v1/shipments/carriers`  
**Auth**: Gerekli değil

**Açıklama**: Desteklenen tüm kargo firmalarını listeler.

**Response** (200 OK):
```json
{
  "carriers": [
    {
      "code": "aras",
      "name": "Aras Kargo",
      "trackingUrl": "https://www.araskargo.com.tr/tr/takip/{trackingNumber}",
      "logo": "https://api.polikrami.com/uploads/carriers/aras.png"
    },
    {
      "code": "mng",
      "name": "MNG Kargo",
      "trackingUrl": "https://www.mngkargo.com.tr/track/{trackingNumber}",
      "logo": "https://api.polikrami.com/uploads/carriers/mng.png"
    },
    {
      "code": "yurtici",
      "name": "Yurtiçi Kargo",
      "trackingUrl": "https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code={trackingNumber}",
      "logo": "https://api.polikrami.com/uploads/carriers/yurtici.png"
    }
  ]
}
```

---

### 9.2. Sipariş Kargolarını Listele

**Endpoint**: `GET /api/v1/shipments/orders/:id/shipments`  
**Auth**: Gerekli ✅ (Sadece sipariş sahibi)

**Açıklama**: Belirli bir siparişin tüm kargolarını listeler.

**Response** (200 OK):
```json
{
  "shipments": [
    {
      "id": "shipment-uuid",
      "orderId": "order-uuid",
      "carrier": "aras",
      "carrierName": "Aras Kargo",
      "trackingNumber": "TR123456789",
      "status": "in_transit",
      "currentLocation": "İstanbul Transfer Merkezi",
      "estimatedDelivery": "2025-01-25T18:00:00.000Z",
      "actualDelivery": null,
      "recipientName": "Ahmet Yılmaz",
      "recipientPhone": "+905551234567",
      "address": {
        "city": "İstanbul",
        "district": "Kadıköy",
        "fullAddress": "Örnek Mahallesi, Cadde No: 123"
      },
      "items": [
        {
          "description": "Kitap kapağı baskısı",
          "quantity": 1,
          "weight": 0.5
        }
      ],
      "shippedAt": "2025-01-23T10:00:00.000Z",
      "createdAt": "2025-01-23T09:00:00.000Z",
      "updatedAt": "2025-01-24T14:30:00.000Z"
    }
  ]
}
```

**Frontend Kullanımı**:
```javascript
async function getOrderShipments(orderId) {
  const accessToken = localStorage.getItem('access_token');
  
  const response = await fetch(
    `https://api.polikrami.com/api/v1/shipments/orders/${orderId}/shipments`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  );
  
  if (!response.ok) throw new Error('Kargo bilgileri getirilemedi');
  
  return await response.json();
}

// React Component
function OrderShipmentTracking({ orderId }) {
  const [shipments, setShipments] = useState([]);
  
  useEffect(() => {
    async function loadShipments() {
      const data = await getOrderShipments(orderId);
      setShipments(data.shipments);
    }
    loadShipments();
  }, [orderId]);
  
  return (
    <div className="shipment-tracking">
      <h3>Kargo Bilgileri</h3>
      {shipments.map(shipment => (
        <div key={shipment.id} className="shipment-card">
          <div className="carrier-info">
            <strong>{shipment.carrierName}</strong>
            <span className="tracking-number">{shipment.trackingNumber}</span>
          </div>
          
          <div className="status-badge" data-status={shipment.status}>
            {getStatusText(shipment.status)}
          </div>
          
          <div className="location">
            📍 {shipment.currentLocation}
          </div>
          
          <div className="estimated-delivery">
            Tahmini Teslimat: {new Date(shipment.estimatedDelivery).toLocaleDateString('tr-TR')}
          </div>
          
          <button onClick={() => window.open(
            `https://www.araskargo.com.tr/tr/takip/${shipment.trackingNumber}`,
            '_blank'
          )}>
            Detaylı Takip
          </button>
        </div>
      ))}
    </div>
  );
}

function getStatusText(status) {
  const statusTexts = {
    pending: 'Hazırlanıyor',
    picked_up: 'Kargoya Verildi',
    in_transit: 'Yolda',
    out_for_delivery: 'Dağıtımda',
    delivered: 'Teslim Edildi',
    failed_delivery: 'Teslimat Başarısız',
    returned: 'İade Edildi'
  };
  return statusTexts[status] || status;
}
```

---

### 9.3. Kargo Olaylarını Getir (Tracking Events)

**Endpoint**: `GET /api/v1/shipments/:id/events`  
**Auth**: Gerekli ✅ (Sadece sipariş sahibi)

**Açıklama**: Kargonun detaylı takip geçmişini getirir.

**Response** (200 OK):
```json
{
  "shipmentId": "shipment-uuid",
  "trackingNumber": "TR123456789",
  "carrier": "aras",
  "currentStatus": "in_transit",
  "events": [
    {
      "id": "event-uuid-1",
      "status": "picked_up",
      "description": "Kargo şubeden alındı",
      "location": "İstanbul - Kadıköy Şubesi",
      "timestamp": "2025-01-23T10:00:00.000Z",
      "isCheckpoint": true
    },
    {
      "id": "event-uuid-2",
      "status": "in_transit",
      "description": "Kargo transfer merkezine ulaştı",
      "location": "İstanbul Transfer Merkezi",
      "timestamp": "2025-01-23T18:30:00.000Z",
      "isCheckpoint": true
    },
    {
      "id": "event-uuid-3",
      "status": "in_transit",
      "description": "Kargo dağıtım merkezinde",
      "location": "Ankara Dağıtım Merkezi",
      "timestamp": "2025-01-24T08:00:00.000Z",
      "isCheckpoint": false
    },
    {
      "id": "event-uuid-4",
      "status": "out_for_delivery",
      "description": "Kargo dağıtıma çıktı",
      "location": "Ankara - Çankaya",
      "timestamp": "2025-01-24T14:00:00.000Z",
      "isCheckpoint": true
    }
  ],
  "estimatedDelivery": "2025-01-25T18:00:00.000Z"
}
```

**Frontend Timeline Bileşeni**:
```javascript
function ShipmentTimeline({ shipmentId }) {
  const [tracking, setTracking] = useState(null);
  
  useEffect(() => {
    async function loadTracking() {
      const accessToken = localStorage.getItem('access_token');
      
      const response = await fetch(
        `https://api.polikrami.com/api/v1/shipments/${shipmentId}/events`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      const data = await response.json();
      setTracking(data);
    }
    
    loadTracking();
    
    // Her 5 dakikada bir güncelle
    const interval = setInterval(loadTracking, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [shipmentId]);
  
  if (!tracking) return <div>Yükleniyor...</div>;
  
  return (
    <div className="shipment-timeline">
      <div className="tracking-header">
        <h3>Kargo Takibi</h3>
        <span className="tracking-number">{tracking.trackingNumber}</span>
      </div>
      
      <div className="timeline">
        {tracking.events.map((event, index) => (
          <div 
            key={event.id} 
            className={`timeline-item ${event.isCheckpoint ? 'checkpoint' : ''}`}
          >
            <div className="timeline-marker">
              {index === 0 ? '📍' : '○'}
            </div>
            <div className="timeline-content">
              <div className="time">
                {new Date(event.timestamp).toLocaleString('tr-TR')}
              </div>
              <div className="location">{event.location}</div>
              <div className="description">{event.description}</div>
            </div>
          </div>
        ))}
      </div>
      
      {tracking.estimatedDelivery && (
        <div className="estimated-delivery">
          <span>Tahmini Teslimat:</span>
          <strong>
            {new Date(tracking.estimatedDelivery).toLocaleDateString('tr-TR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </strong>
        </div>
      )}
    </div>
  );
}
```

---

### 9.4. Public Kargo Takibi

**Endpoint**: `GET /api/v1/shipments/public/:id/events`  
**Auth**: Gerekli değil  
**Rate Limit**: 10 istek/dakika

**Açıklama**: Kimlik doğrulama olmadan kargo takibi (tracking number ile).

**Query Parameters**:
```typescript
{
  token?: string;  // Doğrulama token'ı (güvenlik için)
}
```

**Response**: `/api/v1/shipments/:id/events` ile aynı

**Frontend Public Tracking Page**:
```javascript
function PublicTrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipmentData, setShipmentData] = useState(null);
  const [error, setError] = useState('');
  
  async function handleTrack(e) {
    e.preventDefault();
    setError('');
    
    try {
      // Public tracking endpoint
      const response = await fetch(
        `https://api.polikrami.com/api/v1/shipments/public/${trackingNumber}/events`
      );
      
      if (!response.ok) {
        throw new Error('Kargo bulunamadı');
      }
      
      const data = await response.json();
      setShipmentData(data);
    } catch (err) {
      setError(err.message);
    }
  }
  
  return (
    <div className="public-tracking">
      <h1>Kargo Takibi</h1>
      
      <form onSubmit={handleTrack}>
        <input
          type="text"
          placeholder="Takip numaranızı girin"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          required
        />
        <button type="submit">Sorgula</button>
      </form>
      
      {error && <div className="error">{error}</div>}
      
      {shipmentData && (
        <ShipmentTimeline shipmentId={shipmentData.shipmentId} />
      )}
    </div>
  );
}
```

---

### 9.5. Kargo Oluştur (Admin)

**Endpoint**: `POST /api/v1/shipments/orders/:id/shipments`  
**Auth**: Gerekli ✅ (Sadece Admin)

**Açıklama**: Sipariş için kargo kaydı oluşturur.

**Request Body**:
```typescript
{
  carrier: string;           // "aras", "mng", "yurtici"
  trackingNumber: string;
  estimatedDelivery?: string;
}
```

---

### 9.6. Kargo Durumunu Senkronize Et (Admin)

**Endpoint**: `POST /api/v1/shipments/:id/sync`  
**Auth**: Gerekli ✅ (Sadece Admin)

**Açıklama**: Kargo firmasından güncel durumu çeker.

---

### 9.7. Kargo Webhook (Kargo Firması)

**Endpoint**: `POST /api/v1/shipments/webhook/:provider`  
**Auth**: Signature doğrulaması  
**Rate Limit**: 100 istek/dakika

**Açıklama**: Kargo firmasından gelen otomatik güncellemeler (frontend'den çağrılmaz).

---

## 📮 Adresler (Addresses)

Kullanıcılar, sık kullandıkları teslimat adreslerini kaydedebilir.

### 10.1. Adreslerimi Listele

**Endpoint**: `GET /api/v1/addresses`  
**Auth**: Gerekli ✅

**Açıklama**: Kullanıcının kayıtlı tüm adreslerini listeler.

**Response** (200 OK):
```json
{
  "addresses": [
    {
      "id": "address-uuid-1",
      "userId": "user-uuid",
      "title": "Ev",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      "phone": "+905551234567",
      "address": "Örnek Mahallesi, Cadde No: 123, Daire: 5",
      "city": "İstanbul",
      "district": "Kadıköy",
      "state": "İstanbul",
      "country": "Turkey",
      "postalCode": "34000",
      "isDefault": true,
      "createdAt": "2025-01-20T10:00:00.000Z",
      "updatedAt": "2025-01-20T10:00:00.000Z"
    },
    {
      "id": "address-uuid-2",
      "userId": "user-uuid",
      "title": "İş",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      "phone": "+905551234567",
      "address": "İş Merkezi, Kat: 5, No: 12",
      "city": "İstanbul",
      "district": "Şişli",
      "state": "İstanbul",
      "country": "Turkey",
      "postalCode": "34360",
      "isDefault": false,
      "createdAt": "2025-01-21T14:00:00.000Z",
      "updatedAt": "2025-01-21T14:00:00.000Z"
    }
  ]
}
```

**Frontend Kullanımı**:
```javascript
async function getMyAddresses() {
  const accessToken = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.polikrami.com/api/v1/addresses', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  if (!response.ok) throw new Error('Adresler getirilemedi');
  
  return await response.json();
}

// React Address List Component
function AddressList({ onSelect }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadAddresses() {
      try {
        const data = await getMyAddresses();
        setAddresses(data.addresses);
      } catch (error) {
        console.error('Adres yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAddresses();
  }, []);
  
  if (loading) return <div>Yükleniyor...</div>;
  
  return (
    <div className="address-list">
      {addresses.map(address => (
        <div key={address.id} className="address-card">
          <div className="address-header">
            <h4>{address.title}</h4>
            {address.isDefault && <span className="badge">Varsayılan</span>}
          </div>
          
          <div className="address-details">
            <p><strong>{address.firstName} {address.lastName}</strong></p>
            <p>{address.phone}</p>
            <p>{address.address}</p>
            <p>{address.district} / {address.city}</p>
            <p>{address.postalCode}</p>
          </div>
          
          <div className="address-actions">
            <button onClick={() => onSelect(address)}>Seç</button>
            <button onClick={() => editAddress(address.id)}>Düzenle</button>
            <button onClick={() => deleteAddress(address.id)}>Sil</button>
          </div>
        </div>
      ))}
      
      <button className="add-new" onClick={() => showAddAddressModal()}>
        + Yeni Adres Ekle
      </button>
    </div>
  );
}
```

---

### 10.2. Adres Detayı

**Endpoint**: `GET /api/v1/addresses/:id`  
**Auth**: Gerekli ✅ (Sadece sahip)

**Açıklama**: Belirli bir adresin detaylarını getirir.

**Response** (200 OK):
```json
{
  "id": "address-uuid-1",
  "title": "Ev",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "phone": "+905551234567",
  "address": "Örnek Mahallesi, Cadde No: 123, Daire: 5",
  "city": "İstanbul",
  "district": "Kadıköy",
  "postalCode": "34000",
  "isDefault": true
}
```

---

### 10.3. Varsayılan Adresi Getir

**Endpoint**: `GET /api/v1/addresses/default`  
**Auth**: Gerekli ✅

**Açıklama**: Kullanıcının varsayılan adresini getirir.

**Response** (200 OK):
```json
{
  "id": "address-uuid-1",
  "title": "Ev",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "address": "Örnek Mahallesi, Cadde No: 123, Daire: 5",
  "city": "İstanbul",
  "isDefault": true
}
```

---

### 10.4. Yeni Adres Ekle

**Endpoint**: `POST /api/v1/addresses`  
**Auth**: Gerekli ✅

**Açıklama**: Yeni teslimat adresi ekler.

**Request Body**:
```typescript
{
  title: string;          // "Ev", "İş", vb. (Max 50 karakter)
  firstName: string;      // Min 2, Max 50 karakter
  lastName: string;       // Min 2, Max 50 karakter
  phone: string;          // +90XXXXXXXXXX formatında
  address: string;        // Min 10, Max 500 karakter
  city: string;
  district?: string;
  state?: string;
  country: string;        // Default: "Turkey"
  postalCode: string;
  isDefault?: boolean;    // Bu adresi varsayılan yap
}
```

**Request Örneği**:
```json
{
  "title": "Ev",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "phone": "+905551234567",
  "address": "Örnek Mahallesi, Cadde No: 123, Daire: 5",
  "city": "İstanbul",
  "district": "Kadıköy",
  "state": "İstanbul",
  "country": "Turkey",
  "postalCode": "34000",
  "isDefault": true
}
```

**Response** (201 Created):
```json
{
  "id": "address-uuid-new",
  "title": "Ev",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "phone": "+905551234567",
  "address": "Örnek Mahallesi, Cadde No: 123, Daire: 5",
  "city": "İstanbul",
  "district": "Kadıköy",
  "postalCode": "34000",
  "isDefault": true,
  "createdAt": "2025-01-25T10:00:00.000Z"
}
```

**Frontend Form**:
```javascript
function AddAddressForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    isDefault: false
  });
  const [errors, setErrors] = useState({});
  
  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    
    try {
      const accessToken = localStorage.getItem('access_token');
      const csrfToken = localStorage.getItem('csrf_token');
      
      const response = await fetch('https://api.polikrami.com/api/v1/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          country: 'Turkey'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        if (error.error.details) {
          setErrors(error.error.details);
        }
        throw new Error(error.error.message);
      }
      
      const newAddress = await response.json();
      onSuccess(newAddress);
    } catch (error) {
      console.error('Adres ekleme hatası:', error);
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="address-form">
      <h3>Yeni Adres Ekle</h3>
      
      <div className="form-group">
        <label>Adres Başlığı</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="Ev, İş, vb."
          required
        />
        {errors.title && <span className="error">{errors.title}</span>}
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Ad</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Soyad</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div className="form-group">
        <label>Telefon</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          placeholder="+90 555 123 45 67"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Adres</label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          placeholder="Mahalle, Cadde, Sokak, No, Daire"
          rows="3"
          required
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>İl</label>
          <select
            value={formData.city}
            onChange={(e) => setFormData({...formData, city: e.target.value})}
            required
          >
            <option value="">Seçiniz</option>
            <option value="İstanbul">İstanbul</option>
            <option value="Ankara">Ankara</option>
            <option value="İzmir">İzmir</option>
            {/* Tüm iller */}
          </select>
        </div>
        
        <div className="form-group">
          <label>İlçe</label>
          <input
            type="text"
            value={formData.district}
            onChange={(e) => setFormData({...formData, district: e.target.value})}
          />
        </div>
      </div>
      
      <div className="form-group">
        <label>Posta Kodu</label>
        <input
          type="text"
          value={formData.postalCode}
          onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
          placeholder="34000"
          required
        />
      </div>
      
      <div className="form-group checkbox">
        <label>
          <input
            type="checkbox"
            checked={formData.isDefault}
            onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
          />
          Varsayılan adres olarak ayarla
        </label>
      </div>
      
      <div className="form-actions">
        <button type="submit" className="btn-primary">Kaydet</button>
        <button type="button" className="btn-secondary" onClick={() => onSuccess(null)}>
          İptal
        </button>
      </div>
    </form>
  );
}
```

---

### 10.5. Adresi Güncelle

**Endpoint**: `PUT /api/v1/addresses/:id`  
**Auth**: Gerekli ✅ (Sadece sahip)

**Açıklama**: Mevcut adresi günceller.

**Request Body**: `POST /api/v1/addresses` ile aynı

**Response** (200 OK):
```json
{
  "id": "address-uuid",
  "title": "İş (Güncel)",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "address": "Yeni İş Adresi",
  "updatedAt": "2025-01-25T11:00:00.000Z"
}
```

---

### 10.6. Varsayılan Adres Olarak Ayarla

**Endpoint**: `POST /api/v1/addresses/:id/default`  
**Auth**: Gerekli ✅ (Sadece sahip)

**Açıklama**: Belirli bir adresi varsayılan adres yapar.

**Response** (200 OK):
```json
{
  "message": "Adres varsayılan olarak ayarlandı",
  "addressId": "address-uuid",
  "isDefault": true
}
```

---

### 10.7. Adresi Sil

**Endpoint**: `DELETE /api/v1/addresses/:id`  
**Auth**: Gerekli ✅ (Sadece sahip)

**Açıklama**: Adresi siler.

**Response** (200 OK):
```json
{
  "message": "Adres silindi",
  "deletedId": "address-uuid"
}
```

**Hata Durumları**:
- `400 Bad Request`: Varsayılan adres silinemez (önce başka adresi varsayılan yapın)

**Frontend Delete Confirmation**:
```javascript
async function deleteAddress(addressId) {
  if (!confirm('Bu adresi silmek istediğinizden emin misiniz?')) {
    return;
  }
  
  const accessToken = localStorage.getItem('access_token');
  const csrfToken = localStorage.getItem('csrf_token');
  
  try {
    const response = await fetch(
      `https://api.polikrami.com/api/v1/addresses/${addressId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include'
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }
    
    // Adres listesini yenile
    window.location.reload();
  } catch (error) {
    alert('Adres silinemedi: ' + error.message);
  }
}
```

---

## 📄 Şablonlar (Templates)

Hazır kapak tasarımı şablonları.

### 11.1. Şablonları Listele

**Endpoint**: `GET /api/v1/templates`  
**Auth**: Gerekli değil

**Açıklama**: Tüm şablonları listeler.

**Query Parameters**:
```typescript
{
  category?: string;
  search?: string;
  tags?: string;        // Virgülle ayrılmış
  page?: number;
  limit?: number;
  sortBy?: "popular" | "newest" | "name";
}
```

**Request Örneği**:
```http
GET /api/v1/templates?category=fantasy&sortBy=popular&page=1&limit=12
```

**Response** (200 OK):
```json
{
  "templates": [
    {
      "id": "template-uuid-1",
      "name": "Mystical Forest",
      "slug": "mystical-forest",
      "description": "Büyülü orman temalı kapak tasarımı",
      "category": {
        "id": "cat-uuid",
        "name": "Fantasy"
      },
      "previewImage": "https://api.polikrami.com/uploads/templates/preview1.jpg",
      "thumbnailImage": "https://api.polikrami.com/uploads/templates/thumb1.jpg",
      "tags": ["forest", "magic", "mystical", "nature"],
      "isPremium": false,
      "price": 0,
      "usageCount": 1234,
      "rating": 4.7,
      "totalReviews": 89,
      "createdAt": "2024-06-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 156,
    "totalPages": 13
  }
}
```

**Frontend Template Gallery**:
```javascript
function TemplateGallery() {
  const [templates, setTemplates] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    sortBy: 'popular',
    page: 1
  });
  
  useEffect(() => {
    async function loadTemplates() {
      const params = new URLSearchParams(filters);
      const response = await fetch(
        `https://api.polikrami.com/api/v1/templates?${params}`
      );
      const data = await response.json();
      setTemplates(data.templates);
    }
    loadTemplates();
  }, [filters]);
  
  return (
    <div className="template-gallery">
      <div className="filters">
        <input
          type="text"
          placeholder="Şablon ara..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
        />
        
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
        >
          <option value="popular">En Popüler</option>
          <option value="newest">En Yeni</option>
          <option value="name">İsme Göre</option>
        </select>
      </div>
      
      <div className="template-grid">
        {templates.map(template => (
          <div key={template.id} className="template-card">
            <img src={template.thumbnailImage} alt={template.name} />
            <div className="template-info">
              <h4>{template.name}</h4>
              <div className="rating">
                ⭐ {template.rating} ({template.totalReviews})
              </div>
              {template.isPremium && (
                <span className="premium-badge">Premium - {template.price} TL</span>
              )}
              <div className="usage-count">
                {template.usageCount} kez kullanıldı
              </div>
              <button onClick={() => useTemplate(template.id)}>
                Bu Şablonu Kullan
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function useTemplate(templateId) {
  // Taslak oluştur ve şablon ID'sini kullan
  const accessToken = localStorage.getItem('access_token');
  const csrfToken = localStorage.getItem('csrf_token');
  
  const response = await fetch('https://api.polikrami.com/api/v1/drafts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-CSRF-Token': csrfToken
    },
    credentials: 'include',
    body: JSON.stringify({
      method: 'template',
      templateId: templateId,
      categoryId: 'some-category-uuid'
    })
  });
  
  if (response.ok) {
    const draft = await response.json();
    window.location.href = `/drafts/${draft.id}`;
  }
}
```

---

### 11.2. Popüler Şablonlar

**Endpoint**: `GET /api/v1/templates/popular`  
**Auth**: Gerekli değil

**Açıklama**: En çok kullanılan şablonları getirir.

**Query Parameters**:
```typescript
{
  limit?: number;  // Default: 10
}
```

**Response** (200 OK):
```json
{
  "templates": [
    {
      "id": "template-uuid",
      "name": "Bestseller Cover",
      "previewImage": "https://api.polikrami.com/uploads/templates/preview.jpg",
      "usageCount": 5678,
      "rating": 4.9
    }
  ]
}
```

---

### 11.3. Şablon Detayı (Slug ile)

**Endpoint**: `GET /api/v1/templates/slug/:slug`  
**Auth**: Gerekli değil

**Açıklama**: SEO-friendly URL ile şablon detayı.

**Response** (200 OK):
```json
{
  "id": "template-uuid",
  "name": "Mystical Forest",
  "slug": "mystical-forest",
  "description": "Detaylı açıklama...",
  "longDescription": "Çok detaylı açıklama markdown formatında...",
  "previewImages": [
    "https://api.polikrami.com/uploads/templates/prev1.jpg",
    "https://api.polikrami.com/uploads/templates/prev2.jpg",
    "https://api.polikrami.com/uploads/templates/prev3.jpg"
  ],
  "features": [
    "Özelleştirilebilir renkler",
    "Yüksek çözünürlük",
    "Ticari kullanım hakkı"
  ],
  "customizableElements": [
    "title",
    "subtitle",
    "author",
    "background_color",
    "text_color"
  ],
  "dimensions": {
    "width": 2400,
    "height": 3600,
    "unit": "px"
  },
  "fileFormats": ["PSD", "PNG", "JPG"],
  "category": {
    "id": "cat-uuid",
    "name": "Fantasy"
  },
  "tags": ["forest", "magic", "mystical"],
  "isPremium": false,
  "price": 0,
  "currency": "TRY",
  "designer": {
    "id": "designer-uuid",
    "name": "Ayşe Demir",
    "avatar": "https://api.polikrami.com/uploads/designers/ayse.jpg"
  },
  "usageCount": 1234,
  "rating": 4.7,
  "totalReviews": 89,
  "createdAt": "2024-06-15T00:00:00.000Z",
  "updatedAt": "2025-01-20T10:00:00.000Z"
}
```

---

### 11.4. Şablon Detayı (ID ile)

**Endpoint**: `GET /api/v1/templates/:id`  
**Auth**: Gerekli değil

**Response**: Slug endpoint ile aynı

---

### 11.5. Şablon Oluştur (Admin/Designer)

**Endpoint**: `POST /api/v1/templates`  
**Auth**: Gerekli ✅ (Admin veya Designer)

**Request Body**:
```typescript
{
  name: string;
  description: string;
  categoryId: string;
  previewImage: string;  // URL
  tags?: string[];
  isPremium?: boolean;
  price?: number;
}
```

---

### 11.6. Şablon Güncelle (Admin/Designer)

**Endpoint**: `PUT /api/v1/templates/:id`  
**Auth**: Gerekli ✅ (Admin veya Designer)

---

### 11.7. Şablon Sil (Admin)

**Endpoint**: `DELETE /api/v1/templates/:id`  
**Auth**: Gerekli ✅ (Sadece Admin)

---

Devam ediyorum...



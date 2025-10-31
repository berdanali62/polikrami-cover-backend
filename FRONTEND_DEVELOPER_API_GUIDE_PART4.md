# Frontend API Kılavuzu - Bölüm 4 (Final)

> Bu dosya "FRONTEND_DEVELOPER_API_GUIDE_PART3.md" dosyasının devamıdır.

---

## 📂 Kategoriler (Categories)

### 12.1. Kategorileri Listele

**Endpoint**: `GET /api/v1/categories`  
**Auth**: Gerekli değil

**Açıklama**: Tüm kitap kapağı kategorilerini listeler.

**Response** (200 OK):
```json
{
  "categories": [
    {
      "id": "1",
      "name": "Fantasy",
      "slug": "fantasy",
      "description": "Fantastik ve büyülü hikayeler",
      "icon": "🧙",
      "coverImage": "https://api.polikrami.com/uploads/categories/fantasy.jpg",
      "templateCount": 45,
      "designerCount": 23,
      "order": 1,
      "isActive": true
    },
    {
      "id": "2",
      "name": "Romance",
      "slug": "romance",
      "description": "Aşk ve romantizm hikayeleri",
      "icon": "💕",
      "coverImage": "https://api.polikrami.com/uploads/categories/romance.jpg",
      "templateCount": 67,
      "designerCount": 34,
      "order": 2,
      "isActive": true
    },
    {
      "id": "3",
      "name": "Thriller",
      "slug": "thriller",
      "description": "Gerilim ve heyecan dolu hikayeler",
      "icon": "🔪",
      "coverImage": "https://api.polikrami.com/uploads/categories/thriller.jpg",
      "templateCount": 38,
      "designerCount": 19,
      "order": 3,
      "isActive": true
    }
  ]
}
```

**Frontend Kullanımı**:
```javascript
async function getCategories() {
  const response = await fetch('https://api.polikrami.com/api/v1/categories');
  
  if (!response.ok) {
    throw new Error('Kategoriler getirilemedi');
  }
  
  return await response.json();
}

// React Category Selector
function CategorySelector({ onSelect, selectedId }) {
  const [categories, setCategories] = useState([]);
  
  useEffect(() => {
    async function loadCategories() {
      const data = await getCategories();
      setCategories(data.categories);
    }
    loadCategories();
  }, []);
  
  return (
    <div className="category-selector">
      <h3>Kategori Seçin</h3>
      <div className="category-grid">
        {categories.map(cat => (
          <div
            key={cat.id}
            className={`category-card ${selectedId === cat.id ? 'selected' : ''}`}
            onClick={() => onSelect(cat)}
          >
            <div className="category-icon">{cat.icon}</div>
            <h4>{cat.name}</h4>
            <p>{cat.description}</p>
            <div className="stats">
              <span>{cat.templateCount} şablon</span>
              <span>{cat.designerCount} tasarımcı</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 12.2. Kategori Detayı

**Endpoint**: `GET /api/v1/categories/:id`  
**Auth**: Gerekli değil

**Açıklama**: Belirli bir kategorinin detaylarını getirir.

**Response** (200 OK):
```json
{
  "id": "1",
  "name": "Fantasy",
  "slug": "fantasy",
  "description": "Fantastik ve büyülü hikayeler için özel tasarımlar",
  "longDescription": "Fantasy kategorisinde epik maceralar...",
  "icon": "🧙",
  "coverImage": "https://api.polikrami.com/uploads/categories/fantasy.jpg",
  "headerImage": "https://api.polikrami.com/uploads/categories/fantasy-header.jpg",
  "templateCount": 45,
  "designerCount": 23,
  "popularTemplates": [
    {
      "id": "template-uuid",
      "name": "Mystical Forest",
      "thumbnailImage": "https://..."
    }
  ],
  "topDesigners": [
    {
      "id": "designer-uuid",
      "name": "Ayşe Demir",
      "avatar": "https://...",
      "rating": 4.9
    }
  ],
  "relatedCategories": [
    {
      "id": "4",
      "name": "Science Fiction",
      "slug": "sci-fi"
    }
  ]
}
```

---

### 12.3. Kategori Oluştur (Admin)

**Endpoint**: `POST /api/v1/categories`  
**Auth**: Gerekli ✅ (Sadece Admin)

---

### 12.4. Kategori Güncelle (Admin)

**Endpoint**: `PUT /api/v1/categories/:id`  
**Auth**: Gerekli ✅ (Sadece Admin)

---

### 12.5. Kategori Sil (Admin)

**Endpoint**: `DELETE /api/v1/categories/:id`  
**Auth**: Gerekli ✅ (Sadece Admin)

---

## 🔍 Arama (Search)

### 13.1. Genel Arama

**Endpoint**: `GET /api/v1/search`  
**Auth**: Opsiyonel (projeler için gerekli)  
**Rate Limit**: 30 istek/dakika

**Açıklama**: Şablonlar, tasarımcılar ve projeler genelinde arama yapar.

**Query Parameters**:
```typescript
{
  q: string;              // Arama kelimesi (min 2 karakter)
  type?: "templates" | "designers" | "projects" | "all";
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
}
```

**Request Örneği**:
```http
GET /api/v1/search?q=fantasy+forest&type=all&page=1&limit=10
```

**Response** (200 OK):
```json
{
  "query": "fantasy forest",
  "results": {
    "templates": {
      "total": 15,
      "items": [
        {
          "id": "template-uuid",
          "name": "Mystical Forest Cover",
          "type": "template",
          "previewImage": "https://...",
          "category": "Fantasy",
          "rating": 4.8,
          "matchScore": 0.95
        }
      ]
    },
    "designers": {
      "total": 3,
      "items": [
        {
          "id": "designer-uuid",
          "name": "Ayşe Demir",
          "type": "designer",
          "avatar": "https://...",
          "specialties": ["Fantasy", "Nature"],
          "rating": 4.9,
          "matchScore": 0.82
        }
      ]
    },
    "projects": {
      "total": 8,
      "items": [
        {
          "id": "project-uuid",
          "name": "My Fantasy Project",
          "type": "project",
          "thumbnail": "https://...",
          "matchScore": 0.76
        }
      ]
    }
  },
  "totalResults": 26,
  "searchTime": 0.127
}
```

**Frontend Universal Search**:
```javascript
function UniversalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery] = useDebounce(query, 500);
  
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null);
      return;
    }
    
    async function search() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          type: 'all',
          limit: '5'
        });
        
        const response = await fetch(
          `https://api.polikrami.com/api/v1/search?${params}`
        );
        
        const data = await response.json();
        setResults(data.results);
      } catch (error) {
        console.error('Arama hatası:', error);
      } finally {
        setLoading(false);
      }
    }
    
    search();
  }, [debouncedQuery]);
  
  return (
    <div className="universal-search">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Şablon, tasarımcı veya proje ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        {loading && <span className="loading-spinner">🔄</span>}
      </div>
      
      {results && (
        <div className="search-results-dropdown">
          {results.templates?.items.length > 0 && (
            <div className="result-section">
              <h4>Şablonlar ({results.templates.total})</h4>
              {results.templates.items.map(item => (
                <SearchResultItem key={item.id} item={item} />
              ))}
            </div>
          )}
          
          {results.designers?.items.length > 0 && (
            <div className="result-section">
              <h4>Tasarımcılar ({results.designers.total})</h4>
              {results.designers.items.map(item => (
                <SearchResultItem key={item.id} item={item} />
              ))}
            </div>
          )}
          
          {results.projects?.items.length > 0 && (
            <div className="result-section">
              <h4>Projeler ({results.projects.total})</h4>
              {results.projects.items.map(item => (
                <SearchResultItem key={item.id} item={item} />
              ))}
            </div>
          )}
          
          <button 
            className="view-all-results"
            onClick={() => window.location.href = `/search?q=${query}`}
          >
            Tüm Sonuçları Gör
          </button>
        </div>
      )}
    </div>
  );
}

// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return [debouncedValue];
}
```

---

### 13.2. Arama Önerileri (Autocomplete)

**Endpoint**: `GET /api/v1/search/suggestions`  
**Auth**: Gerekli değil  
**Rate Limit**: 60 istek/dakika

**Açıklama**: Arama kutusunda otomatik tamamlama önerileri.

**Query Parameters**:
```typescript
{
  q: string;      // Min 2 karakter
  limit?: number; // Default: 10
}
```

**Request Örneği**:
```http
GET /api/v1/search/suggestions?q=fant&limit=10
```

**Response** (200 OK):
```json
{
  "suggestions": [
    "fantasy",
    "fantasy forest",
    "fantasy cover",
    "fantastic",
    "fantasy templates",
    "fantasy designers"
  ]
}
```

**Frontend Autocomplete**:
```javascript
function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    const fetchSuggestions = async () => {
      const response = await fetch(
        `https://api.polikrami.com/api/v1/search/suggestions?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSuggestions(data.suggestions);
    };
    
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);
  
  return (
    <div className="search-autocomplete">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="Ara..."
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => {
                setQuery(suggestion);
                performSearch(suggestion);
              }}
            >
              🔍 {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## 💌 Mesaj Kartları (Message Cards)

### 14.1. Mesaj Kartlarını Listele

**Endpoint**: `GET /api/v1/message-cards`  
**Auth**: Gerekli değil

**Açıklama**: Tüm hazır mesaj kartı tasarımlarını listeler.

**Response** (200 OK):
```json
{
  "messageCards": [
    {
      "id": "card-uuid-1",
      "type": "birthday",
      "name": "Doğum Günü Kartı",
      "description": "Özel doğum günü mesajları için",
      "previewImage": "https://api.polikrami.com/uploads/cards/birthday.jpg",
      "icon": "🎂",
      "maxCharacters": 500,
      "isPopular": true
    },
    {
      "id": "card-uuid-2",
      "type": "anniversary",
      "name": "Yıldönümü Kartı",
      "description": "Yıldönümü kutlamaları için",
      "previewImage": "https://api.polikrami.com/uploads/cards/anniversary.jpg",
      "icon": "💝",
      "maxCharacters": 500,
      "isPopular": true
    }
  ]
}
```

---

### 14.2. Popüler Mesaj Kartları

**Endpoint**: `GET /api/v1/message-cards/popular`  
**Auth**: Gerekli değil

**Açıklama**: En çok kullanılan mesaj kartlarını getirir.

**Response** (200 OK):
```json
{
  "messageCards": [
    {
      "id": "card-uuid",
      "type": "birthday",
      "name": "Doğum Günü Kartı",
      "usageCount": 12345,
      "rating": 4.8
    }
  ]
}
```

---

## ❤️ Beğeniler (Likes)

### 15.1. Beğeni Ekle/Kaldır (Toggle)

**Endpoint**: `POST /api/v1/likes/toggle`  
**Auth**: Gerekli ✅  
**Rate Limit**: 100 beğeni/dakika

**Açıklama**: Mesaj kartını beğenir veya beğeniyi kaldırır.

**Request Body**:
```typescript
{
  messageCardId: string;
}
```

**Request Örneği**:
```json
{
  "messageCardId": "card-uuid-123"
}
```

**Response** (200 OK):
```json
{
  "liked": true,
  "totalLikes": 1234,
  "message": "Beğenildi"
}
```

**Frontend Toggle Like**:
```javascript
async function toggleLike(messageCardId) {
  const accessToken = localStorage.getItem('access_token');
  const csrfToken = localStorage.getItem('csrf_token');
  
  const response = await fetch('https://api.polikrami.com/api/v1/likes/toggle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-CSRF-Token': csrfToken
    },
    credentials: 'include',
    body: JSON.stringify({ messageCardId })
  });
  
  if (!response.ok) throw new Error('Beğeni işlemi başarısız');
  
  return await response.json();
}

// React Like Button
function LikeButton({ messageCardId, initialLikes = 0, initialLiked = false }) {
  const [liked, setLiked] = useState(initialLiked);
  const [totalLikes, setTotalLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  
  async function handleToggle() {
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await toggleLike(messageCardId);
      setLiked(result.liked);
      setTotalLikes(result.totalLikes);
    } catch (error) {
      console.error('Beğeni hatası:', error);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <button 
      className={`like-button ${liked ? 'liked' : ''}`}
      onClick={handleToggle}
      disabled={loading}
    >
      <span className="icon">{liked ? '❤️' : '🤍'}</span>
      <span className="count">{totalLikes}</span>
    </button>
  );
}
```

---

### 15.2. Beğeni Özeti

**Endpoint**: `GET /api/v1/likes/cards/:id/summary`  
**Auth**: Gerekli değil

**Açıklama**: Bir mesaj kartının toplam beğeni sayısını getirir.

**Response** (200 OK):
```json
{
  "messageCardId": "card-uuid",
  "totalLikes": 1234,
  "recentLikes": 45
}
```

---

## 💬 Yorumlar (Comments)

### 16.1. Yorumları Listele

**Endpoint**: `GET /api/v1/comments`  
**Auth**: Gerekli ✅

**Açıklama**: Projedeki yorumları listeler.

**Query Parameters**:
```typescript
{
  projectId: string;      // Gerekli
  layerId?: string;
  status?: "open" | "resolved";
  page?: number;
  limit?: number;
}
```

**Response** (200 OK):
```json
{
  "comments": [
    {
      "id": "comment-uuid",
      "projectId": "project-uuid",
      "layerId": "layer-uuid",
      "authorId": "user-uuid",
      "authorName": "Ahmet Yılmaz",
      "authorAvatar": "https://...",
      "body": "Bu renk çok güzel olmuş!",
      "status": "open",
      "rating": null,
      "createdAt": "2025-01-22T10:00:00.000Z",
      "updatedAt": "2025-01-22T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

### 16.2. Yorum Detayı

**Endpoint**: `GET /api/v1/comments/:id`  
**Auth**: Gerekli ✅

---

### 16.3. Yorum Ekle

**Endpoint**: `POST /api/v1/comments`  
**Auth**: Gerekli ✅

**Request Body**:
```typescript
{
  projectId: string;
  body: string;           // Min 1, Max 2000 karakter
  targetLayerId?: string;
  rating?: number;        // 1-5
}
```

**Response** (201 Created):
```json
{
  "id": "comment-uuid",
  "projectId": "project-uuid",
  "body": "Bu renk çok güzel olmuş!",
  "status": "open",
  "createdAt": "2025-01-22T10:00:00.000Z"
}
```

---

### 16.4. Yorum Güncelle

**Endpoint**: `PUT /api/v1/comments/:id`  
**Auth**: Gerekli ✅ (Yazar veya proje sahibi)

**Request Body**:
```typescript
{
  body?: string;
  status?: "open" | "resolved";
  rating?: number;
}
```

---

### 16.5. Yorum Sil

**Endpoint**: `DELETE /api/v1/comments/:id`  
**Auth**: Gerekli ✅ (Yazar veya proje sahibi)

---

### 16.6. Proje İstatistikleri

**Endpoint**: `GET /api/v1/comments/projects/:projectId/stats`  
**Auth**: Gerekli ✅

**Response** (200 OK):
```json
{
  "total": 45,
  "open": 12,
  "resolved": 33,
  "averageRating": 4.5
}
```

---

## 🔔 Bildirimler (Notifications)

### 17.1. Bildirimlerimi Listele

**Endpoint**: `GET /api/v1/notifications`  
**Auth**: Gerekli ✅

**Query Parameters**:
```typescript
{
  read?: boolean;   // true: okunmuş, false: okunmamış
  page?: number;
  limit?: number;
}
```

**Response** (200 OK):
```json
{
  "notifications": [
    {
      "id": "notif-uuid-1",
      "userId": "user-uuid",
      "type": "order_status_changed",
      "title": "Siparişiniz Kargoya Verildi",
      "message": "TR123456789 takip numaralı kargonuz yolda",
      "data": {
        "orderId": "order-uuid",
        "status": "shipped",
        "trackingNumber": "TR123456789"
      },
      "read": false,
      "readAt": null,
      "createdAt": "2025-01-24T14:00:00.000Z"
    },
    {
      "id": "notif-uuid-2",
      "type": "draft_approved",
      "title": "Taslağınız Onaylandı",
      "message": "Tasarımcınız taslağınızı teslim etti",
      "data": {
        "draftId": "draft-uuid"
      },
      "read": true,
      "readAt": "2025-01-23T10:30:00.000Z",
      "createdAt": "2025-01-23T10:00:00.000Z"
    }
  ],
  "unreadCount": 5,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 128
  }
}
```

**Frontend Notification Center**:
```javascript
function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  
  useEffect(() => {
    loadNotifications();
    
    // Her 30 saniyede bir güncelle
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);
  
  async function loadNotifications() {
    const accessToken = localStorage.getItem('access_token');
    
    const response = await fetch(
      'https://api.polikrami.com/api/v1/notifications?limit=10',
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    
    const data = await response.json();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }
  
  return (
    <div className="notification-center">
      <button 
        className="notification-button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>
      
      {showDropdown && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h4>Bildirimler</h4>
            <button onClick={markAllAsRead}>Tümünü Okundu İşaretle</button>
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty">Bildiriminiz yok</div>
            ) : (
              notifications.map(notif => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onRead={() => markAsRead(notif.id)}
                />
              ))
            )}
          </div>
          
          <div className="dropdown-footer">
            <a href="/notifications">Tüm Bildirimleri Gör</a>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification, onRead }) {
  function handleClick() {
    if (!notification.read) {
      onRead();
    }
    
    // Bildirimin ilgili sayfasına yönlendir
    if (notification.data.orderId) {
      window.location.href = `/orders/${notification.data.orderId}`;
    } else if (notification.data.draftId) {
      window.location.href = `/drafts/${notification.data.draftId}`;
    }
  }
  
  return (
    <div 
      className={`notification-item ${!notification.read ? 'unread' : ''}`}
      onClick={handleClick}
    >
      <div className="notification-icon">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="notification-content">
        <h5>{notification.title}</h5>
        <p>{notification.message}</p>
        <span className="time">{formatTimeAgo(notification.createdAt)}</span>
      </div>
    </div>
  );
}

function getNotificationIcon(type) {
  const icons = {
    order_status_changed: '📦',
    draft_approved: '✅',
    payment_received: '💰',
    message_received: '💬',
    designer_assigned: '👨‍🎨'
  };
  return icons[type] || '🔔';
}
```

---

### 17.2. Bildirimi Okundu İşaretle

**Endpoint**: `PUT /api/v1/notifications/:id/read`  
**Auth**: Gerekli ✅

**Response** (200 OK):
```json
{
  "message": "Bildirim okundu olarak işaretlendi",
  "readAt": "2025-01-25T10:00:00.000Z"
}
```

---

### 17.3. Tüm Bildirimleri Okundu İşaretle

**Endpoint**: `PUT /api/v1/notifications/mark-all-read`  
**Auth**: Gerekli ✅

**Response** (200 OK):
```json
{
  "message": "Tüm bildirimler okundu olarak işaretlendi",
  "count": 15
}
```

---

### 17.4. Bildirimi Sil

**Endpoint**: `DELETE /api/v1/notifications/:id`  
**Auth**: Gerekli ✅

**Response** (200 OK):
```json
{
  "message": "Bildirim silindi"
}
```

---

## 📁 Projeler (Projects)

**Not**: Projeler, iş birliği ve tasarım süreçleri için kullanılan gelişmiş bir özelliktir.

### 18.1. Projelerimi Listele

**Endpoint**: `GET /api/v1/projects`  
**Auth**: Gerekli ✅

**Response** (200 OK):
```json
{
  "projects": [
    {
      "id": "project-uuid",
      "name": "Kitap Kapağı Tasarımım",
      "description": "Fantasy kitabım için kapak",
      "ownerId": "user-uuid",
      "status": "active",
      "createdAt": "2025-01-20T00:00:00.000Z"
    }
  ]
}
```

---

### 18.2. Proje Detayı

**Endpoint**: `GET /api/v1/projects/:id`  
**Auth**: Gerekli ✅

---

### 18.3. Yeni Proje Oluştur

**Endpoint**: `POST /api/v1/projects`  
**Auth**: Gerekli ✅

**Request Body**:
```typescript
{
  name: string;
  description?: string;
}
```

---

### 18.4. Proje Güncelle

**Endpoint**: `PUT /api/v1/projects/:id`  
**Auth**: Gerekli ✅ (Sadece sahip)

---

### 18.5. Proje Sil

**Endpoint**: `DELETE /api/v1/projects/:id`  
**Auth**: Gerekli ✅ (Sadece sahip)

---

### 18.6. Proje Üyelerini Listele

**Endpoint**: `GET /api/v1/projects/:id/members`  
**Auth**: Gerekli ✅

---

### 18.7. Projeye Üye Ekle

**Endpoint**: `POST /api/v1/projects/:id/members`  
**Auth**: Gerekli ✅ (Sadece sahip)

---

### 18.8. Projeden Üye Çıkar

**Endpoint**: `DELETE /api/v1/projects/:id/members/:userId`  
**Auth**: Gerekli ✅ (Sadece sahip)

---

## 🏢 Organizasyonlar (Organizations)

### 19.1. Organizasyonlarımı Listele

**Endpoint**: `GET /api/v1/organizations`  
**Auth**: Gerekli ✅

---

### 19.2. Organizasyon Detayı

**Endpoint**: `GET /api/v1/organizations/:id`  
**Auth**: Gerekli ✅

---

### 19.3. Yeni Organizasyon Oluştur

**Endpoint**: `POST /api/v1/organizations`  
**Auth**: Gerekli ✅

---

### 19.4. Organizasyon Güncelle

**Endpoint**: `PUT /api/v1/organizations/:id`  
**Auth**: Gerekli ✅ (Sadece owner)

---

### 19.5. Organizasyon Sil

**Endpoint**: `DELETE /api/v1/organizations/:id`  
**Auth**: Gerekli ✅ (Sadece owner)

---

### 19.6. Organizasyona Üye Ekle

**Endpoint**: `POST /api/v1/organizations/:id/members`  
**Auth**: Gerekli ✅ (Owner veya admin)

---

### 19.7. Üye Rolünü Güncelle

**Endpoint**: `PUT /api/v1/organizations/:id/members/:userId`  
**Auth**: Gerekli ✅ (Sadece owner)

---

### 19.8. Organizasyondan Üye Çıkar

**Endpoint**: `DELETE /api/v1/organizations/:id/members/:userId`  
**Auth**: Gerekli ✅ (Owner veya admin)

---

## 🔄 İadeler (Returns)

### 20.1. İadelerimi Listele

**Endpoint**: `GET /api/v1/returns`  
**Auth**: Gerekli ✅

**Response** (200 OK):
```json
{
  "returns": [
    {
      "id": "return-uuid",
      "orderId": "order-uuid",
      "status": "pending",
      "reason": "Ürün hasarlı geldi",
      "requestedAt": "2025-01-25T10:00:00.000Z"
    }
  ]
}
```

---

### 20.2. İade Talebi Oluştur

**Endpoint**: `POST /api/v1/returns`  
**Auth**: Gerekli ✅

**Request Body**:
```typescript
{
  orderId: string;
  reason: string;
  images?: string[];  // Ürün fotoğrafları (URL'ler)
}
```

**Response** (201 Created):
```json
{
  "id": "return-uuid",
  "orderId": "order-uuid",
  "status": "pending",
  "reason": "Ürün hasarlı geldi",
  "requestedAt": "2025-01-25T10:00:00.000Z",
  "estimatedProcessTime": "3-5 iş günü"
}
```

---

### 20.3. İade Durumunu Güncelle (Admin)

**Endpoint**: `PUT /api/v1/returns/:id/status`  
**Auth**: Gerekli ✅ (Sadece Admin)

---

## 📧 İletişim (Contact)

### 21.1. İletişim Formu Gönder

**Endpoint**: `POST /api/v1/contact`  
**Auth**: Gerekli değil  
**Rate Limit**: 3 istek/10 dakika

**Açıklama**: İletişim formu gönderimleri.

**Request Body**:
```typescript
{
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
}
```

**Request Örneği**:
```json
{
  "name": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "subject": "Sipariş hakkında soru",
  "message": "Siparişimin kargo takip numarasını alamadım.",
  "phone": "+905551234567"
}
```

**Response** (200 OK):
```json
{
  "message": "Mesajınız alındı. En kısa sürede size dönüş yapılacaktır.",
  "submissionId": "submission-uuid",
  "estimatedResponseTime": "24 saat"
}
```

**Frontend Contact Form**:
```javascript
function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });
    
    try {
      const csrfToken = localStorage.getItem('csrf_token');
      
      const response = await fetch('https://api.polikrami.com/api/v1/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message);
      }
      
      const result = await response.json();
      setStatus({
        type: 'success',
        message: result.message
      });
      
      // Formu temizle
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        phone: ''
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setSubmitting(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <h2>Bize Ulaşın</h2>
      
      {status.message && (
        <div className={`alert alert-${status.type}`}>
          {status.message}
        </div>
      )}
      
      <div className="form-group">
        <label>Ad Soyad *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      
      <div className="form-group">
        <label>E-posta *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Telefon</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          placeholder="+90 555 123 45 67"
        />
      </div>
      
      <div className="form-group">
        <label>Konu *</label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({...formData, subject: e.target.value})}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Mesajınız *</label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          rows="5"
          required
        />
      </div>
      
      <button type="submit" disabled={submitting}>
        {submitting ? 'Gönderiliyor...' : 'Gönder'}
      </button>
    </form>
  );
}
```

---

### 21.2. İletişim Formlarını Listele (Admin)

**Endpoint**: `GET /api/v1/contact/submissions`  
**Auth**: Gerekli ✅ (Sadece Admin)

---

### 21.3. İletişim Formu Durumunu Güncelle (Admin)

**Endpoint**: `PATCH /api/v1/contact/submissions/:id`  
**Auth**: Gerekli ✅ (Sadece Admin)

---

## 📎 Varlıklar (Assets)

### 22.1. Varlıklarımı Listele

**Endpoint**: `GET /api/v1/assets`  
**Auth**: Gerekli ✅

**Response** (200 OK):
```json
{
  "assets": [
    {
      "id": "asset-uuid",
      "type": "image",
      "name": "cover-design.png",
      "url": "https://api.polikrami.com/uploads/assets/cover-design.png",
      "size": 2048576,
      "mimeType": "image/png",
      "createdAt": "2025-01-20T10:00:00.000Z"
    }
  ]
}
```

---

### 22.2. Varlık Detayı

**Endpoint**: `GET /api/v1/assets/:id`  
**Auth**: Gerekli ✅

---

### 22.3. Varlık Sil

**Endpoint**: `DELETE /api/v1/assets/:id`  
**Auth**: Gerekli ✅

---

### 22.4. Depolama İstatistikleri

**Endpoint**: `GET /api/v1/assets/stats`  
**Auth**: Gerekli ✅

**Response** (200 OK):
```json
{
  "totalAssets": 25,
  "totalSize": 52428800,
  "usedSpace": "50 MB",
  "availableSpace": "450 MB",
  "quota": "500 MB"
}
```

---

## ❌ Hata Kodları

### Genel Hata Kodları

| Kod | HTTP Status | Açıklama |
|-----|-------------|----------|
| `VALIDATION_ERROR` | 400 | Gönderilen veri geçersiz |
| `UNAUTHORIZED` | 401 | Kimlik doğrulama gerekli |
| `FORBIDDEN` | 403 | Yetkiniz yok |
| `NOT_FOUND` | 404 | Kaynak bulunamadı |
| `CONFLICT` | 409 | Çakışma (örn: email zaten kayıtlı) |
| `RATE_LIMIT_EXCEEDED` | 429 | Çok fazla istek |
| `INTERNAL_ERROR` | 500 | Sunucu hatası |

### Auth Hata Kodları

| Kod | Açıklama |
|-----|----------|
| `EMAIL_ALREADY_EXISTS` | Email zaten kullanılıyor |
| `INVALID_CREDENTIALS` | Email veya şifre hatalı |
| `ACCOUNT_LOCKED` | Hesap kilitli |
| `TOKEN_EXPIRED` | Token süresi dolmuş |
| `TOKEN_INVALID` | Geçersiz token |
| `EMAIL_NOT_VERIFIED` | Email doğrulanmamış |

### Payment Hata Kodları

| Kod | Açıklama |
|-----|----------|
| `INSUFFICIENT_BALANCE` | Yetersiz bakiye |
| `PAYMENT_FAILED` | Ödeme başarısız |
| `CARD_DECLINED` | Kart reddedildi |
| `INVALID_CARD` | Geçersiz kart bilgileri |

### Hata İşleme Örneği

```javascript
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, options);
    
    if (!response.ok) {
      const error = await response.json();
      
      switch (error.error.code) {
        case 'VALIDATION_ERROR':
          // Form validasyon hatalarını göster
          showValidationErrors(error.error.details);
          break;
          
        case 'UNAUTHORIZED':
          // Token yenilemeyi dene
          await refreshAccessToken();
          // Retry
          return apiCall(endpoint, options);
          
        case 'RATE_LIMIT_EXCEEDED':
          // Kullanıcıya beklemesi gerektiğini söyle
          showRateLimitError();
          break;
          
        case 'EMAIL_ALREADY_EXISTS':
          showError('Bu email adresi zaten kayıtlı');
          break;
          
        default:
          showError(error.error.message);
      }
      
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

---

## ✨ Best Practices

### 1. Authentication & Authorization

```javascript
// ✅ Token yönetimi için helper class
class AuthManager {
  static getAccessToken() {
    return localStorage.getItem('access_token');
  }
  
  static getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }
  
  static setTokens(accessToken, refreshToken) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
  
  static clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
  
  static async refreshToken() {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.clearTokens();
      window.location.href = '/login';
      return null;
    }
    
    try {
      const response = await fetch('https://api.polikrami.com/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      if (!response.ok) {
        throw new Error('Refresh failed');
      }
      
      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken);
      
      return data.accessToken;
    } catch (error) {
      this.clearTokens();
      window.location.href = '/login';
      return null;
    }
  }
}
```

---

### 2. API Client

```javascript
// ✅ Merkezi API client
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Auth header ekle
    const accessToken = AuthManager.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // CSRF token ekle (POST/PUT/DELETE için)
    if (['POST', 'PUT', 'DELETE'].includes(options.method)) {
      headers['X-CSRF-Token'] = localStorage.getItem('csrf_token');
    }
    
    try {
      let response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });
      
      // Token expired, refresh dene
      if (response.status === 401 && !options._retry) {
        await AuthManager.refreshToken();
        
        // Retry with new token
        return this.request(endpoint, { ...options, _retry: true });
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(error.error);
      }
      
      // Empty response check
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({
        code: 'NETWORK_ERROR',
        message: 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.'
      });
    }
  }
  
  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }
  
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

class ApiError extends Error {
  constructor(error) {
    super(error.message);
    this.code = error.code;
    this.details = error.details;
  }
}

// Kullanım
const api = new ApiClient('https://api.polikrami.com/api/v1');

// Örnek
async function getMyOrders() {
  try {
    const data = await api.get('/orders', { page: 1, limit: 10 });
    return data.orders;
  } catch (error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      alert('Çok fazla istek gönderdiniz. Lütfen bekleyin.');
    } else {
      alert(error.message);
    }
  }
}
```

---

### 3. Form Validation

```javascript
// ✅ Form validasyon helper
class FormValidator {
  static email(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  static password(password) {
    // Min 8 karakter, 1 büyük, 1 küçük, 1 rakam
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  }
  
  static phone(phone) {
    // +90XXXXXXXXXX formatı
    const regex = /^\+90[0-9]{10}$/;
    return regex.test(phone);
  }
  
  static required(value) {
    return value !== null && value !== undefined && value.trim() !== '';
  }
  
  static minLength(value, min) {
    return value.length >= min;
  }
  
  static maxLength(value, max) {
    return value.length <= max;
  }
}
```

---

### 4. Error Handling

```javascript
// ✅ Global error handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // API hatalarını yakala
  if (event.reason instanceof ApiError) {
    showToast(event.reason.message, 'error');
    event.preventDefault();
  }
});

// Toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

---

### 5. Loading States

```javascript
// ✅ Loading state yönetimi
function useAsyncData(fetchFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);
  
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  return { data, loading, error, refetch };
}

// Kullanım
function OrderList() {
  const { data, loading, error, refetch } = useAsyncData(() => 
    api.get('/orders')
  );
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  
  return <div>{/* Render data */}</div>;
}
```

---

### 6. Caching

```javascript
// ✅ Basit cache mekanizması
class Cache {
  constructor(ttl = 5 * 60 * 1000) { // 5 dakika
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }
  
  clear() {
    this.cache.clear();
  }
}

const cache = new Cache();

async function getCachedData(key, fetcher) {
  const cached = cache.get(key);
  if (cached) return cached;
  
  const data = await fetcher();
  cache.set(key, data);
  return data;
}
```

---

### 7. Optimistic Updates

```javascript
// ✅ Optimistic update örneği
async function toggleLikeOptimistic(messageCardId, currentState) {
  // UI'ı hemen güncelle
  const newState = !currentState.liked;
  const newCount = currentState.totalLikes + (newState ? 1 : -1);
  
  // Optimistic update
  updateUI({ liked: newState, totalLikes: newCount });
  
  try {
    // API call
    const result = await api.post('/likes/toggle', { messageCardId });
    
    // Gerçek veriyle güncelle
    updateUI(result);
  } catch (error) {
    // Hata olursa geri al
    updateUI(currentState);
    showToast('Beğeni işlemi başarısız', 'error');
  }
}
```

---

## 🎯 Özet

Bu dökümantasyon, Polikrami Cover Backend API'sinin tüm endpoint'lerini, parametrelerini, response formatlarını ve frontend entegrasyonu için gerekli tüm bilgileri içermektedir.

### Önemli Noktalar:

1. **Authentication**: JWT token tabanlı, 15 dakikalık access token, 7 günlük refresh token
2. **CSRF Protection**: State-changing isteklerde `X-CSRF-Token` header'ı gerekli
3. **Rate Limiting**: Her endpoint için farklı limitler var, header'lardan kontrol edilebilir
4. **Error Handling**: Standart error response formatı, HTTP status code'lar anlamlı
5. **File Uploads**: multipart/form-data ile, max 10MB
6. **Pagination**: Standart sayfalama sistemi (page, limit, total)
7. **Filtering & Sorting**: Query parameters ile filtreleme ve sıralama

### Destek

Sorularınız için:
- **Email**: support@polikrami.com
- **API Docs**: https://api.polikrami.com/docs
- **Status Page**: https://status.polikrami.com

---

**Son Güncelleme**: Ocak 2025  
**API Version**: 1.0  
**Dökümantasyon Versiyonu**: 1.0.0



"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEMPLATES = void 0;
exports.TEMPLATES = [
    {
        id: 'storybook-tr',
        name: 'Masalsı Çocuk Kitabı Kapağı',
        description: 'Masalsı, yumuşak ışık, hikâye kitabı dokusu; başlık için üstte boş alan.',
        ratio: '2:3',
        fields: [
            { key: 'baslik', label: 'Başlık', type: 'string', hint: 'AI’ya gönderilmez', required: false },
            { key: 'duygu', label: 'Duygu', type: 'enum', options: ['neşeli', 'sakin', 'gizemli', 'masalsı', 'macera'], required: true },
            { key: 'yasGrubu', label: 'Yaş Grubu', type: 'enum', options: ['3-5', '6-8', '9-12'], required: true },
            { key: 'renkPaleti', label: 'Renk Paleti', type: 'enum', options: ['mor-yeşil', 'pastel', 'sıcak tonlar', 'soğuk tonlar', 'canlı'], required: true },
            { key: 'anaSahne', label: 'Ana Sahne', type: 'string', hint: 'örn: elinde sarı balon tutan çocuklar', required: true },
            { key: 'arkaPlan', label: 'Arka Plan', type: 'string', hint: 'örn: mor ve yeşil renkte bir gökyüzü', required: true },
            { key: 'stil', label: 'Stil', type: 'enum', options: ['akvarel', 'storybook illüstrasyon', 'flat', 'vintage', 'modern illüstrasyon'], required: true },
            { key: 'kompozisyon', label: 'Kompozisyon', type: 'enum', options: ['üstte başlık alanı', 'ortalanmış konu', 'üçte birler'], required: true },
            { key: 'detaySeviyesi', label: 'Detay Seviyesi', type: 'enum', options: ['düşük', 'orta', 'yüksek'], required: true },
        ],
        defaults: {
            negative: 'metin, harf, filigran, watermark, logo, bulanık, düşük çözünürlük, hatalı anatomi, ek parmaklar, nsfw',
            params: { width: 1024, height: 1536, steps: 30, guidance: 6.5, model: 'sdxl' },
        },
        render: (f) => `Masalsı çocuk kitabı kapağı; yaş grubu: ${f['yasGrubu']}, duygu: ${f['duygu']}. Arka plan: ${f['arkaPlan']}. Renk paleti: ${f['renkPaleti']}. Ana sahne: ${f['anaSahne']}. Kompozisyon: başlık için üst kısımda net boş alan bırakılmış, konu dengeli ve odaklı. Stil: ${f['stil']}, yumuşak ışık, hikâye kitabı dokusu, tutarlı anatomi, ${f['detaySeviyesi']} detay.`,
    },
    {
        id: 'minimalist-poster',
        name: 'Minimalist Poster',
        description: 'Temiz, yüksek kontrast, şık negatif alan; az metin için uygun.',
        ratio: '2:3',
        fields: [
            { key: 'tema', label: 'Tema', type: 'string', hint: 'örn: dağ silueti', required: true },
            { key: 'renk', label: 'Renk', type: 'enum', options: ['siyah beyaz', 'kırmızı', 'mavi', 'yeşil'], required: true },
            { key: 'doku', label: 'Doku', type: 'enum', options: ['yok', 'grain', 'kâğıt'], required: true },
        ],
        defaults: {
            negative: 'metin, watermark, logo, karmaşa, kalabalık, düşük çözünürlük, nsfw',
            params: { width: 1024, height: 1536, steps: 25, guidance: 5.5, model: 'sdxl' },
        },
        render: (f) => `Minimalist poster, ${f['tema']}; ${f['renk']} ağırlıkta; ${f['doku']} dokulu, yüksek kontrast, çok temiz negatif alan, kusursuz kenarlar.`,
    },
    {
        id: 'vintage-collage',
        name: 'Vintage Kolaj',
        description: 'Eskitilmiş kâğıt, yırtık kenarlar, retro fotoğraflar ve tipografi hissi.',
        ratio: '2:3',
        fields: [
            { key: 'konu', label: 'Konu', type: 'string', required: true },
            { key: 'dönem', label: 'Dönem', type: 'enum', options: ['60lar', '70ler', '80ler'], required: true },
            { key: 'renkPaleti', label: 'Renk Paleti', type: 'enum', options: ['sepya', 'pastel', 'soluk'], required: true },
        ],
        defaults: {
            negative: 'modern parıltı, dijital aşırı doygun, watermark, nsfw',
            params: { width: 1024, height: 1536, steps: 35, guidance: 7.0, model: 'sdxl' },
        },
        render: (f) => `Vintage kolaj tarzında ${f['konu']}; ${f['dönem']} dönemi, ${f['renkPaleti']} renk paleti; eskitilmiş kâğıt dokusu, yırtık kenarlar, retro fotoğraf ve tipografi hissi, ince gren.`,
    },
];

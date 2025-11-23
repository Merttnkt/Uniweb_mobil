# Uniweb Mobile - Akilli Ders Calisma Asistani

Uniweb Mobile, ogrencilerin sinav hazirlik surecini optimize etmelerine yardimci olan yapay zeka destekli bir mobil uygulamadir. React Native ve Expo ile gelistirilmistir.

## Ozellikler

- **Dashboard**: Gunluk calisma ozeti, yaklasan sinavlar ve ilerleme durumu
- **Sinav Takibi**: Sinavlarinizi ekleyin ve sonuclarinizi takip edin
- **Sinav Analizi**: Detayli performans analizi ve grafikleri
- **Net Takibi**: Ders bazinda net sayilarinizi izleyin
- **AI Onerileri**: Gemini AI destekli kisisellestirilmis calisma tavsiyeleri
- **Otomatik Program**: Yapay zeka ile optimize edilmis calisma programi olusturma
- **Calisma Plani**: Gunluk ve haftalik calisma planlarinizi yonetin
- **Istatistikler**: Detayli calisma istatistikleri ve grafikler
- **Notlar**: Ders notlarinizi kaydedin ve duzenleyin
- **Universite Hedefi**: Hedef universitenizi belirleyin ve takip edin
- **Video Takibi**: Izlediginiz egitim videolarini takip edin
- **Ornek Sorular**: Pratik yapabileceginiz ornek sorular

## Teknolojiler

- **Frontend**: React Native, Expo SDK 53
- **Styling**: NativeWind (TailwindCSS)
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (Authentication & Database)
- **AI**: Google Gemini API
- **Charts**: Victory Native, React Native Chart Kit
- **State Management**: React Context API

## Kurulum

### Gereksinimler

- Node.js (v18 veya uzeri)
- npm veya yarn
- Expo CLI
- Android Studio (Android icin) veya Xcode (iOS icin)

### Adimlar

1. Repoyu klonlayin:

   ```bash
   git clone https://github.com/kullanici-adi/uniweb-mobile.git
   cd uniweb-mobile
   ```

2. Bagimliliklari yukleyin:

   ```bash
   npm install
   ```

3. Ortam degiskenlerini ayarlayin:

   ```bash
   cp .env.example .env
   ```

   `.env` dosyasini duzenleyip kendi API anahtarlarinizi ekleyin:

   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

4. Uygulamayi baslatin:

   ```bash
   npx expo start
   ```

## Supabase Kurulumu

1. [Supabase](https://supabase.com) uzerinde yeni bir proje olusturun
2. Asagidaki tablolari olusturun:
   - `profiles` - Kullanici profilleri
   - `subjects` - Dersler
   - `exams` - Sinavlar
   - `exam_subjects` - Sinav ders sonuclari
   - `study_sessions` - Calisma oturumlari

3. Authentication ayarlarindan Email/Password girisini aktif edin

## Proje Yapisi

```
├── app/                    # Expo Router sayfalari
│   ├── (drawer)/          # Drawer navigation ekranlari
│   │   ├── index.tsx      # Dashboard
│   │   ├── examTracking.tsx
│   │   ├── examAnalysis.tsx
│   │   ├── statistics.tsx
│   │   └── ...
│   ├── login.tsx          # Giris sayfasi
│   ├── register.tsx       # Kayit sayfasi
│   └── _layout.tsx        # Root layout
├── components/            # Yeniden kullanilabilir bilesenler
├── contexts/              # React Context (Auth, UserData)
├── hooks/                 # Custom React hooks
├── lib/                   # Yardimci fonksiyonlar
│   ├── supabase.ts       # Supabase client
│   └── aiService.ts      # Gemini AI servisi
└── constants/            # Sabitler ve tema
```

## Iletisim

Sorulariniz veya onerileriniz icin issue acabilirsiniz.

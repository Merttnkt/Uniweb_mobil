import * as SecureStore from 'expo-secure-store';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const API_KEY_STORAGE_KEY = 'AI_API_KEY';
let genAI: GoogleGenerativeAI | null = null;

// API anahtarını güvenli bir şekilde saklar
export const setApiKey = async (apiKey: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, apiKey);
    // Yeni anahtar ayarlandığında genAI örneğini yeniden başlat
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('API Key stored and AI client initialized.');
  } catch (error) {
    console.error('Failed to store API key:', error);
    throw error;
  }
};

// Saklanan API anahtarını alır
export const getApiKey = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to retrieve API key:', error);
    return null;
  }
};

// AI istemcisini başlatır
const initializeAI = async () => {
  if (genAI) return;
  const apiKey = await getApiKey();
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  } else {
    // .env dosyasından da kontrol edebiliriz
    const envApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if(envApiKey){
        genAI = new GoogleGenerativeAI(envApiKey);
        await setApiKey(envApiKey); // Güvenli depolamaya da kaydet
    } else {
        throw new Error('API anahtarı bulunamadı. Lütfen ayarlardan ekleyin.');
    }
  }
};

// Genel AI çağrı fonksiyonu
const callAI = async (prompt: string): Promise<string> => {
  await initializeAI();
  if (!genAI) {
    throw new Error('AI client could not be initialized.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Gemini API call failed:', error);
    if (error.message.includes('API key not valid')) {
        throw new Error('Geçersiz API Anahtarı. Lütfen kontrol edin.');
    }
    throw new Error('Yapay zeka ile iletişim kurulamadı.');
  }
};

// 1. Çalışma Önerileri
export const getStudyRecommendations = async (performance: any[], recentActivity: any): Promise<string> => {
  const performanceString = performance.map(p => `${p.name}: ${p.correct}/${p.total} doğru`).join(', ');
  const prompt = `
    Bir öğrenci koçu olarak, aşağıdaki sınav performans verilerine dayanarak kişiselleştirilmiş bir çalışma planı oluştur.
    
    Veriler: ${performanceString}
    
    Analizini Markdown formatında, aşağıdaki başlıklarla sun:
    
    ### **Genel Durum Değerlendirmesi**
    Öğrencinin genel performansını özetle. Hangi derslerde güçlü, hangilerinde zayıf olduğunu belirt.
    
    ### **Öncelikli Dersler**
    En çok odaklanılması gereken 2-3 dersi belirle ve nedenlerini açıkla.
    
    ### **Haftalık Çalışma Stratejisi**
    - **Zayıf Dersler İçin:** Konu tekrarı ve bol soru çözümünü vurgula. Hangi konulara öncelik vermesi gerektiğini söyle.
    - **Güçlü Dersler İçin:** Mevcut seviyeyi korumak için ne yapması gerektiğini belirt (örn: deneme çözümü, zor soru bankaları).
    
    ### **Motivasyon Notu**
    Öğrenciyi motive edecek kısa ve olumlu bir mesajla bitir.
  `;
  return callAI(prompt);
};

// 2. Sınav Stratejisi
export const getExamStrategy = async (examHistory: any[], subjectPerformance: any[]): Promise<string> => {
    const performanceString = subjectPerformance.map(p => `${p.name}: Son Net: ${p.net.toFixed(2)}, Trend: ${p.trend}`).join('\n');
    const prompt = `
      Bir sınav stratejisti olarak, öğrencinin derslerdeki net trendlerine göre bir deneme sınavı stratejisi oluştur.

      Ders Performansları:
      ${performanceString}

      Stratejiyi Markdown formatında ve şu başlıklarla hazırla:

      ### **Sınava Başlangıç**
      Hangi dersten başlamanın en mantıklı olduğunu (en güçlü veya en özgüvenli olduğu ders) ve nedenini açıkla.

      ### **Zaman Yönetimi**
      - Hangi derslere ne kadar süre ayırması gerektiğini öner.
      - "Turlama Tekniği" gibi yöntemleri kullanmasını tavsiye et (zor soruları sona bırakma).

      ### **Zor Anlar İçin Taktikler**
      - Zor bir soruyla karşılaştığında ne yapmalı? (Boş bırakıp devam etmenin önemini vurgula)
      - Panik anında nasıl sakin kalabilir?

      ### **Genel Tavsiye**
      Sınav anı için genel bir tavsiye ile bitir.
    `;
    return callAI(prompt);
};

// 3. Hata Analizi
export const getErrorAnalysis = async (lastExam: any): Promise<string> => {
    const subjectsString = lastExam.exam_subjects.map((s: any) => 
        `${s.name || s.subject_id}: ${s.correct}D, ${s.incorrect}Y, ${s.empty}B, Net: ${s.net.toFixed(2)}`
    ).join('\n');

    const prompt = `
      Bir ölçme ve değerlendirme uzmanı olarak, öğrencinin son sınavındaki hata analizini yap.

      Son Sınav Sonuçları (${lastExam.name}):
      ${subjectsString}

      Analizini Markdown formatında ve şu başlıklarla yap:

      ### **Genel Bakış**
      Sınavın genel netini ve en başarılı/başarısız olunan dersleri vurgula.

      ### **Detaylı Hata Analizi**
      - En çok yanlış yapılan dersleri belirle. Bu yanlışların olası nedenlerini (bilgi eksikliği, dikkat hatası, zaman yetersizliği vb.) yorumla.
      - Boş bırakılan soruların yoğunlaştığı dersler varsa, bunun nedenlerini sorgula (konu bilinmiyor mu, süre mi yetmedi?).

      ### **Aksiyon Planı**
      - **En Çok Yanlış Yapılan Ders İçin:** Hataları azaltmak için ne yapmalı? (örn: "'${lastExam.exam_subjects.reduce((a:any, b:any) => a.incorrect > b.incorrect ? a : b).name}' dersinde konu tekrarı yapmalısın.")
      - **Genel Öneri:** Gelecek sınavlarda benzer hataları önlemek için genel bir tavsiye ver.
    `;
    return callAI(prompt);
};

import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { supabase } from '../lib/supabase'; // Supabase client'ınızın doğru yolda olduğundan emin olun
import { useAuth } from './AuthContext'; // AuthContext'inizin doğru yolda olduğundan emin olun

// 1. Supabase şemasıyla uyumlu güncel tipler

// `subjects` tablosundan
export type Subject = {
  id: string;
  name: string;
  color: string;
  question_count: number; // Eklendi
};

// `exam_subjects` tablosundan
export type ExamSubjectResult = {
  subject_id: string;
  correct: number;
  incorrect: number;
  empty: number;
  net?: number; // Net puanı (doğru - yanlış * 0.25)
};

// `exams` tablosundan, iç içe sonuçlarla birlikte
export type Exam = {
  id: string;
  name: string;
  date: string;
  score: number;
  max_score: number;
  created_at?: string; // Sınavın oluşturulma tarihi (ISO string), opsiyonel olabilir
  exam_subjects: ExamSubjectResult[]; // Supabase'den gelen iç içe sonuçlar
};

// Kullanıcı için ana veri yapısı
// `questions` tablosundan (veya ilgili veri kaynağından)
export type Question = {
  id: string;
  subjectId: string;
  topicId?: string; // Konu ID'si, opsiyonel olabilir
  correct: boolean;
  // Soru metni, seçenekler, açıklama gibi ek alanlar eklenebilir
};

// `study_sessions` tablosundan

export type StudySession = {
  id: string;
  date: string;
  subjectId: string;
  duration: number; // in minutes
  notes?: string;
};

export type UserData = {
  subjects: Subject[];
  exams: Exam[];
  studySessions: StudySession[];
  targetExamDate: string | null;
  streak: number;
  questions: Question[];
};

// Context tarafından sağlanacak olan tip
export interface UserDataContextType {
  userData: UserData; // Keep for full access if needed
  subjects: Subject[];
  studySessions: StudySession[];
  loading: boolean;
  error: Error | null;
  user: any; // Auth user object
  fetchData: () => Promise<void>;
  addExam: (examData: Omit<Exam, 'id' | 'exam_subjects' | 'score' | 'max_score'> & { score: number; max_score: number; subjects: (Omit<ExamSubjectResult, 'subject_id'> & { subject_id: string })[] }) => Promise<void>;
  addStudySession: (sessionData: Omit<StudySession, 'id'>) => Promise<void>;
  updateStudySession: (sessionId: string, sessionData: Partial<Omit<StudySession, 'id'>>) => Promise<void>;
  getTodaysStudyTime: () => number;
  getSubjectPerformance: (subjectId: string) => { correct: number; total: number };
  getSubjectNetPerformance: (subjectId: string) => { net: number; trend: 'up' | 'down' | 'stable'; percentage: number; maxNet: number };
}

// Context'i oluştur
const UserDataContext = createContext<UserDataContextType | undefined>(
  undefined
);

// Provider bileşeni
const calculateStreak = (sessions: StudySession[]): number => {
  if (!sessions || sessions.length === 0) return 0;

  const sessionDates = sessions
    .map(session => session.date.split('T')[0]) // YYYY-MM-DD formatında tarihleri al
    .filter((date, index, self) => self.indexOf(date) === index) // Benzersiz tarihler
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // En yeniden eskiye sırala

  if (sessionDates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecentSessionDate = new Date(sessionDates[0]);
  mostRecentSessionDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - mostRecentSessionDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    // En son çalışma dünden daha eski, seri 0
    return 0;
  }

  // En son çalışma bugün veya dün ise seri başlar
  streak = 1;
  if (sessionDates.length > 1) {
    for (let i = 0; i < sessionDates.length - 1; i++) {
      const currentDay = new Date(sessionDates[i]);
      currentDay.setHours(0,0,0,0);
      const previousDay = new Date(sessionDates[i+1]);
      previousDay.setHours(0,0,0,0);

      const dayDifference = (currentDay.getTime() - previousDay.getTime()) / (1000 * 60 * 60 * 24);

      if (dayDifference === 1) {
        streak++;
      } else {
        // Ardışıklık bozuldu
        break;
      }
    }
  }
  return streak;
};

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(); // Oturum açmış kullanıcıyı al
  const [userData, setUserData] = useState<UserData>({ subjects: [], exams: [], studySessions: [], questions: [], targetExamDate: null, streak: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setUserData({ subjects: [], exams: [], studySessions: [], questions: [], targetExamDate: null, streak: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Dersleri ve sınavları paralel olarak çek
      const [subjectsResponse, examsResponse, studySessionsResponse, profileResponse] = await Promise.all([
        supabase.from('subjects').select('id, name, color, question_count').eq('user_id', user.id),
        supabase.from('exams').select('*, exam_subjects(*)').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('study_sessions').select('id, date, subject_id, duration, notes').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('profiles').select('target_exam_date').eq('id', user.id).single()
      ]);

      if (subjectsResponse.error) throw subjectsResponse.error;
      if (examsResponse.error) throw examsResponse.error;
      if (studySessionsResponse.error) throw studySessionsResponse.error;
      // profileResponse (4. eleman Promise.all'dan) zaten mevcut ve yukarıda tanımlı.
      // Hata kontrolü ve veri işleme:
      let effectiveTargetExamDate: string | null = null;
      const profileData = profileResponse?.data as { target_exam_date: string | null } | null;

      if (profileResponse?.error && (profileResponse.error as any).code !== 'PGRST116') { 
        console.warn("Profil verisi (target_exam_date) çekilirken bir sorun oluştu ancak devam ediliyor:", profileResponse.error.message);
      } else {
        effectiveTargetExamDate = profileData?.target_exam_date || null;
      }

      if (!effectiveTargetExamDate) {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        effectiveTargetExamDate = defaultDate.toISOString().split('T')[0]; // YYYY-MM-DD formatında
        console.log(`[UserDataContext] Veritabanından target_exam_date alınamadı veya null. Varsayılan hedef tarih kullanılıyor: ${effectiveTargetExamDate}`);
      }

      setUserData({
        subjects: subjectsResponse.data || [],
        exams: (examsResponse.data as Exam[]) || [],
        studySessions: (studySessionsResponse.data?.map(s => ({...s, subjectId: s.subject_id})) as StudySession[]) || [],
        targetExamDate: effectiveTargetExamDate,
        streak: calculateStreak((studySessionsResponse.data?.map(s => ({ ...s, subjectId: s.subject_id })) as StudySession[]) || []),
        questions: [], // Add this line
      });
      console.log('[UserDataContext] Setting targetExamDate to:', effectiveTargetExamDate);
    } catch (e) {
      setError(e as Error);
      console.error('Kullanıcı verileri çekilirken hata oluştu:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Yeni sınav ekleme fonksiyonu
  const addExam = async (examData: Omit<Exam, 'id' | 'exam_subjects' | 'score' | 'max_score'> & { score: number; max_score: number; subjects: (Omit<ExamSubjectResult, 'subject_id'> & { subject_id: string })[] }) => {
    if (!user) throw new Error('Kullanıcı oturumu açık değil');

    // 1. Ana sınav kaydını ekle
    const { data: newExam, error: examError } = await supabase
      .from('exams')
      .insert({
        user_id: user.id,
        name: examData.name,
        date: examData.date,
        score: examData.score,
        max_score: examData.max_score,
      })
      .select()
      .single();

    if (examError) throw examError;
    if (!newExam) throw new Error('Sınav oluşturulamadı');

    // 2. Ders sonuçlarını hazırla ve ekle
    const subjectResultsData = examData.subjects.map(sub => {
      const correct = sub.correct || 0;
      const incorrect = sub.incorrect || 0;
      const net = parseFloat((correct - (incorrect * 0.25)).toFixed(2));
      return {
        exam_id: newExam.id,
        subject_id: sub.subject_id,
        user_id: user.id,
        correct: correct,
        incorrect: incorrect,
        empty: sub.empty || 0,
        net: net, // Hesaplanan net puanı ekle
      };
    });

    const { error: subjectsError } = await supabase
      .from('exam_subjects')
      .insert(subjectResultsData);

    if (subjectsError) {
      console.error('Ders sonuçları eklenirken hata oluştu, ancak sınav oluşturuldu:', newExam.id);
      throw subjectsError;
    }

    // 3. UI'ı güncellemek için verileri yeniden çek
    await fetchData();
  };

    const addStudySession = async (sessionData: Omit<StudySession, 'id'>) => {
    if (!user) throw new Error('Kullanıcı oturumu açık değil');

    const { error } = await supabase.from('study_sessions').insert({
      user_id: user.id,
      date: sessionData.date,
      subject_id: sessionData.subjectId,
      duration: sessionData.duration,
      notes: sessionData.notes,
    });

    if (error) {
      throw error;
    }

    await fetchData();
  };

  const updateStudySession = async (sessionId: string, sessionData: Partial<Omit<StudySession, 'id'>>) => {
    if (!user) throw new Error('Kullanıcı oturumu açık değil');

    const { subjectId, ...rest } = sessionData;
    const dbData: { [key: string]: any } = { ...rest };
    if (subjectId) {
      dbData.subject_id = subjectId;
    }

    const { error } = await supabase
      .from('study_sessions')
      .update(dbData)
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    await fetchData();
  };



  const getTodaysStudyTime = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatında bugünün tarihi
    const todaysSessions = userData.studySessions.filter(session => session.date.startsWith(today));
    const totalMinutes = todaysSessions.reduce((sum, session) => sum + session.duration, 0);
    return totalMinutes;
  }, [userData.studySessions]);

  const getSubjectPerformance = useCallback((subjectId: string) => {
    let correct = 0;
    let total = 0;
    userData.exams.forEach(exam => {
      exam.exam_subjects.forEach(es => {
        if (es.subject_id === subjectId) {
          correct += es.correct;
          total += es.correct + es.incorrect + es.empty;
        }
      });
    });
    return { correct, total };
  }, [userData.exams]);

  const getSubjectNetPerformance = useCallback((subjectId: string) => {
    const subjectExams = userData.exams
      .map(exam => ({
        ...exam,
        exam_subjects: exam.exam_subjects.filter(sub => sub.subject_id === subjectId)
      }))
      .filter(exam => exam.exam_subjects.length > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // En son sınav başta

    if (subjectExams.length === 0 || !subjectExams[0].exam_subjects[0]?.net) {
      return { net: 0, trend: 'stable' as const, percentage: 0, maxNet: 0 };
    }

    const latestNet = subjectExams[0].exam_subjects[0].net || 0;
    let trend: 'up' | 'down' | 'stable' = 'stable';

    if (subjectExams.length > 1 && subjectExams[1].exam_subjects[0]?.net) {
      const previousNet = subjectExams[1].exam_subjects[0].net || 0;
      if (latestNet > previousNet) trend = 'up';
      else if (latestNet < previousNet) trend = 'down';
    }
    
    // Max net ve percentage için daha fazla bilgiye ihtiyaç var.
    // Şimdilik varsayılan değerler veya basit hesaplamalar kullanılabilir.
    // Örneğin, bir dersteki soru sayısı biliniyorsa maxNet hesaplanabilir.
    // TYT Matematik için 40 soru varsa maxNet = 40 gibi.
    // Bu bilgi `subjects` tablosunda veya başka bir yerde tutulabilir.
    const maxPossibleNetForSubject = 40; // Örnek: TYT Matematik için 40 net
    const percentage = maxPossibleNetForSubject > 0 ? (latestNet / maxPossibleNetForSubject) * 100 : 0;

    return { net: latestNet, trend, percentage: Math.max(0, Math.min(100, percentage)), maxNet: maxPossibleNetForSubject };
  }, [userData.exams]);

  const contextValue = useMemo(() => ({
    userData,
    subjects: userData.subjects,
    studySessions: userData.studySessions,
    questions: userData.questions,
    loading,
    error,
    user,
    fetchData,
    addExam,
    addStudySession,
    updateStudySession,
    getTodaysStudyTime,
    getSubjectPerformance,
    getSubjectNetPerformance,
  }), [userData, loading, error, user, fetchData, addExam, addStudySession, updateStudySession, getTodaysStudyTime, getSubjectPerformance, getSubjectNetPerformance, userData.questions]);

  return (
    <UserDataContext.Provider value={contextValue}>
      {children}
    </UserDataContext.Provider>
  );
}

// Context'i kullanmak için özel hook
export function useUserData() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData, UserDataProvider içinde kullanılmalıdır');
  }
  return context;
}

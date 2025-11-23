import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
// Removed LinearGradient import
import Feather from 'react-native-vector-icons/Feather';
import { useUserData, Exam, Subject } from '../../contexts/UserDataContext';

// Components
import Card from './Card';
import { CardContent, CardHeader } from './Card';
import StatCard from './StatCard';
import ProgressBar from './ProgressBar';



const Dashboard: React.FC = () => {
  // --- VERİ VE MANTIK BÖLÜMÜ (DEĞİŞİKLİK YOK) ---
  const {
    userData,
    getTodaysStudyTime,
    getSubjectNetPerformance,
  } = useUserData();

  const today = new Date();
  let daysLeftForDisplay: number | null = null;

  if (userData.targetExamDate) {
    const targetExamD = new Date(userData.targetExamDate);
    // Ensure the date string results in a valid Date object
    if (!isNaN(targetExamD.getTime())) {
      // Calculate days left from the start of today to the start of the target exam day
      const targetExamStartOfDay = new Date(targetExamD.getFullYear(), targetExamD.getMonth(), targetExamD.getDate());
      const todayStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      daysLeftForDisplay = Math.ceil((targetExamStartOfDay.getTime() - todayStartOfDay.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  const todaysStudyTime = getTodaysStudyTime();
  const dailyGoal = 240; // 4 saat (dakika)
  const completionPercentage = Math.min(100, Math.round((todaysStudyTime / dailyGoal) * 100));

  const lastExam = userData.exams.length > 0
    ? userData.exams.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  const upcomingExams = userData.exams
    .filter((exam) => {
      const examDate = new Date(exam.date);
      const diffTime = examDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const weakSubjects = userData.subjects
    .map((subject) => ({
      ...subject,
      performance: getSubjectNetPerformance(subject.id),
    }))
    .filter((subject) => subject.performance.maxNet > 0 && subject.performance.percentage < 60)
    .sort((a, b) => a.performance.percentage - b.performance.percentage)
    .slice(0, 2);

  // --- RENDER BÖLÜMÜ (REACT NATIVE'E ÇEVRİLDİ) ---
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Üst Bilgi Kartı */}
      <View style={styles.headerView}>
        <View>
          <Text style={styles.headerTitle}>Hoş Geldiniz</Text>
          <Text style={styles.headerSubtitle}>Bugünkü çalışma planınızı görüntüleyin</Text>
        </View>
        <View style={styles.headerInfoContainer}>
          <View style={styles.headerInfoBox}>
            <Feather name="clock" size={16} color="#1F2937" />
            {daysLeftForDisplay !== null && daysLeftForDisplay >= 0 ? (
              <Text style={styles.headerInfoText}>
                Hedef sınavına <Text style={{ fontWeight: 'bold' }}>{daysLeftForDisplay}</Text> gün kaldı
              </Text>
            ) : userData.targetExamDate && daysLeftForDisplay !== null && daysLeftForDisplay < 0 ? (
              <Text style={styles.headerInfoText}>Hedef sınav tarihi geçti.</Text>
            ) : (
              <Text style={styles.headerInfoText}>Hedef sınav tarihi ayarlanmadı.</Text>
            )}
          </View>
          {userData.streak > 0 && (
            <View style={[styles.headerInfoBox, { backgroundColor: 'rgba(252, 211, 77, 0.3)' }]}>
              <Feather name="zap" size={16} color="#1F2937" />
              <Text style={styles.headerInfoText}>
                <Text style={{ fontWeight: 'bold' }}>{userData.streak}</Text> günlük seri
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* İstatistik Kartları */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Bugünkü Hedef"
          value={`${dailyGoal / 60} saat`}
          icon={<Feather name="clock" size={20} color="#4B5563" />}
        />
        <StatCard
          title="Tamamlanan"
          value={`${Math.round(todaysStudyTime / 60 * 10) / 10} saat`}
          description={`Günlük hedefin %${completionPercentage}'si`}
          icon={<Feather name="award" size={20} color="#4B5563" />}
        />
        {lastExam ? (
          <StatCard
            title="Son Sınav Sonucu"
            value={`${lastExam.score.toFixed(2)} net`}
            description={`Hedef: ${lastExam.max_score} net`}
            icon={<Feather name="bar-chart-2" size={20} color="#4B5563" />}
            trend={lastExam.score > lastExam.max_score * 0.8 ? 'up' : lastExam.score < lastExam.max_score * 0.5 ? 'down' : 'neutral'}
            trendValue={`${Math.round((lastExam.score / lastExam.max_score) * 100)}%`}
          />
        ) : (
          <StatCard
            title="Sınav Sonucu"
            value="Henüz sınav girilmedi"
            description="İlk sınavını ekle ve takip et"
            icon={<Feather name="bar-chart-2" size={20} color="#4B5563" />}
          />
        )}
      </View>

      {/* Günlük İlerleme */}
      <Card>
        <CardHeader>
          <View style={styles.cardHeaderContainer}>
            <Text style={styles.cardTitle}>Günlük İlerleme</Text>
            <Text style={styles.cardDate}>{new Date().toLocaleDateString('tr-TR')}</Text>
          </View>
        </CardHeader>
        <CardContent>
          <ProgressBar
            value={todaysStudyTime}
            max={dailyGoal}
            label="Toplam Çalışma"
            showValue
            size="lg"
            color="primary"
          />
          <View style={{ marginTop: 16 }}>
            {userData.subjects.slice(0, 3).map((subject) => {
              const lastWeekSessions = userData.studySessions
                .filter((session: any) => {
                  const sessionDate = new Date(session.date);
                  const diffTime = today.getTime() - sessionDate.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays <= 7 && session.subjectId === subject.id;
                })
                .reduce((total: number, session: any) => total + session.duration, 0);

              const weeklyGoal = 600;
              const weeklyPercentage = Math.min(100, Math.round((lastWeekSessions / weeklyGoal) * 100));

              return (
                <View key={subject.id} style={{ marginBottom: 12 }}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <ProgressBar
                    value={weeklyPercentage}
                    size="sm"
                    color={weeklyPercentage > 60 ? "success" : weeklyPercentage > 30 ? "warning" : "danger"}
                  />
                </View>
              );
            })}
          </View>
        </CardContent>
      </Card>

      {/* AI Önerisi */}
      <Card color="primary">
        <CardContent>
          <View style={styles.aiCardContainer}>
            <View style={styles.aiIconWrapper}>
              <Feather name="cpu" size={24} color="#4338CA" />
            </View>
            <View style={styles.aiTextContainer}>
              <Text style={styles.aiTitle}>AI Önerisi</Text>
              {weakSubjects.length > 0 ? (
                <Text style={styles.aiDescription}>
                  Son performans verilerine göre <Text style={{ fontWeight: 'bold' }}>{weakSubjects[0].name}</Text> konusunda daha fazla pratik yapman gerekiyor.
                  {weakSubjects.length > 1 && ` Ayrıca ${weakSubjects[1].name} dersine de ağırlık vermelisin.`}
                </Text>
              ) : (
                <Text style={styles.aiDescription}>
                  Daha fazla sınav çözerek net performansını analiz etmemize yardımcı ol. En az bir sınav girişi yapmalısın.
                </Text>
              )}
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Yaklaşan Sınavlar */}
      <Card>
        <CardHeader>
          <Text style={styles.cardTitle}>Yaklaşan Sınavlar</Text>
        </CardHeader>
        <CardContent>
          {upcomingExams.length > 0 ? (
            <View>
              {upcomingExams.map((exam: Exam, index: number) => {
                const examDate = new Date(exam.date);
                const diffTime = examDate.getTime() - today.getTime();
                const daysUntilExam = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const daysLeftStyle =
                  daysUntilExam <= 3 ? styles.daysLeftDanger :
                    daysUntilExam <= 7 ? styles.daysLeftWarning :
                      styles.daysLeftInfo;

                return (
                  <View key={exam.id} style={[styles.examItem, index !== 0 && styles.examItemBorder]}>
                    <View>
                      <Text style={styles.examName}>{exam.name}</Text>
                      <Text style={styles.examDate}>{new Date(exam.date).toLocaleDateString('tr-TR')}</Text>
                    </View>
                    <View style={[styles.daysLeftBadge, daysLeftStyle.container]}>
                      <Text style={daysLeftStyle.text}>{daysUntilExam} gün kaldı</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Feather name="calendar" size={24} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>Yaklaşan sınav bulunmuyor</Text>
            </View>
          )}
        </CardContent>
      </Card>

    </ScrollView>
  );
};

// --- STYLESHEET BÖLÜMÜ ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light gray background
  },
  contentContainer: {
    paddingBottom: 48,
  },
  headerView: {
    borderRadius: 16,
    padding: 24,
    margin: 16,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginTop: 8,
  },
  headerInfoContainer: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  headerInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginTop: 8,
  },
  headerInfoText: {
    color: '#1F2937',
    fontWeight: '500',
    marginLeft: 8,
  },
  statsContainer: {
    marginBottom: 24,
    gap: 16,
  },
  cardHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 6,
  },
  aiCardContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aiIconWrapper: {
    backgroundColor: '#4B5563',
    padding: 8,
    borderRadius: 999, // tam yuvarlak
  },
  aiTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#312E81',
  },
  aiDescription: {
    marginTop: 4,
    color: '#3730A3',
    lineHeight: 20,
  },
  examItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    alignItems: 'center',
  },
  examItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  examName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  examDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  daysLeftBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  daysLeftInfo: {
    container: { backgroundColor: '#DBEAFE' },
    text: { color: '#2563EB', fontWeight: '500' },
  } as any,
  daysLeftWarning: {
    container: { backgroundColor: '#FEF3C7' },
    text: { color: '#D97706', fontWeight: '500' },
  } as any,
  daysLeftDanger: {
    container: { backgroundColor: '#FEE2E2' },
    text: { color: '#DC2626', fontWeight: '500' },
  } as any,
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    marginTop: 8,
    color: '#6B7280',
  },
});

export default Dashboard;
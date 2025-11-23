import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserData } from '../../contexts/UserDataContext';
import { supabase } from '../../lib/supabase';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface SummaryCardProps {
  iconName: IoniconsName;
  title: string;
  value: string | number;
  bgColor?: string;
  textColor?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ iconName, title, value, bgColor = '#3B82F6', textColor = '#FFFFFF' }) => {
  return (
    <View style={[styles.summaryCard, { backgroundColor: bgColor }]}>
      <Ionicons name={iconName} size={32} color={textColor} style={styles.summaryCardIcon} />
      <View style={styles.summaryCardTextContainer}>
        <Text style={[styles.summaryCardTitle, { color: textColor === '#FFFFFF' ? '#E0E7FF' : '#4B5563' }]}>{title}</Text>
        <Text style={[styles.summaryCardValue, { color: textColor }]}>{value}</Text>
      </View>
    </View>
  );
};

const formatMinutesToHoursAndMinutes = (totalMinutes: number): string => {
  if (isNaN(totalMinutes) || totalMinutes < 0) {
    return '0 dakika';
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let result = '';
  if (hours > 0) {
    result += `${hours} saat `;
  }
  if (minutes > 0 || hours === 0) {
    result += `${minutes} dakika`;
  }
  return result.trim() || '0 dakika';
};

const placeholderStats = {
  averageExamScore: 85.5,
  currentStreak: '12 gün',
  goalProgress: 'Hedef Üniversite: %60',
};

interface SessionWithSubject {
  duration: number;
  subject_id: string;
  subjects: { name: string } | { name: string }[] | null;
}

interface SubjectProgressDetail {
  subjectName: string;
  totalStudyTime: string;
  completedTasks: number;
  totalTasks: number;
  avgSessionTime: string;
}

const UserProgressSummary: React.FC = () => {
  const { user } = useUserData();
  const [totalStudyTimeDisplay, setTotalStudyTimeDisplay] = useState<string>('0 dakika');
  const [completedTasksDisplay, setCompletedTasksDisplay] = useState<string>('0 / 0');
  const [subjectProgressDetails, setSubjectProgressDetails] = useState<SubjectProgressDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const { data: sessionsDataUntyped, error: sessionsError } = await supabase
          .from('study_sessions')
          .select('duration, subject_id, subjects(name)')
          .eq('user_id', user.id);

        if (sessionsError) throw sessionsError;
        const sessionsData = (sessionsDataUntyped as SessionWithSubject[]) || [];
        const totalMinutes = sessionsData.reduce((sum, session) => sum + (session.duration || 0), 0);
        setTotalStudyTimeDisplay(formatMinutesToHoursAndMinutes(totalMinutes));

        const { data: scheduleItemsData, error: scheduleItemsError } = await supabase
          .from('study_schedule_items')
          .select('status, subject')
          .eq('user_id', user.id);

        if (scheduleItemsError) throw scheduleItemsError;
        const totalTasks = scheduleItemsData?.length || 0;
        const completedTasks = scheduleItemsData?.filter(item => item.status === 'completed').length || 0;
        setCompletedTasksDisplay(`${completedTasks} / ${totalTasks}`);

        const timeBySubject: { [key: string]: number } = {};
        sessionsData.forEach(session => {
          const subjectRelation = session.subjects;
          let subjectName = 'Bilinmeyen Ders';
          if (Array.isArray(subjectRelation)) {
            subjectName = subjectRelation[0]?.name || 'Bilinmeyen Ders';
          } else if (subjectRelation) {
            subjectName = subjectRelation.name || 'Bilinmeyen Ders';
          }
          timeBySubject[subjectName] = (timeBySubject[subjectName] || 0) + (session.duration || 0);
        });

        const tasksBySubject: { [key: string]: { completed: number; total: number } } = {};
        scheduleItemsData?.forEach(item => {
          let targetTaskSubjectName = item.subject || 'Bilinmeyen Ders';
          if (["Fizik", "Kimya", "Biyoloji"].includes(item.subject)) {
            targetTaskSubjectName = "Fen Bilimleri"; // Group under Fen Bilimleri
          }
          const subjectName = targetTaskSubjectName;
          if (!tasksBySubject[subjectName]) {
            tasksBySubject[subjectName] = { completed: 0, total: 0 };
          }
          tasksBySubject[subjectName].total++;
          if (item.status === 'completed') {
            tasksBySubject[subjectName].completed++;
          }
        });

        const allSubjects = new Set([
          ...Object.keys(timeBySubject),
          ...Object.keys(tasksBySubject),
        ]);

        const combinedDetails: SubjectProgressDetail[] = Array.from(allSubjects).map(subj => {
          const subjectTimeDataVal = timeBySubject[subj] || 0;
          const subjectTaskDataVal = tasksBySubject[subj] || { completed: 0, total: 0 };
          
          let sessionCount = 0;
          let totalDurationForAvg = 0;
          sessionsData.forEach(session => {
            const sName = (Array.isArray(session.subjects) ? session.subjects[0]?.name : session.subjects?.name) || 'Bilinmeyen Ders';
            if (sName === subj) {
              sessionCount++;
              totalDurationForAvg += (session.duration || 0);
            }
          });
          const avgMinutes = sessionCount > 0 ? Math.round(totalDurationForAvg / sessionCount) : 0;

          return {
            subjectName: subj,
            totalStudyTime: formatMinutesToHoursAndMinutes(subjectTimeDataVal),
            completedTasks: subjectTaskDataVal.completed,
            totalTasks: subjectTaskDataVal.total,
            avgSessionTime: formatMinutesToHoursAndMinutes(avgMinutes),
          };
        });
        setSubjectProgressDetails(combinedDetails);

      } catch (err: any) {
        console.error("Error fetching progress data:", err);
        setError('İlerleme verileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size="large" color="#4A5568" />
        <Text style={styles.loadingText}>İlerleme verileri yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredScreen}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.mainTitle}>Kullanıcı İlerleme Özeti</Text>
      
      <View style={styles.summaryGrid}>
        <SummaryCard iconName="time-outline" title="Çalışılan Toplam Süre" value={totalStudyTimeDisplay} bgColor="#3B82F6" />
        <SummaryCard iconName="checkmark-done-outline" title="Tamamlanan Ders/Konu" value={completedTasksDisplay} bgColor="#10B981" />
        <SummaryCard iconName="trending-up-outline" title="Ortalama Sınav Puanı" value={`${placeholderStats.averageExamScore.toFixed(1)} Puan`} bgColor="#F59E0B" />
        <SummaryCard iconName="ribbon-outline" title="Aktif Çalışma Serisi" value={placeholderStats.currentStreak} bgColor="#6366F1" />
        <SummaryCard iconName="locate-outline" title="Hedef İlerlemesi" value={placeholderStats.goalProgress} bgColor="#EF4444" />
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Ders Bazlı İlerleme Detayları</Text>
        {subjectProgressDetails.length > 0 ? (
          <ScrollView horizontal={true}>
            <View>
              {/* Table Header */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableHeader, styles.tableCellSubject]}>Ders Adı</Text>
                <Text style={[styles.tableHeader, styles.tableCellTime]}>Toplam Süre</Text>
                <Text style={[styles.tableHeader, styles.tableCellTasks]}>Otomatik Plan</Text>
                <Text style={[styles.tableHeader, styles.tableCellProgress]}>İlerleme</Text>
                <Text style={[styles.tableHeader, styles.tableCellAvgTime]}>Ort. Oturum</Text>
              </View>
              {/* Table Body */}
              {subjectProgressDetails.map((detail) => {
                const progressPercentage = detail.totalTasks > 0 ? (detail.completedTasks / detail.totalTasks) * 100 : 0;
                return (
                  <View key={detail.subjectName} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.tableCellSubject]}>{detail.subjectName}</Text>
                    <Text style={[styles.tableCell, styles.tableCellTime]}>{detail.totalStudyTime}</Text>
                    <Text style={[styles.tableCell, styles.tableCellTasks]}>{`${detail.completedTasks} / ${detail.totalTasks}`}</Text>
                    <View style={[styles.tableCell, styles.tableCellProgress]}>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
                      </View>
                    </View>
                    <Text style={[styles.tableCell, styles.tableCellAvgTime]}>{detail.avgSessionTime}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.noDetailsText}>Henüz görüntülenecek ders bazlı ilerleme detayı bulunmamaktadır.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  contentContainer: {
    padding: 16,
  },
  centeredScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4B5563',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    width: (screenWidth - 48) / 2, // Two cards per row with spacing
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryCardIcon: {
    marginRight: 12,
  },
  summaryCardTextContainer: {
    flex: 1,
  },
  summaryCardTitle: {
    fontSize: 13, // Adjusted for better fit
    fontWeight: '500',
  },
  summaryCardValue: {
    fontSize: 18, // Adjusted for better fit
    fontWeight: 'bold',
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
  },
  tableHeader: {
    fontSize: 11, // Smaller for header
    fontWeight: 'bold',
    color: '#4B5563',
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: 13, // Adjusted for table data
    color: '#1F2937',
    paddingRight: 10, // Add some padding between cells
  },
  tableCellSubject: {
    minWidth: 120, // Ensure subject name has enough space
  },
  tableCellTime: {
    minWidth: 100,
  },
  tableCellTasks: {
    minWidth: 100,
  },
  tableCellProgress: {
    minWidth: 100,
    justifyContent: 'center',
  },
  tableCellAvgTime: {
    minWidth: 100,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    width: '100%',
  },
  progressBarFill: {
    height: 10,
    backgroundColor: '#3B82F6', // primary-600 equivalent
    borderRadius: 5,
  },
  noDetailsText: {
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
});

export default UserProgressSummary;

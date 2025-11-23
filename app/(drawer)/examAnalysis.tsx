/* eslint-disable react/no-unescaped-entities */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Feather } from '@expo/vector-icons';
import { useUserData } from '../../contexts/UserDataContext';

const colors = {
  primary: '#4F46E5',
  background: '#F3F4F6',
  card: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  success: '#10B981',
  danger: '#EF4444',
  white: '#FFFFFF',
  borderColor: '#E5E7EB',
};

const ExamAnalysisScreen: React.FC = () => {
  const { userData, loading, error } = useUserData();

  const sortedExams = useMemo(() => {
    if (!userData || !userData.exams) return [];
    return [...userData.exams].sort((a, b) => {
      // created_at alanının varlığını ve geçerli bir tarih string'i olduğunu kontrol et
      const dateA = a.created_at ? new Date(a.created_at) : null;
      const dateB = b.created_at ? new Date(b.created_at) : null;

      const timeA = dateA ? dateA.getTime() : NaN;
      const timeB = dateB ? dateB.getTime() : NaN;

      const aIsValid = !isNaN(timeA);
      const bIsValid = !isNaN(timeB);

      if (aIsValid && bIsValid) {
        return timeB - timeA; // Her ikisi de geçerli, created_at'e göre büyükten küçüğe sırala
      }
      if (aIsValid && !bIsValid) {
        return -1; // a geçerli, b değil; a önce gelir (b sona gider)
      }
      if (!aIsValid && bIsValid) {
        return 1;  // a geçersiz, b geçerli; b önce gelir (a sona gider)
      }
      // Her ikisi de geçersiz veya created_at yoksa, orijinal sıralamayı koru veya eşit kabul et
      // Alternatif olarak, burada exam.date'e göre bir fallback sıralama eklenebilir.
      // Şimdilik, created_at olmayanları veya geçersiz olanları sona atıyoruz.
      return 0;
    });
  }, [userData]);

  const trend = useMemo(() => {
    if (sortedExams.length < 2) return { direction: 'stable', percentage: 0 };
    const lastExamScore = sortedExams[0].score;
    const previousExamScore = sortedExams[1].score;
    if (previousExamScore === 0) return lastExamScore > 0 ? { direction: 'up', percentage: 100 } : { direction: 'stable', percentage: 0 };
    const change = lastExamScore - previousExamScore;
    const percentage = Math.round((change / previousExamScore) * 100);
    if (change > 0) return { direction: 'up', percentage };
    if (change < 0) return { direction: 'down', percentage: Math.abs(percentage) };
    return { direction: 'stable', percentage: 0 };
  }, [sortedExams]);

  const chartData = useMemo(() => {
    if (sortedExams.length < 2) return null;
    const labels = sortedExams.map(exam => new Date(exam.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })).reverse();
    const data = sortedExams.map(exam => exam.score).reverse();
    return {
      labels,
      datasets: [{ data, color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`, strokeWidth: 2 }],
    };
  }, [sortedExams]);

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '5', strokeWidth: '2', stroke: colors.primary },
  };

  const subjectComparisonData = useMemo(() => {
    if (sortedExams.length < 2 || !userData?.subjects) return [];
    const lastExam = sortedExams[0];
    const previousExam = sortedExams[1];
    return userData.subjects.map(subject => {
      const lastSubjectDetail = lastExam.exam_subjects.find(s => s.subject_id === subject.id);
      const previousSubjectDetail = previousExam.exam_subjects.find(s => s.subject_id === subject.id);
      const lastNet = lastSubjectDetail ? lastSubjectDetail.correct - lastSubjectDetail.incorrect * 0.25 : 0;
      const previousNet = previousSubjectDetail ? previousSubjectDetail.correct - previousSubjectDetail.incorrect * 0.25 : 0;
      const change = lastNet - previousNet;
      return { name: subject.name, currentNet: parseFloat(lastNet.toFixed(2)), change: parseFloat(change.toFixed(2)), color: subject.color };
    });
  }, [sortedExams, userData?.subjects]);

  const lastExamSubjects = useMemo(() => {
    if (sortedExams.length === 0 || !userData?.subjects) return [];
    const lastExam = sortedExams[0];
    return lastExam.exam_subjects.map(subjectDetail => {
      const subjectInfo = userData.subjects.find(s => s.id === subjectDetail.subject_id);
      if (!subjectInfo) return null;
      const net = subjectDetail.correct - subjectDetail.incorrect * 0.25;
      return { ad: subjectInfo.name, dogru: subjectDetail.correct, yanlis: subjectDetail.incorrect, bos: subjectDetail.empty, net: parseFloat(net.toFixed(2)), color: subjectInfo.color };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [sortedExams, userData?.subjects]);

  if (loading) {
    return <View style={styles.centeredContainer}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.infoText}>Analiz verileri yükleniyor...</Text></View>;
  }

  if (error) {
    return <View style={styles.centeredContainer}><Feather name="alert-circle" size={48} color={colors.danger} /><Text style={styles.infoText}>Hata: {error.message}</Text></View>;
  }

  if (userData.exams.length === 0) {
    return <View style={styles.centeredContainer}><Feather name="bar-chart-2" size={48} color={colors.textSecondary} /><Text style={styles.infoHeader}>Veri Yok</Text><Text style={styles.infoText}>Analiz için lütfen sınav ekleyin.</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.mainTitle}>Sınav Analizi</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="trending-up" size={24} color={colors.primary} />
          <Text style={styles.cardTitle}>Genel Başarı Trendi</Text>
          {trend.direction !== 'stable' && (
            <View style={styles.trendBadge}>
              <Feather name={trend.direction === 'up' ? 'arrow-up' : 'arrow-down'} size={16} color={trend.direction === 'up' ? colors.success : colors.danger} />
              <Text style={[styles.trendText, { color: trend.direction === 'up' ? colors.success : colors.danger }]}>%{trend.percentage}</Text>
            </View>
          )}
        </View>
        {chartData ? (
          <LineChart data={chartData} width={Dimensions.get('window').width - 40} height={220} chartConfig={chartConfig} bezier style={styles.chartStyle} />
        ) : (
          <View style={styles.chartPlaceholder}><Text style={styles.infoText}>Net trendini görmek için en az 2 sınav ekleyin.</Text></View>
        )}
      </View>

      {subjectComparisonData.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="git-pull-request" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Ders Karşılaştırması (Son 2 Sınav)</Text>
          </View>
          {subjectComparisonData.map((subject, index) => (
            <View key={index} style={styles.subjectRow}>
              <View style={styles.subjectInfo}>
                <View style={[styles.subjectColorDot, { backgroundColor: subject.color }]} />
                <Text style={styles.subjectName}>{subject.name}</Text>
              </View>
              <View style={styles.netChangeContainer}>
                <Text style={styles.currentNet}>{subject.currentNet} net</Text>
                <Feather name={subject.change >= 0 ? 'trending-up' : 'trending-down'} size={14} color={subject.change >= 0 ? colors.success : colors.danger} />
                <Text style={[styles.netChange, { color: subject.change >= 0 ? colors.success : colors.danger }]}>{subject.change.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {lastExamSubjects.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="check-square" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Son Sınav: {sortedExams[0].name}</Text>
          </View>
          <View style={styles.detailHeader}>
            <Text style={[styles.detailHeaderText, { flex: 2 }]}>Ders</Text>
            <Text style={styles.detailHeaderText}>D-Y-B</Text>
            <Text style={styles.detailHeaderText}>Net</Text>
          </View>
          {lastExamSubjects.map((ders, i) => (
            <View key={i} style={styles.detailRow}>
              <View style={[styles.detailSubjectNameContainer, { flex: 2 }]}>
                <View style={[styles.subjectColorDot, { backgroundColor: ders.color }]} />
                <Text style={styles.subjectName}>{ders.ad}</Text>
              </View>
              <Text style={styles.detailText}>{`${ders.dogru}-${ders.yanlis}-${ders.bos}`}</Text>
              <Text style={styles.detailNet}>{ders.net.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 },
  infoHeader: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  infoText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { padding: 20 },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 20 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  trendBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 16, paddingVertical: 4, paddingHorizontal: 8 },
  trendText: { marginLeft: 4, fontWeight: 'bold' },
  chartStyle: { borderRadius: 16, paddingRight: 0 },
  chartPlaceholder: { height: 220, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12 },
  subjectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderColor },
  subjectInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subjectColorDot: { width: 12, height: 12, borderRadius: 6 },
  subjectName: { fontSize: 16, color: colors.textPrimary },
  netChangeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  currentNet: { fontSize: 16, fontWeight: '500', color: colors.textSecondary },
  netChange: { fontSize: 14, fontWeight: '500' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderColor, marginBottom: 8 },
  detailHeaderText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  detailSubjectNameContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailText: { flex: 1, fontSize: 14, color: colors.textPrimary, textAlign: 'center' },
  detailNet: { flex: 1, fontSize: 14, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },
});

export default ExamAnalysisScreen;

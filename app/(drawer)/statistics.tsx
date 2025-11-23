import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useUserData } from '../../contexts/UserDataContext';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Colors } from '../../constants/Colors'; // Corrected import

const screenWidth = Dimensions.get('window').width;

// Prop types for StatCard
interface StatCardProps {
  title: string;
  value: string;
  subValue?: string; // Optional sub-value
}

// Stat Card Component
const StatCard: React.FC<StatCardProps> = ({ title, value, subValue }) => (
  <View style={styles.statCard}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
    {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
  </View>
);

const StatisticsScreen: React.FC = () => {
  const { userData } = useUserData();
  const [chartType, setChartType] = useState<'performance' | 'subject'>('performance');

  const stats = useMemo(() => {
    if (!userData.exams || userData.exams.length === 0) {
      return {
        totalExams: 0,
        totalQuestions: 0,
        averageScore: 0,
        bestExam: { name: '', score: 0, percentage: 0 },
        subjectPerformance: [],
        examActivity: [],
      };
    }

    const exams = [...userData.exams].sort((a, b) => 
      new Date(b.date || b.created_at || 0).getTime() - new Date(a.date || a.created_at || 0).getTime()
    );

    const examActivities = exams.map(exam => {
      const score = exam.score ?? 0;
      const maxScore = exam.max_score ?? 1;
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      return {
        date: exam.date || exam.created_at,
        name: exam.name,
        score: score,
        maxScore: maxScore,
        percentage: parseFloat(percentage.toFixed(2)),
      };
    });

    const bestExam = examActivities.reduce((best, exam) => 
      exam.percentage > best.percentage ? exam : best, 
      { name: '-', score: 0, percentage: 0 }
    );

    const averageScore = examActivities.length > 0 ?
      examActivities.reduce((sum, exam) => sum + exam.percentage, 0) / examActivities.length : 0;

    let totalQuestions = 0;
    const subjectStatsMap: { [key: string]: { correct: number; total: number; net: number; count: number } } = {};

    userData.subjects.forEach(subject => {
        subjectStatsMap[subject.id] = { correct: 0, total: 0, net: 0, count: 0 };
    });

    exams.forEach(exam => {
      (exam.exam_subjects || []).forEach(subResult => {
        if (subjectStatsMap[subResult.subject_id]) {
            const correct = subResult.correct ?? 0;
            const incorrect = subResult.incorrect ?? 0;
            const empty = subResult.empty ?? 0;
            const total = correct + incorrect + empty;
            
            totalQuestions += total;
            
            subjectStatsMap[subResult.subject_id].correct += correct;
            subjectStatsMap[subResult.subject_id].total += total;
            subjectStatsMap[subResult.subject_id].net += subResult.net ?? 0;
            subjectStatsMap[subResult.subject_id].count++;
        }
      });
    });

    const subjectPerformance = userData.subjects.map(subject => {
        const stats = subjectStatsMap[subject.id];
        const averageNet = stats.count > 0 ? stats.net / stats.count : 0;
        return {
            subject: subject.name,
            correct: stats.correct,
            total: stats.total,
            average: parseFloat(averageNet.toFixed(2)),
            color: subject.color || Colors.light.primary,
        };
    }).filter(s => s.total > 0);

    return {
      totalExams: exams.length,
      totalQuestions,
      averageScore: parseFloat(averageScore.toFixed(2)),
      bestExam,
      subjectPerformance,
      examActivity: examActivities,
    };
  }, [userData.exams, userData.subjects]);

  const performanceChartData = useMemo(() => {
    const filteredData = [...stats.examActivity]
      .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
      .slice(-15); // Show last 15 exams for clarity
      
    return {
      labels: filteredData.map(d => format(parseISO(d.date || new Date().toISOString()), 'd MMM', { locale: tr })),
      datasets: [{ data: filteredData.map(d => d.percentage) }],
    };
  }, [stats.examActivity]);

  const subjectBarChartData = useMemo(() => ({
    labels: stats.subjectPerformance.map(s => s.subject.substring(0, 4)),
    datasets: [{ data: stats.subjectPerformance.map(s => s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0) }],
  }), [stats.subjectPerformance]);

  const subjectPieChartData = useMemo(() => 
    stats.subjectPerformance.map(s => ({
      name: s.subject,
      population: s.average > 0 ? s.average : 0,
      color: s.color,
      legendFontColor: Colors.light.textSecondary,
      legendFontSize: 14,
    })), 
  [stats.subjectPerformance]);

  const chartConfig = {
    backgroundGradientFrom: Colors.light.card,
    backgroundGradientTo: Colors.light.card,
    color: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
  };

  if (stats.totalExams === 0) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.mainTitle}>İstatistikler</Text>
        <Text style={styles.placeholderText}>Henüz hiç sınav verisi bulunmuyor. Sınav sonuçlarınızı ekledikçe burada istatistikler görüntülenecektir.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.mainTitle}>İstatistikler</Text>

      <View style={styles.statsGrid}>
        <StatCard title="Toplam Sınav" value={stats.totalExams.toString()} />
        <StatCard title="Çözülen Soru" value={stats.totalQuestions.toString()} />
        <StatCard title="Ortalama Başarı" value={`%${stats.averageScore}`} />
        <StatCard title="En İyi Sınav" value={stats.bestExam.name} subValue={`${stats.bestExam.score.toFixed(1)} Puan (%${stats.bestExam.percentage})`} />
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, chartType === 'performance' && styles.toggleButtonActive]}
          onPress={() => setChartType('performance')}>
          <Text style={[styles.toggleText, chartType === 'performance' && styles.toggleTextActive]}>Performans</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, chartType === 'subject' && styles.toggleButtonActive]}
          onPress={() => setChartType('subject')}>
          <Text style={[styles.toggleText, chartType === 'subject' && styles.toggleTextActive]}>Ders Bazlı</Text>
        </TouchableOpacity>
      </View>

      {chartType === 'performance' ? (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Sınav Performansı (%)</Text>
          <LineChart data={performanceChartData} width={screenWidth - 40} height={220} chartConfig={chartConfig} bezier />
        </View>
      ) : (
        <>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Ders Bazlı Başarı Oranı (%)</Text>
            <BarChart data={subjectBarChartData} width={screenWidth - 40} height={240} chartConfig={chartConfig} yAxisLabel='' yAxisSuffix="%" fromZero verticalLabelRotation={20} />
          </View>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Ders Bazlı Ortalama Netler</Text>
            <PieChart data={subjectPieChartData} width={screenWidth - 40} height={220} chartConfig={chartConfig} accessor={"population"} backgroundColor={"transparent"} paddingLeft={"15"} absolute />
          </View>
        </>
      )}

      <View style={styles.listCard}>
        <Text style={styles.chartTitle}>Ders Bazlı Performans Analizi</Text>
        {stats.subjectPerformance.map((subject, idx) => (
          <View key={idx} style={[styles.subjectItem, { borderLeftColor: subject.color }]}>
            <Text style={styles.subjectTitle}>{subject.subject}</Text>
            <View style={styles.subjectStatRow}>
              <Text style={styles.subjectStatLabel}>Doğru Oranı:</Text>
              <Text style={styles.subjectStatValue}>{subject.total > 0 ? `${Math.round((subject.correct / subject.total) * 100)}%` : '-'}</Text>
            </View>
            <View style={styles.subjectStatRow}>
              <Text style={styles.subjectStatLabel}>Doğru/Toplam:</Text>
              <Text style={styles.subjectStatValue}>{subject.correct} / {subject.total}</Text>
            </View>
            <View style={styles.subjectStatRow}>
              <Text style={styles.subjectStatLabel}>Ortalama Net:</Text>
              <Text style={styles.subjectStatValue}>{subject.average}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  contentContainer: { padding: 20 },
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: Colors.light.background },
  placeholderText: { fontSize: 16, color: Colors.light.textSecondary, textAlign: 'center' },
  mainTitle: { fontSize: 26, fontWeight: 'bold', color: Colors.light.textPrimary, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { backgroundColor: Colors.light.card, borderRadius: 12, padding: 15, width: '48%', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  statTitle: { fontSize: 13, fontWeight: '500', color: Colors.light.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: Colors.light.textPrimary },
  statSubValue: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  toggleContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: Colors.light.card, borderRadius: 10, alignSelf: 'center' },
  toggleButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  toggleButtonActive: { backgroundColor: Colors.light.primary },
  toggleText: { color: Colors.light.textPrimary, fontWeight: '600' },
  toggleTextActive: { color: 'white' },
  chartCard: { backgroundColor: Colors.light.card, borderRadius: 16, padding: 15, marginBottom: 20, alignItems: 'center' },
  chartTitle: { fontSize: 17, fontWeight: '600', color: Colors.light.textPrimary, marginBottom: 15, alignSelf: 'flex-start' },
  listCard: { backgroundColor: Colors.light.card, borderRadius: 16, padding: 15, marginBottom: 20 },
  subjectItem: { borderLeftWidth: 4, paddingLeft: 12, marginBottom: 15 },
  subjectTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.textPrimary, marginBottom: 8 },
  subjectStatRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  subjectStatLabel: { color: Colors.light.textSecondary },
  subjectStatValue: { fontWeight: '600', color: Colors.light.textPrimary },
});

export default StatisticsScreen;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
// import { VictoryPolarAxis, VictoryChart, VictoryGroup, VictoryArea, VictoryTheme } from 'victory-native'; // Radar grafiği çökme nedeniyle geçici olarak devre dışı bırakıldı
import { Feather } from '@expo/vector-icons';
import { useUserData } from '../../contexts/UserDataContext';
import { format, subDays, parseISO, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';

const screenWidth = Dimensions.get('window').width;

const colors = {
  primary: '#4F46E5',
  background: '#F3F4F6',
  card: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  white: '#FFFFFF',
  borderColor: '#E5E7EB',
  blue50: '#EFF6FF',
  blue500: '#3B82F6',
  green50: '#ECFDF5',
  green500: '#22C55E',
  emerald50: '#E6FBF4',
  emerald500: '#10B981',
  red50: '#FEF2F2',
  red500: '#EF4444',
  amber50: '#FFFBEB',
  amber500: '#F59E0B',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray500: '#6B7280',
  gray700: '#374151',
  gray800: '#1F2937',
};

// Tip tanımlaması UserDataContext'ten gelen Exam ve Subject tiplerini kullanacak
// Bu yüzden buradaki ExamSubject tipine gerek kalmayabilir, doğrudan exam.exam_subjects[i].net kullanılacak

type ExamNetData = {
  date: string;
  created_at?: string;
  formattedDate: string;
  netScores: { [subjectName: string]: number };
  totalNet: number;
  examName: string;
};

const NetTrackerScreen: React.FC = () => {
  const { userData, loading: userDataLoading } = useUserData();

  const netData = useMemo(() => {
    if (!userData.exams || userData.exams.length === 0) {
      return [];
    }
    return userData.exams.map(exam => {
      const netScores: { [subjectName: string]: number } = {};
      userData.subjects.forEach(subject => {
        const examSubject = exam.exam_subjects.find(s => s.subject_id === subject.id);
        netScores[subject.name] = examSubject?.net ?? 0;
      });
      const totalNet = Object.values(netScores).reduce((sum, net) => sum + net, 0);
      return {
        date: exam.date, // Grafiklerde x ekseni için
        created_at: exam.created_at, // Sıralama için
        formattedDate: format(parseISO(exam.date), 'd MMMM yyyy', { locale: tr }),
        netScores,
        totalNet: parseFloat(totalNet.toFixed(2)),
        examName: exam.name,
      };
    }).sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : new Date(a.date).getTime();
        const timeB = b.created_at ? new Date(b.created_at).getTime() : new Date(b.date).getTime();
        return timeB - timeA; // En yeniden en eskiye
    });
  }, [userData.exams, userData.subjects]);

  // netData already contains sorted exams with calculated net scores
  // We will use netData directly for stats and charts, no need for separate filteredExams or sortedExams here.

  const stats = useMemo(() => {
    if (netData.length === 0) {
      return {
        averageNet: 0,
        highestNet: { value: 0, date: '', examName: '' },
        trend: 'stable' as 'up' | 'down' | 'stable',
      };
    }
    const averageNet = netData.reduce((sum, data) => sum + data.totalNet, 0) / netData.length;
    const highestNetEntry = [...netData].sort((a, b) => b.totalNet - a.totalNet)[0]; // netData is already sorted, but this ensures we get the top one if sorting changes
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (netData.length >= 3) {
      const last3 = netData.slice(0, 3); // netData is sorted newest to oldest
      const increasing = last3[0].totalNet > last3[1].totalNet && last3[1].totalNet > last3[2].totalNet;
      const decreasing = last3[0].totalNet < last3[1].totalNet && last3[1].totalNet < last3[2].totalNet;
      if (increasing) trend = 'up';
      else if (decreasing) trend = 'down';
    }
    return {
      averageNet,
      highestNet: { value: highestNetEntry.totalNet, date: highestNetEntry.formattedDate, examName: highestNetEntry.examName },
      trend,
    };
  }, [netData]);

  const getSubjectColor = useCallback((subjectName: string): string => {
    const subjectObj = userData.subjects.find(s => s.name === subjectName);
    // Ensure a default valid color string if subjectObj or subjectObj.color is not found
    return subjectObj?.color || colors.primary || 'rgb(79, 70, 229)'; // Default to a known valid color
  }, [userData.subjects, colors.primary]);

  const getSubjectColorWithOpacity = useCallback((subjectName: string, opacity: number): string => {
    const colorStr = getSubjectColor(subjectName);
    if (colorStr.startsWith('rgb(')) {
      return colorStr.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
    } else if (colorStr.startsWith('#')) {
      let r = 0, g = 0, b = 0;
      if (colorStr.length === 7) { // #RRGGBB
        r = parseInt(colorStr.slice(1, 3), 16);
        g = parseInt(colorStr.slice(3, 5), 16);
        b = parseInt(colorStr.slice(5, 7), 16);
      } else if (colorStr.length === 4) { // #RGB
        r = parseInt(colorStr.slice(1, 2) + colorStr.slice(1, 2), 16);
        g = parseInt(colorStr.slice(2, 3) + colorStr.slice(2, 3), 16);
        b = parseInt(colorStr.slice(3, 4) + colorStr.slice(3, 4), 16);
      } else {
        // Fallback for invalid hex (e.g. if subject.color was just 'red')
        return 'rgba(0,0,0,0.5)'; // Default fallback
      }
      return `rgba(${r},${g},${b},${opacity})`;
    }
    // Fallback for completely unknown color string formats (should not happen with current getSubjectColor)
    return `rgba(79, 70, 229, ${opacity})`; // Default to primary color with opacity
  }, [getSubjectColor]);

  const lineChartData = useMemo(() => {
    if (netData.length === 0) return { labels: [], datasets: [{ data: [] }] };
    const chronologicalData = [...netData].reverse(); // Oldest to newest for chart
    // Ensure d.date is valid before parsing
    const labels = chronologicalData.map(d => d.date ? format(parseISO(d.date), 'd MMM', { locale: tr }) : '');
    const datasets = [
      {
        data: chronologicalData.map(d => d.totalNet),
        color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`, // primary color
        strokeWidth: 2,
      },
    ];
    return { labels, datasets };
  }, [netData]);

  const subjectAveragesData = useMemo(() => {
    // Ensure all subjects are displayed, even if they have no nets yet.
    const labels = userData.subjects.map(s => s.name);
    
    if (netData.length === 0) {
      return {
        labels,
        datasets: [{ data: Array(labels.length).fill(0) }]
      };
    }

    const averages: { [key: string]: { total: number, count: number } } = {};
    // Initialize all subjects from context
    labels.forEach(label => {
      averages[label] = { total: 0, count: 0 };
    });

    netData.forEach(exam => {
      for (const subjectName in exam.netScores) {
        if (averages[subjectName]) { // Check if the subject exists in our list
          averages[subjectName].total += exam.netScores[subjectName];
          averages[subjectName].count++;
        }
      }
    });

    const data = labels.map(label => {
      const avg = averages[label];
      return avg.count > 0 ? parseFloat((avg.total / avg.count).toFixed(2)) : 0;
    });

    return {
      labels,
      datasets: [
        {
          data,
        },
      ],
    };
  }, [netData, userData.subjects]);

  // const radarChartData = useMemo(() => {
  //   // Radar chart data calculation is temporarily disabled.
  // }, [selectedExamIndex, netData, userData.subjects]);

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // textSecondary
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
  };

  if (userDataLoading) {
    return <View style={styles.centeredMessageContainer}><ActivityIndicator size="large" color={colors.primary} /><Text>Veriler yükleniyor...</Text></View>;
  }

  if (netData.length === 0 && !userDataLoading) {
    return (
      <View style={styles.centeredMessageContainer}>
        <Feather name="info" size={48} color={colors.textSecondary} />
        <Text style={styles.messageTextHeader}>Veri Yok</Text>
        <Text style={styles.messageText}>Bu zaman aralığında sınav bulunmuyor.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.mainTitle}>Net Takibi</Text>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderColor: colors.blue500, backgroundColor: colors.blue50 }]}>
          <Text style={[styles.statLabel, { color: colors.blue500 }]}>Ortalama Net</Text>
          <Text style={styles.statValue}>{stats.averageNet.toFixed(1)}</Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.green500, backgroundColor: colors.green50 }]}>
          <Text style={[styles.statLabel, { color: colors.green500 }]}>En Yüksek Net</Text>
          <Text style={styles.statValue}>{stats.highestNet.value.toFixed(1)}</Text>
          <Text style={styles.statSubText}>{stats.highestNet.examName} ({stats.highestNet.date})</Text>
        </View>
        <View style={[styles.statCard, {
          borderColor: stats.trend === 'up' ? colors.emerald500 : stats.trend === 'down' ? colors.red500 : colors.amber500,
          backgroundColor: stats.trend === 'up' ? colors.emerald50 : stats.trend === 'down' ? colors.red50 : colors.amber50,
        }]}>
          <Text style={[styles.statLabel, {
            color: stats.trend === 'up' ? colors.emerald500 : stats.trend === 'down' ? colors.red500 : colors.amber500,
          }]}>Son Trend</Text>
          <View style={styles.trendValueContainer}>
            <Feather 
              name={stats.trend === 'up' ? 'arrow-up' : stats.trend === 'down' ? 'arrow-down' : 'arrow-right'} 
              size={18} 
              color={stats.trend === 'up' ? colors.emerald500 : stats.trend === 'down' ? colors.red500 : colors.amber500} 
            />
            <Text style={[styles.trendText, {
              color: stats.trend === 'up' ? colors.emerald500 : stats.trend === 'down' ? colors.red500 : colors.amber500,
            }]}>
              {stats.trend === 'up' ? 'Yükseliyor' : stats.trend === 'down' ? 'Düşüyor' : 'Stabil'}
            </Text>
          </View>
        </View>
      </View>

      {/* Line Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Net Puan Trendi</Text>
        {lineChartData.labels.length > 0 ? (
            <LineChart
                data={lineChartData}
                width={screenWidth - 60} // card padding
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{ borderRadius: 12, paddingRight: 35 /* prevent label cutoff */ }}
            />
        ) : <Text style={styles.chartPlaceholderText}>Grafik için yeterli veri yok.</Text>}
      </View>

      {/* Bar Chart - Average net per subject */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Ders Ortalamaları</Text>
        {subjectAveragesData.labels.length > 0 ? (
            <BarChart
                data={subjectAveragesData}
                width={screenWidth - 60}
                height={250}
                chartConfig={chartConfig}
                yAxisLabel=""
                yAxisSuffix=" Net"
                verticalLabelRotation={15}
                style={{ borderRadius: 12 }}
                fromZero={true}
                showValuesOnTopOfBars={true}
            />
        ) : <Text style={styles.chartPlaceholderText}>Grafik için yeterli veri yok.</Text>}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { padding: 20 },
  mainTitle: { fontSize: 26, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, gap: 10 },
  statCard: { flex:1, padding: 15, borderRadius: 12, borderWidth: 1, alignItems:'center' },
  statLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  statSubText: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  trendValueContainer: {flexDirection: 'row', alignItems: 'center', marginTop: 4},
  trendText: { fontSize: 16, fontWeight: '600', marginLeft: 5 }, 
  chartCard: { backgroundColor: colors.card, borderRadius: 16, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  chartTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary, marginBottom: 15 },
  chartPlaceholderText: { textAlign: 'center', color: colors.textSecondary, paddingVertical: 20 },
  listContainer: { marginBottom: 20 },
  listTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary, marginBottom: 10 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, padding: 15, borderRadius: 10, marginBottom: 10, borderWidth:1, borderColor: colors.borderColor },
  listItemTitle: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  listItemSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  listItemNet: { fontSize: 15, fontWeight: 'bold', color: colors.primary, marginRight:10 },
  centeredMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.background },
  messageTextHeader: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginTop:10 },
  messageText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '500' },
});

export default NetTrackerScreen;

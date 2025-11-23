import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, LayoutAnimation, UIManager, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useUserData, Exam } from '../../contexts/UserDataContext';
import Card, { CardContent } from '../components/Card';
import AddExamModal from '../components/AddExamModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ExamItem = ({ item, userData, onExpand, isExpanded }: { item: Exam, userData: any, onExpand: (id: string) => void, isExpanded: boolean }) => {
  return (
    <View style={styles.examCardContainer}>
      <TouchableOpacity onPress={() => onExpand(item.id)} activeOpacity={0.8}>
        <Card>
          <CardContent>
            <View style={styles.examItem}>
              <View style={styles.examInfo}>
                <Text style={styles.examName}>{item.name}</Text>
                <Text style={styles.examDate}>{new Date(item.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
              </View>
              <View style={styles.examScore}>
                <Text style={styles.scoreText}>{item.score.toFixed(2)} Net</Text>
                <Feather name={isExpanded ? 'chevron-down' : 'chevron-right'} size={24} color="#6B7280" />
              </View>
            </View>
          </CardContent>
        </Card>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
            <Text style={[styles.detailsHeaderText, { flex: 3, textAlign: 'left' }]}>Ders</Text>
            <Text style={styles.detailsHeaderText}>D</Text>
            <Text style={styles.detailsHeaderText}>Y</Text>
            <Text style={styles.detailsHeaderText}>B</Text>
            <Text style={[styles.detailsHeaderText, { flex: 1.5 }]}>Net</Text>
          </View>
          {item.exam_subjects && item.exam_subjects.length > 0 ? (
            item.exam_subjects.map(subjectResult => {
              const subject = userData.subjects?.find((s: any) => s.id === subjectResult.subject_id);
              const correctCount = subjectResult.correct || 0;
              const incorrectCount = subjectResult.incorrect || 0;
              const emptyCount = subjectResult.empty || 0;
              const net = typeof subjectResult.net === 'number' 
                          ? subjectResult.net 
                          : correctCount - incorrectCount * 0.25;
              return (
                <View key={subjectResult.subject_id} style={styles.detailsRow}>
                  <Text style={[styles.detailsCell, { flex: 3, textAlign: 'left' }]}>{subject?.name || 'Bilinmeyen Ders'}</Text>
                  <Text style={styles.detailsCell}>{correctCount}</Text>
                  <Text style={styles.detailsCell}>{incorrectCount}</Text>
                  <Text style={styles.detailsCell}>{emptyCount}</Text>
                  <Text style={[styles.detailsCell, { flex: 1.5, fontWeight: 'bold' }]}>{net.toFixed(2)}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.noDetailsText}>Bu sınav için ders detayı bulunmuyor.</Text>
          )}
        </View>
      )}
    </View>
  );
};

const ExamTrackingScreen = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { userData, loading, error } = useUserData();
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);

  const sortedExams = React.useMemo(() => {
    if (!userData?.exams) return [];
    return [...userData.exams].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [userData?.exams]);

  const handleExpand = (examId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedExamId(prevId => (prevId === examId ? null : examId));
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  if (error) {
    return <View style={styles.center}><Text>Hata: {error.message}</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sınav Takibi</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
          <Feather name="plus" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Yeni Sınav Ekle</Text>
        </TouchableOpacity>
      </View>

      {sortedExams.length > 0 ? (
        <FlatList
          data={sortedExams}
          renderItem={({ item }) => (
            <ExamItem 
              item={item} 
              userData={userData} 
              onExpand={handleExpand} 
              isExpanded={expandedExamId === item.id} 
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="file-text" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>Henüz hiç sınav eklemediniz.</Text>
          <Text style={styles.emptySubText}>Başlamak için yeni bir sınav ekleyin.</Text>
        </View>
      )}

      <AddExamModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  addButton: { flexDirection: 'row', backgroundColor: '#4F46E5', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
  addButtonText: { color: '#FFF', fontWeight: '600', marginLeft: 8 },
  listContainer: { paddingHorizontal: 20, paddingVertical: 10 },
  examCardContainer: { marginBottom: 16 },
  examItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  examInfo: { flex: 1 },
  examName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  examDate: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  examScore: { flexDirection: 'row', alignItems: 'center' },
  scoreText: { fontSize: 16, fontWeight: 'bold', color: '#4F46E5', marginRight: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#4B5563', marginTop: 16, textAlign: 'center' },
  emptySubText: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  detailsContainer: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, marginTop: -8, paddingTop: 8, paddingHorizontal: 16, paddingBottom: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  detailsHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 4 },
  detailsHeaderText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
  detailsRow: { flexDirection: 'row', paddingVertical: 6, alignItems: 'center' },
  detailsCell: { flex: 1, fontSize: 14, color: '#1F2937', textAlign: 'center' },
  noDetailsText: { paddingVertical: 10, textAlign: 'center', color: '#6B7280', fontStyle: 'italic' },
});

export default ExamTrackingScreen;

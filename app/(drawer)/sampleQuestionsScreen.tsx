import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Dimensions } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

interface SampleMaterial {
  id: string;
  subject: string;
  question: string;
  videoUrl?: string;
  tags?: string[];
}

// Örnek veri seti
const sampleMaterialsData: SampleMaterial[] = [
  {
    id: 'mat1',
    subject: 'Matematik',
    question: 'Limit ve Süreklilik konusuyla ilgili zor bir örnek soru?',
    videoUrl: 'https://www.youtube.com/watch?v=JrS3OVFznhI',
    tags: ['limit', 'calculus'],
  },
  {
    id: 'mat2',
    subject: 'Matematik',
    question: 'Trigonometrik denklemler nasıl çözülür? Bir örnek gösterin.',
    videoUrl: 'https://www.youtube.com/watch?v=5Yo1JVK1BqE',
    tags: ['trigonometri', 'denklem'],
  },
  {
    id: 'phy1',
    subject: 'Fizik',
    question: 'Newton\'un hareket yasaları nelerdir ve günlük hayattan bir örnek?',
    videoUrl: 'https://www.youtube.com/watch?v=lKwbkCjuof8',
    tags: ['newton', 'mekanik'],
  },
  {
    id: 'che1',
    subject: 'Kimya',
    question: 'Mol kavramı nedir? Basit bir mol hesaplama sorusu.',
    tags: ['mol', 'hesaplama'],
  },
  {
    id: 'bio1',
    subject: 'Biyoloji',
    question: 'Hücre bölünmesi (mitoz) aşamaları nelerdir?',
    videoUrl: 'https://www.youtube.com/watch?v=5ZnE6GFzIcI',
    tags: ['hücre', 'mitoz'],
  },
];

const colors = {
  primary: '#4A90E2', // Example: primary-600
  primaryDark: '#357ABD', // Example: primary-700
  white: '#FFFFFF',
  grayLight: '#F0F0F0', // Example: gray-200
  grayMedium: '#A0A0A0', // Example: gray-500
  grayDark: '#606060', // Example: gray-700
  green: '#2ECC71', // Example: green-600
  blueText: '#3498DB', // Example: text-blue-500
  tagBg: '#E6F3FF', // Example: blue-100
  tagText: '#357ABD', // Example: blue-700
  cardBg: '#FFFFFF',
  footerBg: '#F8F9F9',
  borderColor: '#E0E0E0',
};

const SampleQuestionsScreen: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>('Tümü');
  const subjects = useMemo(() => ['Tümü', ...new Set(sampleMaterialsData.map(m => m.subject))], []);

  const filteredMaterials = useMemo(() => {
    if (selectedSubject === 'Tümü') {
      return sampleMaterialsData;
    }
    return sampleMaterialsData.filter(material => material.subject === selectedSubject);
  }, [selectedSubject]);

  const handleOpenVideo = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Örnek Sorular ve Videolar</Text>

      <View style={styles.filterSection}>
        <View style={styles.filterHeaderContainer}>
          <Feather name="filter" size={20} color={colors.grayDark} style={styles.filterIcon} />
          <Text style={styles.filterTitle}>Ders Filtresi</Text>
        </View>
        <View style={styles.subjectButtonsContainer}>
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject}
              onPress={() => setSelectedSubject(subject)}
              style={[
                styles.subjectButton,
                selectedSubject === subject && styles.selectedSubjectButton,
              ]}
            >
              <Text style={[
                styles.subjectButtonText,
                selectedSubject === subject && styles.selectedSubjectButtonText,
              ]}>
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {filteredMaterials.length > 0 ? (
        <View style={styles.materialsList}>
          {filteredMaterials.map(material => (
            <View key={material.id} style={styles.materialCard}>
              <View style={styles.cardContent}>
                <Text style={styles.cardSubject}>{material.subject}</Text>
                <View style={styles.questionRow}>
                  <Feather name="help-circle" size={18} color={colors.blueText} style={styles.questionIcon} />
                  <Text style={styles.cardQuestion}>{material.question}</Text>
                </View>
                {material.tags && material.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {material.tags.map(tag => (
                      <View key={tag} style={styles.tagPill}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              {material.videoUrl ? (
                <View style={styles.cardFooter}>
                  <TouchableOpacity 
                    style={styles.videoButton}
                    onPress={() => handleOpenVideo(material.videoUrl!)}
                  >
                    <Feather name="video" size={16} color={colors.white} style={styles.videoButtonIcon} />
                    <Text style={styles.videoButtonText}>Çözüm Videosunu İzle</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                 <View style={styles.cardFooter}>
                    <Text style={styles.noVideoText}>Bu soru için henüz video eklenmemiştir.</Text>
                 </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Feather name="help-circle" size={50} color={colors.grayMedium} style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateText}>Seçilen kritere uygun örnek soru veya video bulunamadı.</Text>
          {selectedSubject !== 'Tümü' && (
             <TouchableOpacity 
                style={styles.showAllButton}
                onPress={() => setSelectedSubject('Tümü')}
            >
                <Text style={styles.showAllButtonText}>Tüm Dersleri Göster</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.grayLight,
  },
  pageTitle: {
    fontSize: 26, // approx 3xl
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 24,
  },
  filterSection: {
    backgroundColor: colors.white,
    padding: 16, // p-6 is 24, using 16 for a bit tighter feel
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterIcon: {
    marginRight: 8,
  },
  filterTitle: {
    fontSize: 18, // approx xl
    fontWeight: '600',
    color: colors.grayDark,
  },
  subjectButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap: 8 (achieved by margins on buttons)
  },
  subjectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.grayLight,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedSubjectButton: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  subjectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.grayDark,
  },
  selectedSubjectButtonText: {
    color: colors.white,
  },
  materialsList: {
    // For a grid, you'd use FlatList with numColumns and different styling here
  },
  materialCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    marginBottom: 16, // gap-6
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4, // shadow-lg
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20, // p-5
    flexGrow: 1,
  },
  cardSubject: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questionIcon: {
    marginRight: 8,
    marginTop: 2, // To align with text
  },
  cardQuestion: {
    color: colors.grayDark,
    fontSize: 14,
    flexShrink: 1, // Allow text to wrap
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagPill: {
    backgroundColor: colors.tagBg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: colors.tagText,
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    backgroundColor: colors.footerBg,
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.borderColor,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: colors.green,
    // shadow for button (optional, can be subtle)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  videoButtonIcon: {
    marginRight: 8,
  },
  videoButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  noVideoText: {
    fontSize: 14,
    color: colors.grayMedium,
    textAlign: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: colors.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: colors.grayDark,
    textAlign: 'center',
    marginBottom: 16,
  },
  showAllButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.primary, // primary-500
    borderRadius: 6,
  },
  showAllButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SampleQuestionsScreen;

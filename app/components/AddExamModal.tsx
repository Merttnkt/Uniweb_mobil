import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useUserData, Subject } from '../../contexts/UserDataContext';

type SubjectResult = {
  subjectId: string;
  correct: string;
  incorrect: string;
  empty: string;
};

type AddExamModalProps = {
  visible: boolean;
  onClose: () => void;
};

const AddExamModal: React.FC<AddExamModalProps> = ({ visible, onClose }) => {
  const { userData, addExam } = useUserData();
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [subjectResults, setSubjectResults] = useState<SubjectResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && userData?.subjects) {
      setSubjectResults(
        userData.subjects.map((subject: Subject) => ({
          subjectId: subject.id,
          correct: '',
          incorrect: '',
          empty: '',
        }))
      );
      setExamName('');
      setExamDate(new Date());
    }
  }, [visible, userData?.subjects]);

  const handleResultChange = (subjectId: string, field: 'correct' | 'incorrect' | 'empty', value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setSubjectResults(prev => prev.map(res => (res.subjectId === subjectId ? { ...res, [field]: numericValue } : res)));
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || examDate;
    setShowDatePicker(Platform.OS === 'ios');
    setExamDate(currentDate);
  };

  const handleSave = async () => {
    if (!examName.trim()) {
      Alert.alert('Hata', 'Sınav adı boş bırakılamaz.');
      return;
    }
    setIsSaving(true);

    const results = subjectResults.map(res => ({
      subject_id: res.subjectId,
      correct: parseInt(res.correct || '0', 10),
      incorrect: parseInt(res.incorrect || '0', 10),
      empty: parseInt(res.empty || '0', 10),
    }));

    const totalScore = results.reduce((acc, cur) => acc + (cur.correct - cur.incorrect * 0.25), 0);
    const totalQuestions = results.reduce((acc, cur) => acc + cur.correct + cur.incorrect + cur.empty, 0);

    try {
      await addExam({
        name: examName,
        date: examDate.toISOString(),
        subjects: results,
        score: totalScore,
        max_score: totalQuestions,
      });
      Alert.alert('Başarılı', 'Sınav başarıyla eklendi.');
      onClose();
    } catch (error) {
      console.error('Sınav eklenirken hata:', error);
      Alert.alert('Hata', 'Sınav eklenirken bir sorun oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Yeni Sınav Ekle</Text>
            <TouchableOpacity onPress={onClose} disabled={isSaving}>
              <Feather name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Sınav Adı</Text>
            <TextInput style={styles.input} placeholder="Örn: TYT Deneme Sınavı 1" value={examName} onChangeText={setExamName} />
            
            <Text style={styles.label}>Sınav Tarihi</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
              <Text style={styles.datePickerText}>{examDate.toLocaleDateString('tr-TR')}</Text>
              <Feather name="calendar" size={20} color="#4F46E5" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={examDate}
                mode="date"
                is24Hour={true}
                display="default"
                onChange={handleDateChange}
              />
            )}

            <Text style={styles.subtitle}>Ders Sonuçları</Text>
            {userData?.subjects.map(subject => {
              const result = subjectResults.find(r => r.subjectId === subject.id);
              return (
                <View key={subject.id} style={styles.subjectContainer}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <View style={styles.inputsRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Doğru</Text>
                      <TextInput style={styles.smallInput} keyboardType="numeric" value={result?.correct} onChangeText={val => handleResultChange(subject.id, 'correct', val)} />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Yanlış</Text>
                      <TextInput style={styles.smallInput} keyboardType="numeric" value={result?.incorrect} onChangeText={val => handleResultChange(subject.id, 'incorrect', val)} />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Boş</Text>
                      <TextInput style={styles.smallInput} keyboardType="numeric" value={result?.empty} onChangeText={val => handleResultChange(subject.id, 'empty', val)} />
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.button, styles.saveButton, isSaving && styles.buttonDisabled]} onPress={handleSave} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Kaydet</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '95%', maxHeight: '85%', backgroundColor: 'white', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  formContainer: { marginVertical: 10 },
  label: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  datePickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12, marginBottom: 16 },
  datePickerText: { fontSize: 16, color: '#111827' },
  subtitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 10, marginBottom: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 15 },
  subjectContainer: { marginBottom: 16, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 },
  subjectName: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 10 },
  inputsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { flex: 1, marginHorizontal: 4 },
  inputLabel: { fontSize: 14, color: '#6B7280', marginBottom: 4, textAlign: 'center' },
  smallInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, textAlign: 'center', padding: 10, fontSize: 16 },
  footer: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  button: { borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  saveButton: { backgroundColor: '#4F46E5' },
  buttonDisabled: { backgroundColor: '#A5B4FC' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default AddExamModal;

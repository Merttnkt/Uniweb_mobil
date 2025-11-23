import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useUserData } from '../../contexts/UserDataContext';

interface Note {
  id: string;
  user_id: string;
  subject: string;
  note: string;
  created_at: string;
  updated_at?: string;
}

const NOTE_COLORS = [
  { bg: '#E0F2FE', text: '#0C4A6E', border: '#7DD3FC' },
  { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  { bg: '#EDE9FE', text: '#5B21B6', border: '#A78BFA' },
  { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  { bg: '#FCE7F3', text: '#9D174D', border: '#F9A8D4' },
];

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6', // A light gray background
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1F2937',
  },
  clearSearchButton: {
    padding: 4,
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    justifyContent: 'center',
  },
  sortLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginRight: 8,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  activeSortButton: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#4B5563',
  },
  activeSortButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  subjectInput: {
    // No specific additional styles for now
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#4F46E5', // Indigo
  },
  updateButton: {
    backgroundColor: '#10B981', // Green
  },
  cancelButton: {
    backgroundColor: '#E5E7EB', // Light gray
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#374151', // Darker gray for cancel text
  },
  buttonIcon: {
    marginRight: 8,
  },
  errorText: {
    color: '#EF4444', // Red
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  mainLoader: {
    marginTop: 20,
  },
  notesListContainer: {
    paddingBottom: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  subjectGroupContainer: {
    marginBottom: 20,
  },
  subjectGroupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  noteItemContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    // backgroundColor and borderColor will come from getNoteColorStyle
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteSubjectText: { // This was commented out in JSX, but style is here if needed
    fontSize: 16,
    fontWeight: '600',
    // color will come from getNoteColorStyle
  },
  noteDateText: {
    fontSize: 12,
    color: '#6B7280', // Medium gray
  },
  noteContentText: {
    fontSize: 14,
    lineHeight: 20,
    // color will come from getNoteColorStyle
  },
  noteActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)', // very light border
  },
  noteActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 12,
  },
  noteActionText: {
    fontSize: 14,
    marginLeft: 4,
  },
});

const NotesScreen = () => {
  const { userData } = useUserData();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[]>([]);
  const [subject, setSubject] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'alphabetical'>('newest');
  const noteContentInputRef = useRef<TextInput>(null);

  const fetchNotes = useCallback(async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', currentUserId)
        .order(sortOrder === 'newest' ? 'created_at' : 'subject', {
          ascending: sortOrder === 'alphabetical',
        });

      if (fetchError) throw fetchError;
      setNotes((data as Note[]) || []);
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, sortOrder]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      } else {
        setError('User not authenticated. Cannot load notes.');
        setIsLoading(false);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchNotes();
    }
  }, [currentUserId, fetchNotes]);

  const handleAddOrUpdateNote = async () => {
    if (!subject.trim() || !noteContent.trim() || !currentUserId) return;

    setIsLoading(true);
    setError(null);

    try {
      if (isEditing && editingId) {
        const { error: updateError } = await supabase
          .from('notes')
          .update({
            subject: subject.trim(),
            note: noteContent.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)
          .eq('user_id', currentUserId);

        if (updateError) throw updateError;
        setNotes(prevNotes =>
          prevNotes.map(n =>
            n.id === editingId
              ? { ...n, subject: subject.trim(), note: noteContent.trim(), updated_at: new Date().toISOString() }
              : n
          )
        );
        setIsEditing(false);
        setEditingId(null);
      } else {
        const randomColorIndex = Math.floor(Math.random() * NOTE_COLORS.length);
        const newNotePayload = {
          subject: subject.trim(),
          note: noteContent.trim(),
          user_id: currentUserId,
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('notes')
          .insert(newNotePayload)
          .select()
          .single();

        if (insertError) throw insertError;
        if (insertedData) {
          setNotes(prevNotes => [insertedData as Note, ...prevNotes]);
        }
      }
      setSubject('');
      setNoteContent('');
    } catch (err: any) {
      console.error('Error saving note:', err);
      setError('Failed to save note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditNote = (item: Note) => {
    setSubject(item.subject);
    setNoteContent(item.note);
    setIsEditing(true);
    setEditingId(item.id);
  };

  const handleDeleteNote = (id: string) => {
    if (!currentUserId) return;
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            setError(null);
            try {
              const { error: deleteError } = await supabase
                .from('notes')
                .delete()
                .eq('id', id)
                .eq('user_id', currentUserId);
              if (deleteError) throw deleteError;
              setNotes(prevNotes => prevNotes.filter(n => n.id !== id));
            } catch (err: any) {
              console.error('Error deleting note:', err);
              setError('Failed to delete note. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const cancelEdit = () => {
    setSubject('');
    setNoteContent('');
    setIsEditing(false);
    setEditingId(null);
  };

  const filteredNotes = notes.filter(note =>
    note.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.note.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedNotes = filteredNotes.reduce((groups, note) => {
    const group = groups[note.subject] || [];
    return {
      ...groups,
      [note.subject]: [...group, note],
    };
  }, {} as Record<string, Note[]>);

  const getNoteColorStyle = (note: Note) => {
    // This is a simplified color assignment. 
    // You might want to store a color index/key in your DbNote or parse the 'color' field if it was stored as JSON
    const hash = (note.id || '').split('').reduce((acc: number, char: string) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const colorIndex = Math.abs(hash % NOTE_COLORS.length);
    return NOTE_COLORS[colorIndex];
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.screen}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Adjust 60 as needed, e.g., header height
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>My Notes</Text>
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              placeholder="Search notes..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={styles.searchInput}
            />
            {searchTerm ? (
              <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearSearchButton}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            ) : null}
          </View>
          {/* Sort Options UI */}
          <View style={styles.sortOptionsContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <TouchableOpacity onPress={() => setSortOrder('newest')} style={[styles.sortButton, sortOrder === 'newest' && styles.activeSortButton]}>
              <Text style={[styles.sortButtonText, sortOrder === 'newest' && styles.activeSortButtonText]}>Newest</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSortOrder('alphabetical')} style={[styles.sortButton, sortOrder === 'alphabetical' && styles.activeSortButton]}>
              <Text style={[styles.sortButtonText, sortOrder === 'alphabetical' && styles.activeSortButtonText]}>A-Z (Subject)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            placeholder="Subject"
            value={subject}
            onChangeText={setSubject}
            style={[styles.input, styles.subjectInput]}
            returnKeyType="next"
            onSubmitEditing={() => noteContentInputRef.current?.focus()}
            blurOnSubmit={false}
          />
          <TextInput
            placeholder="Write your note..."
            ref={noteContentInputRef}
            value={noteContent}
            onChangeText={setNoteContent}
            style={[styles.input, styles.noteInput]}
            multiline
          />
          <View style={styles.formButtonsContainer}>
            {isEditing && (
              <TouchableOpacity onPress={cancelEdit} style={[styles.button, styles.cancelButton]}>
                <Feather name="x" size={18} color="#374151" />
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={handleAddOrUpdateNote} 
              style={[styles.button, isEditing ? styles.updateButton : styles.addButton]} 
              disabled={isLoading}
            >
              {isLoading && !isEditing ? <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} /> : 
                <Feather name={isEditing ? "edit-2" : "plus"} size={18} color="#fff" style={styles.buttonIcon}/>
              }
              <Text style={styles.buttonText}>{isEditing ? 'Update Note' : 'Add Note'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
        {isLoading && notes.length === 0 && <ActivityIndicator size="large" color="#4F46E5" style={styles.mainLoader} />}

        <ScrollView contentContainerStyle={styles.notesListContainer}>
          {Object.keys(groupedNotes).length === 0 && !isLoading ? (
            <View style={styles.emptyStateContainer}>
              <Feather name="book-open" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No notes yet. Add your first note!</Text>
            </View>
          ) : (
            Object.entries(groupedNotes).map(([groupSubject, notesInGroup]) => (
              <View key={groupSubject} style={styles.subjectGroupContainer}>
                <Text style={styles.subjectGroupTitle}>{groupSubject}</Text>
                {notesInGroup.map((item) => {
                  const noteStyle = getNoteColorStyle(item);
                  return (
                    <View key={item.id} style={[styles.noteItemContainer, { backgroundColor: noteStyle.bg, borderColor: noteStyle.border }]}>
                      <View style={styles.noteHeader}>
                        {/* <Text style={[styles.noteSubjectText, { color: noteStyle.text }]}>{item.subject}</Text> */}
                        <Text style={styles.noteDateText}>{new Date(item.created_at || item.updated_at || Date.now()).toLocaleDateString()}</Text>
                      </View>
                      <Text style={[styles.noteContentText, { color: noteStyle.text }]}>{item.note}</Text>
                      <View style={styles.noteActionsContainer}>
                        <TouchableOpacity onPress={() => handleEditNote(item)} style={styles.noteActionButton}>
                          <Feather name="edit-2" size={16} color="#2563EB" />
                          <Text style={[styles.noteActionText, { color: '#2563EB' }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteNote(item.id)} style={styles.noteActionButton}>
                          <Feather name="trash-2" size={16} color="#DC2626" />
                          <Text style={[styles.noteActionText, { color: '#DC2626' }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default NotesScreen;

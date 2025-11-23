import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

interface Video {
  id: string;
  title: string;
  subject: string;
  watched: boolean;
  url: string;
  duration?: string;
}

const initialVideos: Video[] = [
  { id: '1', title: 'Limit ve Süreklilik - Giriş', subject: 'Matematik', watched: false, url: 'https://www.youtube.com/watch?v=5fekZ4ZlGcM', duration: '12:35' },
  { id: '2', title: 'Newton Yasaları - Örnek Soru Çözümleri', subject: 'Fizik', watched: true, url: 'https://www.youtube.com/watch?v=tdEUFAlgwMs', duration: '22:10' },
  { id: '3', title: 'Mol Kavramı - Temel Bilgiler', subject: 'Kimya', watched: false, url: 'https://www.youtube.com/watch?v=WTwmHi1c1jw', duration: '15:00' },
  { id: '4', title: 'Hücre Organelleri ve Görevleri', subject: 'Biyoloji', watched: false, url: 'https://www.youtube.com/watch?v=DhQENFvI7s8' },
];

const colors = {
  primary: '#4A90E2', // Example: primary-600, blue-500
  primaryDark: '#357ABD', // Example: primary-700
  white: '#FFFFFF',
  pageBackground: '#F3F4F6', // A light gray for the page background
  cardBackground: '#FFFFFF',
  textDark: '#1F2937', // Example: text-gray-800
  textMedium: '#6B7280', // Example: text-gray-500
  textLight: '#9CA3AF', // Example: text-gray-400
  green: '#10B981', // Example: green-500, green-600
  border: '#D1D5DB', // Example: border-gray-300
  iconDefault: '#4A90E2', // primary-600 for icon
};

const StudyPlanVideoTrackerScreen: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>(initialVideos);

  const toggleWatched = (id: string) => {
    setVideos(
      videos.map(video =>
        video.id === id ? { ...video, watched: !video.watched } : video
      )
    );
  };

  const handleOpenVideo = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Çalışma Planı - Video Takibi</Text>

      {videos.length > 0 ? (
        <View style={styles.videoListContainer}>
          {videos.map(video => (
            <View
              key={video.id}
              style={[styles.videoItem, video.watched && styles.videoItemWatched]}
            >
              <View style={styles.videoInfoContainer}>
                <View style={styles.titleRow}>
                  <Feather 
                    name="video" 
                    size={22} 
                    color={video.watched ? colors.green : colors.iconDefault} 
                    style={styles.videoIcon}
                  />
                  <Text style={styles.videoTitle}>{video.title}</Text>
                </View>
                <Text style={styles.videoSubject}>
                  {video.subject}{video.duration ? ` - ${video.duration}` : ''}
                </Text>
              </View>

              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleOpenVideo(video.url)}
                >
                  <Feather name="external-link" size={16} color={colors.textMedium} style={styles.actionIcon} />
                  <Text style={styles.actionButtonText}>İzle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    video.watched ? styles.watchedButton : styles.markWatchedButton,
                  ]}
                  onPress={() => toggleWatched(video.id)}
                >
                  <Feather 
                    name={video.watched ? "check-circle" : "circle"} 
                    size={16} 
                    color={colors.white} 
                    style={styles.actionIcon} 
                  />
                  <Text style={styles.markWatchedButtonText}>
                    {video.watched ? 'İzlendi' : 'İşaretle'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Feather name="video" size={50} color={colors.textLight} style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateText}>Takip edilecek video bulunmamaktadır.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.pageBackground,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 24,
  },
  videoListContainer: {
    // space-y-4 equivalent by marginBottom on videoItem
  },
  videoItem: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 16, // p-5
    marginBottom: 16, // for space-y-4
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    // transition-all duration-300 hover:shadow-lg - hover is not applicable, opacity is used
  },
  videoItemWatched: {
    opacity: 0.7,
  },
  videoInfoContainer: {
    flexGrow: 1,
    marginBottom: 12, // mb-4 sm:mb-0
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4, // mb-1
  },
  videoIcon: {
    marginRight: 12, // mr-3
  },
  videoTitle: {
    fontSize: 18, // text-xl
    fontWeight: '600',
    color: colors.textDark,
  },
  videoSubject: {
    fontSize: 14,
    color: colors.textMedium,
    marginLeft: 34, // to align with title, approx (22 icon size + 12 margin)
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // space-x-3 equivalent by marginRight on first button
    // w-full sm:w-auto - on mobile, it will behave like w-full if buttons are wide enough or wrap
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginRight: 12, // for space-x-3 on the first button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  actionIcon: {
    marginRight: 6, // mr-2
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMedium,
  },
  markWatchedButton: {
    backgroundColor: colors.primary, // blue-500
    borderColor: colors.primary,
  },
  watchedButton: {
    backgroundColor: colors.green, // green-500
    borderColor: colors.green,
  },
  markWatchedButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: colors.textMedium,
    textAlign: 'center',
  },
});

export default StudyPlanVideoTrackerScreen;

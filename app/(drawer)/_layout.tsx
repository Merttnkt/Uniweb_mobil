import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';

// Define a type for valid Ionicons names
type IoniconsName = keyof typeof Ionicons.glyphMap;

type NavigationItem = {
  name: string;
  label: string;
  icon: IoniconsName;
};

// Define navigation items with proper icon types
// Only include items for which a .tsx file exists in app/(drawer)/
const navigationItems = [
  { name: 'index', label: 'Dashboard', icon: 'home-outline' as const },
  { name: 'universityGoal', label: 'Hedef Üniversite', icon: 'school-outline' as const },
  { name: 'examTracking', label: 'Sınav Takibi', icon: 'document-text-outline' as const },
  { name: 'examAnalysis', label: 'Sınav Analizi', icon: 'analytics-outline' as const },
  { name: 'netTracker', label: 'Net Takibi', icon: 'trending-up-outline' as const },
  { name: 'notes', label: 'Notlar', icon: 'book-outline' as const },
  { name: 'statistics', label: 'İstatistikler', icon: 'stats-chart-outline' as const },
  { name: 'study-plan', label: 'Çalışma Planı', icon: 'calendar-outline' as const },
  { name: 'automaticScheduler', label: 'Otomatik Planlayıcı', icon: 'timer-outline' as const },
  { name: 'profile', label: 'Profil', icon: 'person-circle-outline' as const },
  { name: 'userProgressSummary', label: 'İlerleme Özeti', icon: 'podium-outline' as const },
  { name: 'sampleQuestionsScreen', label: 'Örnek Sorular', icon: 'search-outline' as const },
  { name: 'studyPlanVideoTrackerScreen', label: 'Video Takibi', icon: 'play-circle-outline' as const },
  { name: 'aiRecommendations', label: 'Yapay Zeka Önerileri', icon: 'bulb-outline' as const },

  // Add other existing screens here if they have corresponding .tsx files
  // e.g., if you create 'ai-recommendations.tsx', you can add:
  // { name: 'ai-recommendations', label: 'AI Tavsiyeleri', icon: 'bulb-outline' as const },
];

// Only include routes that exist in the file system in app/(drawer)/
const validRoutes = [
  'index',
  'universityGoal',
  'examTracking',
  'examAnalysis',
  'netTracker',
  'notes',
  'profile',
  'statistics',
  'study-plan',
  'automaticScheduler',
  'userProgressSummary',
  'sampleQuestionsScreen',
  'studyPlanVideoTrackerScreen',
  'aiRecommendations',
  // 'login', 'register' are typically outside the (drawer) group
];

const navigation = navigationItems.filter(item => validRoutes.includes(item.name));

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerTintColor: '#000',
        drawerActiveTintColor: '#007AFF',
        drawerInactiveTintColor: '#8E8E93',
        drawerLabelStyle: {
          marginLeft: 0, // Adjusted from -20
          fontSize: 15,   // Slightly adjusted font size for clarity
        },
        drawerItemStyle: {
          marginVertical: 5, // Add some vertical spacing between items
        }
      }}
    >
      {navigation.map((item) => (
        <Drawer.Screen
          key={item.name}
          name={item.name} // Burası dosya adıyla eşleşmeli (örn: 'notes.tsx')
          options={{
            drawerLabel: item.label,
            title: item.label, // Sayfanın üstündeki başlık
            drawerIcon: ({ color, size }) => (
              <Ionicons name={item.icon} size={size} color={color} style={{ marginRight: 8 }} /> // Added marginRight to icon
            ),
          }}
        />
      ))}
    </Drawer>
  );
}
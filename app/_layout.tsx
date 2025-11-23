// app/_layout.tsx

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { UserDataProvider } from '../contexts/UserDataContext';

// Import the necessary polyfills for React Native Web
if (typeof window !== 'undefined') {
  // @ts-ignore
  window._frameTimestamp = null;
}

// Bu component auth durumunu kontrol eder ve yönlendirmeyi yapar.
function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(drawer)';
    const inAuthPage = segments[0] === 'login' || segments[0] === 'register';

    if (!user && inAuthGroup) {
      // Redirect to login if user is not authenticated and trying to access protected routes
      router.replace('/login');
    } else if (user && inAuthPage) {
      // Redirect to home if user is authenticated and trying to access auth pages
      // @ts-ignore - Workaround for expo-router type issue with group routes
      router.replace('/(drawer)');
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        {/* Ana uygulama (Drawer Navigator) */}
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />

        {/* Auth Ekranları */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <UserDataProvider>
        <ThemeProvider value={theme}>
          <RootLayoutNav />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </UserDataProvider>
    </AuthProvider>
  );
}
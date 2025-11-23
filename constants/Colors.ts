/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#f9fafb', // Slightly off-white background
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // New colors for UI components
    primary: tintColorLight,
    card: '#ffffff', // White cards
    textPrimary: '#11181C', // Main text
    textSecondary: '#6b7280', // Lighter grey for secondary text
    border: '#e5e7eb',
    surface: '#ffffff',      // Added surface color
    attention: '#f59e0b',   // Added attention color (amber)
    error: '#ef4444',        // Added error color (red)
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // New colors for UI components
    primary: tintColorLight, // Keeping primary color for branding
    card: '#1f2937', // Darker card background
    textPrimary: '#ECEDEE', // Main text
    textSecondary: '#9ca3af', // Lighter grey for secondary text
    border: '#374151',
    surface: '#1f2937',      // Added surface color
    attention: '#f59e0b',   // Added attention color (amber)
    error: '#f87171',        // Added error color (lighter red for dark mode)
  },
};

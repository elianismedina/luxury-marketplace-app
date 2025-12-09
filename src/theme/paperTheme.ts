import { Platform } from "react-native";
import {
  MD3DarkTheme,
  MD3LightTheme,
  configureFonts,
  type MD3Theme,
} from "react-native-paper";

const fontFamily = Platform.select({
  ios: "SpaceMono",
  android: "SpaceMono",
  default: "SpaceMono",
});

const customFonts = configureFonts({
  config: {
    displayLarge: {
      fontFamily,
      fontWeight: "400",
    },
    displayMedium: {
      fontFamily,
      fontWeight: "400",
    },
    displaySmall: {
      fontFamily,
      fontWeight: "400",
    },
    headlineLarge: {
      fontFamily,
      fontWeight: "400",
    },
    headlineMedium: {
      fontFamily,
      fontWeight: "400",
    },
    headlineSmall: {
      fontFamily,
      fontWeight: "400",
    },
    titleLarge: {
      fontFamily,
      fontWeight: "600",
    },
    titleMedium: {
      fontFamily,
      fontWeight: "600",
    },
    titleSmall: {
      fontFamily,
      fontWeight: "600",
    },
    labelLarge: {
      fontFamily,
      fontWeight: "500",
    },
    labelMedium: {
      fontFamily,
      fontWeight: "500",
    },
    labelSmall: {
      fontFamily,
      fontWeight: "500",
    },
    bodyLarge: {
      fontFamily,
      fontWeight: "400",
    },
    bodyMedium: {
      fontFamily,
      fontWeight: "400",
    },
    bodySmall: {
      fontFamily,
      fontWeight: "400",
    },
  },
});

export const paperLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#FF0000", // Primary red
    onPrimary: "#ffffff",
    primaryContainer: "#FFE5E5",
    onPrimaryContainer: "#CC0000",
    secondary: "#0055D4", // Secondary blue
    onSecondary: "#ffffff",
    secondaryContainer: "#E5F0FF",
    onSecondaryContainer: "#0044AA",
    tertiary: "#FF3333",
    onTertiary: "#ffffff",
    background: "#FFFFFF",
    surface: "#FFFFFF",
    onSurface: "#1F2937",
    surfaceVariant: "#F9FAFB",
    outline: "#E5E7EB",
    error: "#EF4444",
    onError: "#ffffff",
  },
  fonts: customFonts,
};

export const paperDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#FF3333", // Primary red (lighter for dark mode)
    onPrimary: "#ffffff",
    primaryContainer: "#CC0000",
    onPrimaryContainer: "#FFE5E5",
    secondary: "#3377E6", // Secondary blue (lighter for dark mode)
    onSecondary: "#ffffff",
    secondaryContainer: "#0044AA",
    onSecondaryContainer: "#E5F0FF",
    tertiary: "#FF6666",
    onTertiary: "#000000",
    background: "#1F2937",
    surface: "#1c1b1f",
    onSurface: "#F9FAFB",
    surfaceVariant: "#374151",
    outline: "#6B7280",
    error: "#F87171",
    onError: "#ffffff",
  },
  fonts: customFonts,
};

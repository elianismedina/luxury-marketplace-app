import { Platform } from "react-native";
import {
  MD3DarkTheme,
  MD3LightTheme,
  configureFonts,
  type MD3Theme,
} from "react-native-paper";

import Colors from "@/constants/Colors";

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
    primary: Colors.light.tint,
    onPrimary: "#ffffff",
    secondary: "#c67c4e",
    onSecondary: "#ffffff",
    tertiary: "#ffb703",
    onTertiary: "#261400",
    background: Colors.light.background,
    surface: "#f9f6f1",
    onSurface: Colors.light.text,
    surfaceVariant: "#f0e6d8",
    outline: "#8c7c65",
  },
  fonts: customFonts,
};

export const paperDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.dark.tint,
    onPrimary: "#000000",
    secondary: "#f4a460",
    onSecondary: "#301200",
    tertiary: "#ffb703",
    onTertiary: "#261400",
    background: Colors.dark.background,
    surface: "#1c1b1f",
    onSurface: Colors.dark.text,
    surfaceVariant: "#3b3226",
    outline: "#cfc2b3",
  },
  fonts: customFonts,
};

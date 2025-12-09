// Theme definition for the luxury marketplace app
export const theme = {
  colors: {
    primary: "#FF0000",
    secondary: "#0055D4",

    // Derived primary colors
    primaryLight: "#FF3333",
    primaryDark: "#CC0000",
    primaryFaded: "rgba(255, 0, 0, 0.1)",

    // Derived secondary colors
    secondaryLight: "#3377E6",
    secondaryDark: "#0044AA",
    secondaryFaded: "rgba(0, 85, 212, 0.1)",

    // Neutral colors
    background: "#FFFFFF",
    backgroundSecondary: "#F9FAFB",
    surface: "#FFFFFF",
    surfaceVariant: "#F3F4F6",

    // Text colors
    text: "#1F2937",
    textSecondary: "#6B7280",
    textDisabled: "#9CA3AF",
    textOnPrimary: "#FFFFFF",
    textOnSecondary: "#FFFFFF",

    // Semantic colors
    success: "#10B981",
    successLight: "#34D399",
    warning: "#F59E0B",
    warningLight: "#FBBF24",
    error: "#EF4444",
    errorLight: "#F87171",
    info: "#3B82F6",
    infoLight: "#60A5FA",

    // Border colors
    border: "#E5E7EB",
    borderLight: "#F3F4F6",
    borderDark: "#D1D5DB",

    // Interactive states
    hover: "rgba(255, 0, 0, 0.08)",
    active: "rgba(255, 0, 0, 0.12)",
    disabled: "#E5E7EB",

    // Overlay
    overlay: "rgba(0, 0, 0, 0.5)",
    overlayLight: "rgba(0, 0, 0, 0.3)",
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },

  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};

export type Theme = typeof theme;

// TypeScript declaration for styled-components
declare module "styled-components/native" {
  export interface DefaultTheme extends Theme {}
}

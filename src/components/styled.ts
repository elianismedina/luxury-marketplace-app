// @ts-nocheck - Styled components theme types are handled by DefaultTheme interface
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";

// Containers
export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;

export const ScrollContainer = styled.ScrollView`
  flex: 1;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;

export const SafeContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;

export const CenterContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;

export const PaddedContainer = styled.View`
  flex: 1;
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;

// Cards & Surfaces
export const Card = styled.View<{ elevated?: boolean }>`
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.surface};
  border-radius: ${({ theme }: { theme: DefaultTheme }) =>
    theme.borderRadius.lg}px;
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
  ${({ elevated, theme }: { elevated?: boolean; theme: DefaultTheme }) =>
    elevated
      ? `
    shadow-color: ${theme.shadows.md.shadowColor};
    shadow-offset: ${theme.shadows.md.shadowOffset.width}px ${theme.shadows.md.shadowOffset.height}px;
    shadow-opacity: ${theme.shadows.md.shadowOpacity};
    shadow-radius: ${theme.shadows.md.shadowRadius}px;
    elevation: ${theme.shadows.md.elevation};
  `
      : ""}
`;

export const Surface = styled.View`
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.surface};
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
`;

// Text Components
export const Title = styled.Text<{
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
}>`
  color: ${({ theme, color }: { theme: DefaultTheme; color?: string }) =>
    color || theme.colors.text};
  font-size: ${({
    theme,
    size = "lg",
  }: {
    theme: DefaultTheme;
    size?: "sm" | "md" | "lg" | "xl";
  }) => {
    const sizes: Record<"sm" | "md" | "lg" | "xl", number> = {
      sm: theme.fontSize.lg,
      md: theme.fontSize.xl,
      lg: theme.fontSize.xxl,
      xl: theme.fontSize.xxxl,
    };
    return sizes[size];
  }}px;
  font-weight: ${({ theme }: { theme: DefaultTheme }) => theme.fontWeight.bold};
  margin-bottom: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.sm}px;
`;

export const Subtitle = styled.Text<{ color?: string }>`
  color: ${({ theme, color }: { theme: DefaultTheme; color?: string }) =>
    color || theme.colors.textSecondary};
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.fontSize.md}px;
  font-weight: ${({ theme }: { theme: DefaultTheme }) =>
    theme.fontWeight.medium};
  margin-bottom: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.xs}px;
`;

export const BodyText = styled.Text<{ color?: string; align?: string }>`
  color: ${({ theme, color }: { theme: DefaultTheme; color?: any }) =>
    color || theme.colors.text};
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.fontSize.md}px;
  line-height: ${({ theme }: { theme: DefaultTheme }) =>
    theme.fontSize.md * 1.5}px;
  ${({ align }) => (align ? `text-align: ${align};` : "")}
`;

export const Caption = styled.Text<{ color?: string }>`
  color: ${({ theme, color }: { theme: DefaultTheme; color?: any }) =>
    color || theme.colors.textSecondary};
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.fontSize.sm}px;
`;

export const ErrorText = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.error};
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.fontSize.sm}px;
  margin-top: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.xs}px;
`;

// Buttons
export const PrimaryButton = styled.TouchableOpacity<{ disabled?: boolean }>`
  background-color: ${({
    theme,
    disabled,
  }: {
    theme: DefaultTheme;
    disabled?: any;
  }) => (disabled ? theme.colors.disabled : theme.colors.primary)};
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px
    ${({ theme }: { theme: DefaultTheme }) => theme.spacing.lg}px;
  border-radius: ${({ theme }: { theme: DefaultTheme }) =>
    theme.borderRadius.md}px;
  align-items: center;
  justify-content: center;
  ${({ theme }: { theme: DefaultTheme }) => `
    shadow-color: ${theme.shadows.sm.shadowColor};
    shadow-offset: ${theme.shadows.sm.shadowOffset.width}px ${theme.shadows.sm.shadowOffset.height}px;
    shadow-opacity: ${theme.shadows.sm.shadowOpacity};
    shadow-radius: ${theme.shadows.sm.shadowRadius}px;
    elevation: ${theme.shadows.sm.elevation};
  `}
`;

export const SecondaryButton = styled.TouchableOpacity<{ disabled?: boolean }>`
  background-color: ${({
    theme,
    disabled,
  }: {
    theme: DefaultTheme;
    disabled?: any;
  }) => (disabled ? theme.colors.disabled : theme.colors.secondary)};
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px
    ${({ theme }: { theme: DefaultTheme }) => theme.spacing.lg}px;
  border-radius: ${({ theme }: { theme: DefaultTheme }) =>
    theme.borderRadius.md}px;
  align-items: center;
  justify-content: center;
  ${({ theme }: { theme: DefaultTheme }) => `
    shadow-color: ${theme.shadows.sm.shadowColor};
    shadow-offset: ${theme.shadows.sm.shadowOffset.width}px ${theme.shadows.sm.shadowOffset.height}px;
    shadow-opacity: ${theme.shadows.sm.shadowOpacity};
    shadow-radius: ${theme.shadows.sm.shadowRadius}px;
    elevation: ${theme.shadows.sm.elevation};
  `}
`;

export const OutlineButton = styled.TouchableOpacity<{ disabled?: boolean }>`
  background-color: transparent;
  border-width: 2px;
  border-color: ${({
    theme,
    disabled,
  }: {
    theme: DefaultTheme;
    disabled?: any;
  }) => (disabled ? theme.colors.disabled : theme.colors.primary)};
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px
    ${({ theme }: { theme: DefaultTheme }) => theme.spacing.lg}px;
  border-radius: ${({ theme }: { theme: DefaultTheme }) =>
    theme.borderRadius.md}px;
  align-items: center;
  justify-content: center;
`;

export const ButtonText = styled.Text<{
  variant?: "primary" | "secondary" | "outline";
}>`
  color: ${({ theme, variant = "primary" }) => {
    if (variant === "outline") return theme.colors.primary;
    if (variant === "secondary") return theme.colors.textOnSecondary;
    return theme.colors.textOnPrimary;
  }};
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.fontSize.md}px;
  font-weight: ${({ theme }: { theme: DefaultTheme }) =>
    theme.fontWeight.semibold};
`;

// Input Components
export const InputContainer = styled.View`
  margin-bottom: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
`;

export const InputLabel = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme }: { theme: DefaultTheme }) =>
    theme.fontWeight.medium};
  margin-bottom: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.xs}px;
`;

export const Input = styled.TextInput<{ hasError?: boolean }>`
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.surface};
  border-width: 1px;
  border-color: ${({
    theme,
    hasError,
  }: {
    theme: DefaultTheme;
    hasError?: any;
  }) => (hasError ? theme.colors.error : theme.colors.border)};
  border-radius: ${({ theme }: { theme: DefaultTheme }) =>
    theme.borderRadius.md}px;
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.fontSize.md}px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
`;

// Layout Components
export const Row = styled.View<{
  justify?: string;
  align?: string;
  gap?: number;
}>`
  flex-direction: row;
  ${({ justify }) => (justify ? `justify-content: ${justify};` : "")}
  ${({ align }) => (align ? `align-items: ${align};` : "")}
  ${({ gap, theme }) =>
    gap
      ? `gap: ${theme.spacing[gap as keyof typeof theme.spacing] || gap}px;`
      : ""}
`;

export const Column = styled.View<{
  justify?: string;
  align?: string;
  gap?: number;
}>`
  flex-direction: column;
  ${({ justify }) => (justify ? `justify-content: ${justify};` : "")}
  ${({ align }) => (align ? `align-items: ${align};` : "")}
  ${({ gap, theme }) =>
    gap
      ? `gap: ${theme.spacing[gap as keyof typeof theme.spacing] || gap}px;`
      : ""}
`;

export const Spacer = styled.View<{ size?: "xs" | "sm" | "md" | "lg" | "xl" }>`
  height: ${({ theme, size = "md" }) => theme.spacing[size]}px;
`;

// Divider
export const Divider = styled.View`
  height: 1px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.border};
  margin: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px 0;
`;

// Badge
export const Badge = styled.View<{
  variant?: "primary" | "secondary" | "success" | "warning" | "error";
}>`
  background-color: ${({ theme, variant = "primary" }) => {
    switch (variant) {
      case "secondary":
        return theme.colors.secondary;
      case "success":
        return theme.colors.success;
      case "warning":
        return theme.colors.warning;
      case "error":
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  }};
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.xs}px
    ${({ theme }: { theme: DefaultTheme }) => theme.spacing.sm}px;
  border-radius: ${({ theme }: { theme: DefaultTheme }) =>
    theme.borderRadius.full}px;
  align-self: flex-start;
`;

export const BadgeText = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textOnPrimary};
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.fontSize.xs}px;
  font-weight: ${({ theme }: { theme: DefaultTheme }) =>
    theme.fontWeight.semibold};
`;

// Image Components
export const CircleImage = styled.Image<{ size?: number }>`
  width: ${({ size = 60 }) => size}px;
  height: ${({ size = 60 }) => size}px;
  border-radius: ${({ size = 60 }) => size / 2}px;
  border-width: 2px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
`;

export const RoundedImage = styled.Image<{ width?: number; height?: number }>`
  width: ${({ width = 100 }) => width}px;
  height: ${({ height = 100 }) => height}px;
  border-radius: ${({ theme }: { theme: DefaultTheme }) =>
    theme.borderRadius.md}px;
`;

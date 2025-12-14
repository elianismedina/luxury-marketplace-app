import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Dimensions,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button, Card, Paragraph, Title, useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.75;

export const Sidebar: React.FC<SidebarProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const insets = useSafeAreaInsets();

  // Animation values
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateX.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0.5, { duration: 300 });
    } else {
      translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const handleLogout = async () => {
    await logout();
    // Close sidebar first?
    onClose();
    router.replace("/welcome");
  };

  if (!visible && translateX.value === width) {
    // Optimization: render nothing if closed and animation finished?
    // Hard to sync without onFinished callback.
    // For now, pointerEvents box-none on container + opacity control is enough visually.
    // actually, we can return null if not visible AND animation done?
    // simplified: just keep it mounted but off-screen.
  }

  return (
    <View
      style={[
        styles.container,
        !visible ? { pointerEvents: "none" } : undefined,
      ]}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      {/* Sidebar Content */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
            backgroundColor: "#1E1E1E", // Hardcoded dark match or theme.colors.surface
            borderRightColor: theme.colors.primary,
          },
          animatedStyle,
        ]}
      >
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Más opciones</Title>
            <Paragraph style={styles.paragraph}>
              {user
                ? `Sesión activa como ${user.name || user.email}.`
                : "No tienes una sesión activa en este momento."}
            </Paragraph>
            <Paragraph style={styles.secondary}>
              Accede a configuraciones adicionales y gestiona tu cuenta desde
              aquí.
            </Paragraph>
          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button
              mode="outlined"
              onPress={handleLogout}
              disabled={!user || loading}
              loading={loading}
              textColor={theme.colors.error}
              style={{ borderColor: theme.colors.error, flex: 1 }}
            >
              Cerrar Sesión
            </Button>
          </Card.Actions>
        </Card>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999, // High z-index to cover tabs
    flexDirection: "row",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    paddingHorizontal: 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  card: {
    backgroundColor: "transparent",
    elevation: 0,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  paragraph: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 8,
  },
  secondary: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  actions: {
    marginTop: 32,
  },
});

import { useAuth } from "@/context/AuthContext";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Paragraph, Text, Title, useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SignOutButton } from "./SignOutButton";

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
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Title style={styles.userName}>{user?.name || "Usuario"}</Title>
            <Paragraph style={styles.userEmail}>
              {user?.email || "Invitado"}
            </Paragraph>
          </View>
        </View>

        <ScrollView
          style={styles.menuContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Sección: GESTIÓN */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              GESTIÓN
            </Text>

            <MenuItem
              icon="box"
              label="Mis Pedidos"
              onPress={() =>
                router.push({
                  pathname: "/sidebar-screens/generic",
                  params: { title: "Mis Pedidos" },
                })
              }
            />
            <MenuItem
              icon="calendar-alt"
              label="Mis Citas"
              onPress={() =>
                router.push({
                  pathname: "/sidebar-screens/generic",
                  params: { title: "Mis Citas" },
                })
              }
            />
            <MenuItem
              icon="book"
              label="Bitácora de Mantenimiento"
              onPress={() =>
                router.push({
                  pathname: "/sidebar-screens/generic",
                  params: { title: "Bitácora" },
                })
              }
            />
          </View>

          {/* Sección: RECOMENDADOS */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              RECOMENDADOS
            </Text>

            <MenuItem
              icon="heart"
              label="Favoritos"
              onPress={() =>
                router.push({
                  pathname: "/sidebar-screens/generic",
                  params: { title: "Favoritos" },
                })
              }
            />
            <MenuItem
              icon="ticket-alt"
              label="Mis Cupones"
              onPress={() =>
                router.push({
                  pathname: "/sidebar-screens/generic",
                  params: { title: "Mis Cupones" },
                })
              }
            />
            <MenuItem
              icon="tools"
              label="Talleres Aliados"
              onPress={() =>
                router.push({
                  pathname: "/sidebar-screens/generic",
                  params: { title: "Talleres Aliados" },
                })
              }
            />
          </View>

          {/* Sección: SOPORTE */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              SOPORTE
            </Text>

            <MenuItem
              icon="comments"
              label="Chat con Especialista"
              onPress={() =>
                router.push({
                  pathname: "/sidebar-screens/generic",
                  params: { title: "Chat Soporte" },
                })
              }
            />
            <MenuItem
              icon="cog"
              label="Configuración"
              onPress={() =>
                router.push({
                  pathname: "/sidebar-screens/generic",
                  params: { title: "Configuración" },
                })
              }
            />
          </View>

          <View
            style={[
              styles.section,
              { borderBottomWidth: 0, paddingVertical: 10 },
            ]}
          >
            <SignOutButton />
          </View>
        </ScrollView>
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
  sectionTitle: {
    fontSize: 12,
    marginTop: 24,
    marginBottom: 10,
    letterSpacing: 1,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 5,
  },
  header: {
    marginBottom: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  userInfo: {},
  userName: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  userEmail: {
    color: "#aaa",
    fontSize: 14,
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  menuItemText: {
    color: "white",
    fontSize: 16,
    marginLeft: 15,
  },
});

const MenuItem = ({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) => (
  <TouchableWithoutFeedback onPress={onPress}>
    <View style={styles.menuItem}>
      <FontAwesome5
        name={icon}
        size={20}
        color="#ccc"
        style={{ width: 25, textAlign: "center" }}
      />
      <Text style={styles.menuItemText}>{label}</Text>
    </View>
  </TouchableWithoutFeedback>
);

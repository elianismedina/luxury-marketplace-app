import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, Redirect, Tabs } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

import { Sidebar } from "@/components/Sidebar";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import { useAuth } from "@/context/AuthContext";
import { theme } from "@/theme/theme";
import { useState } from "react";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, initializing } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/welcome" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          // Disable the static render of the header on web
          // to prevent a hydration error in React Navigation v6.
          headerShown: useClientOnlyValue(false, true),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
            headerRight: () => (
              <Link href="/modal" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="info-circle"
                      size={25}
                      color="#FFFFFF"
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Buscar",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="search" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add-vehicle"
          options={{
            title: "Añadir",
            tabBarIcon: ({ color }) => <TabBarIcon name="plus" color={color} />,
          }}
        />
        <Tabs.Screen
          name="garage"
          options={{
            title: "Garaje",
            tabBarIcon: ({ color }) => (
              <Ionicons name="car-sport-outline" size={28} color={color} />
            ),
            headerRight: () => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 15,
                }}
              >
                <Pressable
                  onPress={() => {
                    if ((global as any).handleEditVehiculo) {
                      (global as any).handleEditVehiculo();
                    }
                  }}
                  style={{ marginRight: 20 }}
                >
                  {({ pressed }) => (
                    <FontAwesome
                      name="edit"
                      size={26}
                      color="#FFFFFF"
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => {
                    if ((global as any).handleDeleteVehiculos) {
                      (global as any).handleDeleteVehiculos();
                    }
                  }}
                >
                  {({ pressed }) => (
                    <FontAwesome
                      name="trash"
                      size={26}
                      color="#FFFFFF"
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setIsSidebarOpen(true);
            },
          }}
          options={{
            title: "Más",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="ellipsis-h" color={color} />
            ),
          }}
        />
      </Tabs>
      <Sidebar
        visible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

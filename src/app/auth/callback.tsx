import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const router = useRouter();
  const { refresh } = useAuth();

  useEffect(() => {
    const completeOAuth = async () => {
      try {
        console.log("OAuth callback: Starting session verification...");

        // Wait a bit for Appwrite to finalize the session
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Refresh user data to get the new session
        console.log("OAuth callback: Refreshing user session...");
        await refresh();

        console.log("OAuth callback: Session refreshed, navigating to home...");

        // Small delay to ensure state is updated
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Navigate to the main app
        router.replace("/(tabs)");
      } catch (error) {
        console.error("OAuth callback error:", error);
        // On error, go back to login
        router.replace("/login");
      }
    };

    completeOAuth();
  }, [refresh, router]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text variant="titleLarge" style={styles.text}>
          Completando inicio de sesión...
        </Text>
        <Text variant="bodyMedium" style={styles.subtext}>
          Por favor espera un momento
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  text: {
    color: "#FFFFFF",
    marginTop: 16,
  },
  subtext: {
    color: "#9CA3AF",
  },
});

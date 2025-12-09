import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  Image,
  ImageBackground,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

const introImage = require("../../assets/images/IntroImage.webp");
const logoImage = require("../../assets/images/zonaPitsLogo2.png");

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, initializing } = useAuth();

  useEffect(() => {
    if (!initializing && user) {
      router.replace("/(tabs)");
    }
  }, [initializing, user, router]);

  return (
    <ImageBackground
      source={introImage}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle={
            Platform.OS === "android" ? "light-content" : "dark-content"
          }
          translucent
          backgroundColor="transparent"
        />
        <View style={styles.overlay}>
          <View style={styles.content}>
            <Image
              source={logoImage}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>
              Tu y tu carro{"\n"}merecen el mundo.
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={() => router.push("/login?tab=register")}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Registrarme
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.push("/login?tab=login")}
              style={[styles.button, styles.outlinedButton]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              textColor="#ffffff"
            >
              Iniciar sesión
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: "space-between",
  },
  content: {
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "85%",
    maxWidth: 260,
    aspectRatio: 1,
    marginTop: 32,
    marginBottom: -80,
  },
  tagline: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "HomemadeApple",
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 0,
  },
  actions: {
    gap: 8,
  },
  button: {
    borderRadius: 999,
  },
  outlinedButton: {
    borderColor: "#ffffff",
  },
  buttonContent: {
    height: 52,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
});

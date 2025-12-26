import { useRouter } from "expo-router";
import {
  ImageBackground,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

const introImage = require("../../../assets/images/IntroImage.webp");

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, initializing } = useAuth();
  const { t } = useTranslation();

  // La redirección automática se maneja en _layout.tsx según el team/rol

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
            <Logo width="100%" height="100%" style={styles.logo} />
            <Text style={styles.tagline}>{t("welcome.tagline")}</Text>
          </View>
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={() => router.push("/sign-up")}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {t("welcome.register_btn")}
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.push("/sign-in")}
              style={[styles.button, styles.outlinedButton]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              textColor="#ffffff"
            >
              {t("welcome.login_btn")}
            </Button>
            <Button
              mode="text"
              onPress={() => router.push("/(auth)/(registro-aliado)/registro")}
              textColor="#ffffff"
              labelStyle={[
                styles.buttonLabel,
                { textDecorationLine: "underline" },
              ]}
            >
              {t("auth.aliado_register_link")}
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
    marginBottom: 4,
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

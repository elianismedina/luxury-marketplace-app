import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
// Import GoogleOneTap only on web
let GoogleOneTap: any = null;
if (Platform.OS === "web") {
  try {
    GoogleOneTap = require("@clerk/clerk-react").GoogleOneTap;
  } catch {}
}

export default function SignUpScreen() {
  const { loginWithGoogle, loading: authLoading } = useAuth();
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { t } = useTranslation();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      // You could add a Snackbar or Alert here
    } finally {
      setLoading(false);
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.root}>
            <View style={styles.logoContainer}>
              <Logo width={120} height={120} />
            </View>

            <Text style={styles.title}>
              {pendingVerification
                ? t("auth.verify_email_title")
                : t("auth.register_tab")}
            </Text>

            {pendingVerification ? (
              <View style={styles.form}>
                <Text style={styles.subtitle}>
                  {t("auth.verify_email_subtitle", { email: emailAddress })}
                </Text>
                <TextInput
                  label={t("auth.verification_code_label")}
                  value={code}
                  placeholder="123456"
                  onChangeText={setCode}
                  mode="outlined"
                  keyboardType="number-pad"
                  style={styles.input}
                  textColor="#FFFFFF"
                  left={<TextInput.Icon icon="key" />}
                />
                <Button
                  mode="contained"
                  onPress={onVerifyPress}
                  loading={loading}
                  style={styles.button}
                >
                  {t("auth.verify_button")}
                </Button>
                <Button
                  mode="text"
                  onPress={() => setPendingVerification(false)}
                  textColor="#FF3333"
                >
                  {t("auth.back_to_register")}
                </Button>
              </View>
            ) : (
              <View style={styles.form}>
                <TextInput
                  label={t("auth.email_label")}
                  autoCapitalize="none"
                  value={emailAddress}
                  placeholder={t("auth.email_placeholder")}
                  onChangeText={setEmailAddress}
                  mode="outlined"
                  keyboardType="email-address"
                  style={styles.input}
                  textColor="#FFFFFF"
                  left={<TextInput.Icon icon="email" />}
                />
                <TextInput
                  label={t("auth.password_label")}
                  value={password}
                  placeholder={t("auth.password_placeholder")}
                  secureTextEntry={true}
                  onChangeText={setPassword}
                  mode="outlined"
                  style={styles.input}
                  textColor="#FFFFFF"
                  left={<TextInput.Icon icon="lock" />}
                />
                <Button
                  mode="contained"
                  onPress={onSignUpPress}
                  loading={loading}
                  style={styles.button}
                >
                  {t("common.continue", "Continuar")}
                </Button>
                {/* Google Sign Up for native */}
                {Platform.OS !== "web" && (
                  <Button
                    mode="outlined"
                    icon="google"
                    onPress={loginWithGoogle}
                    loading={authLoading}
                    style={{ marginVertical: 8 }}
                  >
                    {t("auth.google_sign_up", "Registrarse con Google")}
                  </Button>
                )}
                {/* Google One Tap for web */}
                {Platform.OS === "web" && GoogleOneTap && (
                  <View style={{ marginVertical: 16 }}>
                    <GoogleOneTap afterSignInUrl="/" afterSignUpUrl="/" />
                  </View>
                )}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    {t("auth.already_have_account", "¿Ya tienes una cuenta?")}
                  </Text>
                  <Link href="/sign-in" asChild>
                    <Button mode="text" compact textColor="#0055D4">
                      {t("auth.login_tab")}
                    </Button>
                  </Link>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  root: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 16,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: "#2A2A2A",
  },
  button: {
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  footerText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
});

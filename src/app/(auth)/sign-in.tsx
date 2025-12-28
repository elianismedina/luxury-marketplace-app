import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useSignIn } from "@clerk/clerk-expo";
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
import { Button, Checkbox, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
// Import GoogleOneTap only on web
let GoogleOneTap: any = null;
if (Platform.OS === "web") {
  try {
    GoogleOneTap = require("@clerk/clerk-react").GoogleOneTap;
  } catch {}
}

export default function SignInScreen() {
  const { loginWithGoogle, loading: authLoading } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const { t } = useTranslation();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [needsSecondFactor, setNeedsSecondFactor] = React.useState(false);
  const [secondFactorCode, setSecondFactorCode] = React.useState("");
  const [pendingSignInAttempt, setPendingSignInAttempt] =
    React.useState<any>(null);

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else if (signInAttempt.status === "needs_second_factor") {
        setNeedsSecondFactor(true);
        setPendingSignInAttempt(signInAttempt);
      } else {
        // Log more useful details if available
        console.error("Sign-in attempt failed:", {
          status: signInAttempt.status,
          error: signInAttempt.error,
          message: signInAttempt.message,
        });
      }
    } catch (err: any) {
      // Log error details in a more readable way
      if (err && (err.message || err.code || err.status)) {
        console.error("Sign-in error:", {
          message: err.message,
          code: err.code,
          status: err.status,
          name: err.name,
          stack: err.stack,
        });
      } else {
        console.error("Sign-in error (raw):", err);
      }
      // You could add an Alert here
    } finally {
      setLoading(false);
    }
  };

  // Handle second factor submission
  const onSecondFactorPress = async () => {
    if (!isLoaded || !pendingSignInAttempt) return;
    setLoading(true);
    try {
      const result = await signIn.attemptSecondFactor({
        code: secondFactorCode,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
      } else {
        console.error("Second factor attempt failed:", result);
      }
    } catch (err: any) {
      console.error("Second factor error:", err);
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

            <Text style={styles.title}>{t("auth.login_tab")}</Text>

            <View style={styles.form}>
              {/* If needs second factor, show code input */}
              {needsSecondFactor ? (
                <>
                  <Text style={styles.title}>
                    {t(
                      "auth.second_factor_title",
                      "Ingresa el código de verificación"
                    )}
                  </Text>
                  <TextInput
                    label={t(
                      "auth.verification_code_label",
                      "Código de verificación"
                    )}
                    value={secondFactorCode}
                    placeholder="123456"
                    onChangeText={setSecondFactorCode}
                    mode="outlined"
                    keyboardType="number-pad"
                    style={styles.input}
                    textColor="#FFFFFF"
                    left={<TextInput.Icon icon="key" />}
                  />
                  <Button
                    mode="contained"
                    onPress={onSecondFactorPress}
                    loading={loading}
                    style={styles.button}
                  >
                    {t("auth.verify_button", "Verificar")}
                  </Button>
                  <Button
                    mode="text"
                    onPress={() => {
                      setNeedsSecondFactor(false);
                      setSecondFactorCode("");
                      setPendingSignInAttempt(null);
                    }}
                    textColor="#FF3333"
                  >
                    {t("auth.back_to_login", "Volver")}
                  </Button>
                </>
              ) : (
                <>
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

                  <View>
                    <TextInput
                      label={t("auth.password_label")}
                      value={password}
                      placeholder={t("auth.password_placeholder")}
                      secureTextEntry={!showPassword}
                      onChangeText={setPassword}
                      mode="outlined"
                      style={styles.input}
                      textColor="#FFFFFF"
                      left={<TextInput.Icon icon="lock" />}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? "eye-off" : "eye"}
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      }
                    />
                  </View>

                  <View style={styles.loginOptions}>
                    <View style={styles.checkboxContainer}>
                      <Checkbox.Android
                        status={rememberMe ? "checked" : "unchecked"}
                        onPress={() => setRememberMe(!rememberMe)}
                      />
                      <Text
                        style={styles.checkboxLabel}
                        onPress={() => setRememberMe(!rememberMe)}
                      >
                        {t("auth.remember_me")}
                      </Text>
                    </View>
                    <Link href="/reset-password" asChild>
                      <Button mode="text" compact textColor="#0055D4">
                        {t("auth.forgot_password")}
                      </Button>
                    </Link>
                  </View>

                  <Button
                    mode="contained"
                    onPress={onSignInPress}
                    loading={loading}
                    disabled={loading || !emailAddress || !password}
                    style={styles.button}
                    testID="sign-in-button"
                  >
                    {t("auth.login_tab")}
                  </Button>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>
                      {t("auth.or_continue_with")}
                    </Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Google Sign In for native */}
                  {Platform.OS !== "web" && (
                    <Button
                      mode="outlined"
                      icon="google"
                      onPress={loginWithGoogle}
                      loading={authLoading}
                      style={{ marginVertical: 8 }}
                    >
                      {t("auth.google_sign_in", "Iniciar sesión con Google")}
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
                      {t("auth.no_account_question", "¿No tienes una cuenta?")}
                    </Text>
                    <Link href="/sign-up" asChild>
                      <Button mode="text" compact textColor="#0055D4">
                        {t("auth.register_tab")}
                      </Button>
                    </Link>
                  </View>

                  <View style={styles.aliadoContainer}>
                    <Text style={styles.aliadoText}>
                      {t("auth.aliado_question")}
                    </Text>
                    <Link href="/(auth)/(registro-aliado)/registro" asChild>
                      <Button
                        mode="text"
                        compact
                        textColor="#FF0000"
                        labelStyle={{ textDecorationLine: "underline" }}
                      >
                        {t("auth.aliado_register_link")}
                      </Button>
                    </Link>
                  </View>
                </>
              )}
            </View>
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
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: "#2A2A2A",
  },
  button: {
    marginTop: 8,
  },
  loginOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -8,
  },
  checkboxLabel: {
    fontSize: 14,
    marginLeft: 4,
    color: "#FFFFFF",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#4A4A4A",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#9CA3AF",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  footerText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  aliadoContainer: {
    marginTop: 24,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    paddingTop: 16,
  },
  aliadoText: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
  },
});

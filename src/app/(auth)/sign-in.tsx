import Logo from "@/components/Logo";
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

export default function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const { t } = useTranslation();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

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
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      // You could add an Alert here
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

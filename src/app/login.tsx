import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Checkbox,
  HelperText,
  ProgressBar,
  SegmentedButtons,
  Snackbar,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import Logo from "@/components/Logo";
import { useAuthForm } from "@/hooks/useAuthForm";
import { useTranslation } from "react-i18next";

export default function AuthScreen() {
  const router = useRouter();
  const {
    user,
    initializing,
    loading,
    isConfigured,
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    activeTab,
    setActiveTab,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    emailTouched,
    setEmailTouched,
    passwordTouched,
    setPasswordTouched,
    snackbarVisible,
    setSnackbarVisible,
    snackbarMessage,
    isEmailValid,
    passwordStrength,
    loginDisabled,
    registerDisabled,
    handleForgotPassword,
    handleLogin,
    handleRegister,
    handleLogout,
    handleGoogleLogin,
  } = useAuthForm();
  const { t } = useTranslation();

  const getStrengthLabel = (score: number) => {
    const keys = ["very_weak", "weak", "acceptable", "strong", "very_strong"];
    return t(`auth.password_levels.${keys[score] || keys[0]}`);
  };

  if (initializing && !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.root}>
            <View style={styles.logoContainer}>
              <Logo width={120} height={120} />
            </View>

            <View style={styles.statusHeader}>
              {user ? (
                <Text style={styles.statusText}>
                  {`${t("auth.auth_status_logged_in")} ${
                    user.name || user.email
                  }`}
                </Text>
              ) : null}
              {loading ? <ActivityIndicator size="small" /> : null}
            </View>

            {!isConfigured ? (
              <HelperText type="info" visible style={styles.warning}>
                {t("auth.appwrite_not_configured")}
              </HelperText>
            ) : null}

            <SegmentedButtons
              style={styles.tabs}
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "login" | "register")
              }
              buttons={[
                {
                  value: "login",
                  label: t("auth.login_tab"),
                  icon: "login",
                },
                {
                  value: "register",
                  label: t("auth.register_tab"),
                  icon: "account-plus",
                },
              ]}
            />

            <View style={styles.form}>
              <View>
                <TextInput
                  label={t("auth.email_label")}
                  placeholder={t("auth.email_placeholder")}
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => setEmailTouched(true)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  mode="outlined"
                  style={styles.input}
                  textColor="#FFFFFF"
                  outlineColor="#8E8E8E"
                  activeOutlineColor="#FF3333"
                  placeholderTextColor="#9CA3AF"
                  error={emailTouched && email.length > 0 && !isEmailValid}
                  left={<TextInput.Icon icon="email" />}
                />
                {emailTouched && email.length > 0 && !isEmailValid && (
                  <HelperText type="error" visible>
                    {t("auth.invalid_email_error")}
                  </HelperText>
                )}
                {emailTouched && isEmailValid && (
                  <HelperText type="info" visible style={styles.successText}>
                    {t("auth.valid_email_success")}
                  </HelperText>
                )}
              </View>

              <View>
                <TextInput
                  label={t("auth.password_label")}
                  placeholder={t("auth.password_placeholder")}
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => setPasswordTouched(true)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  mode="outlined"
                  style={styles.input}
                  textColor="#FFFFFF"
                  outlineColor="#8E8E8E"
                  activeOutlineColor="#FF3333"
                  placeholderTextColor="#9CA3AF"
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
                {activeTab === "register" &&
                  passwordTouched &&
                  password.length > 0 && (
                    <View style={styles.passwordStrength}>
                      <View style={styles.strengthHeader}>
                        <Text style={styles.strengthLabel}>
                          {t("auth.password_strength")}:{" "}
                          {getStrengthLabel(passwordStrength.score)}
                        </Text>
                      </View>
                      <ProgressBar
                        progress={(passwordStrength.score + 1) / 5}
                        color={passwordStrength.color}
                        style={styles.progressBar}
                      />
                      <HelperText type="info" visible>
                        {passwordStrength.score < 2
                          ? t("auth.password_hint")
                          : t("auth.password_secure")}
                      </HelperText>
                    </View>
                  )}
              </View>

              {activeTab === "register" ? (
                <TextInput
                  label={t("auth.name_label")}
                  placeholder={t("auth.name_placeholder")}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  mode="outlined"
                  style={styles.input}
                  textColor="#FFFFFF"
                  outlineColor="#8E8E8E"
                  activeOutlineColor="#FF3333"
                  placeholderTextColor="#9CA3AF"
                  left={<TextInput.Icon icon="account" />}
                />
              ) : null}

              {activeTab === "login" && (
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
                  <Button
                    mode="text"
                    onPress={handleForgotPassword}
                    compact
                    style={styles.forgotButton}
                    textColor="#0055D4"
                  >
                    {t("auth.forgot_password")}
                  </Button>
                </View>
              )}

              {activeTab === "login" ? (
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  disabled={loginDisabled}
                  loading={loading}
                  style={styles.button}
                  testID="login-button"
                >
                  {t("auth.login_tab")}
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={handleRegister}
                  disabled={registerDisabled}
                  loading={loading}
                  style={styles.button}
                  buttonColor="#0055D4"
                >
                  {t("auth.register_tab")}
                </Button>
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  {t("auth.or_continue_with")}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                mode="outlined"
                onPress={handleGoogleLogin}
                disabled={loading}
                loading={loading}
                icon="google"
                style={styles.googleButton}
                textColor="#FFFFFF"
                buttonColor="transparent"
              >
                {t("auth.continue_with_google")}
              </Button>

              {activeTab === "register" && (
                <View style={styles.aliadoContainer}>
                  <Text style={styles.aliadoText}>
                    {t("auth.aliado_question")}
                  </Text>
                  <Button
                    mode="text"
                    onPress={() => {
                      router.push("/(registro-aliado)/registro");
                    }}
                    textColor="#FF0000"
                    style={styles.registerAliadoButton}
                    labelStyle={{
                      fontWeight: "bold",
                      textDecorationLine: "underline",
                    }}
                  >
                    {t("auth.aliado_register_link")}
                  </Button>
                </View>
              )}

              {user ? (
                <Button
                  mode="outlined"
                  onPress={handleLogout}
                  disabled={loading}
                  loading={loading}
                  style={styles.button}
                >
                  {t("common.cerrar_sesion")}
                </Button>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  root: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FF0000",
  },
  statusText: {
    fontSize: 16,
    color: "#4b5563",
  },
  warning: {
    marginTop: -8,
  },
  tabs: {
    marginTop: 12,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: "#2A2A2A",
  },
  button: {
    marginTop: 4,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
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
  googleButton: {
    borderColor: "#4A4A4A",
    borderWidth: 1,
    marginBottom: 8,
  },
  successText: {
    color: "#4caf50",
  },
  passwordStrength: {
    marginTop: 8,
    gap: 4,
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  loginOptions: {
    gap: 8,
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
  forgotButton: {
    alignSelf: "flex-start",
    marginLeft: -8,
  },
  snackbar: {
    backgroundColor: "#10B981",
  },
  aliadoContainer: {
    marginTop: 20,
    alignItems: "center",
    gap: 4,
  },
  aliadoText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  registerAliadoButton: {
    marginTop: -4,
  },
});

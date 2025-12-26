import { useAuth } from "@/context/AuthContext";
import { getPasswordStrength, validateEmail } from "@/lib/authUtils";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

type AuthTab = "login" | "register";

export const useAuthForm = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const {
    user,
    initializing,
    loading,
    isConfigured,
    login,
    register,
    verifyEmail,
    logout,

    recoverPassword,
    loginWithGoogle,
    refresh,
  } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [pendingLogin, setPendingLogin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    if (params.tab === "register" || params.tab === "login") {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  const isEmailValid = useMemo(() => validateEmail(email), [email]);
  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const loginDisabled = useMemo(
    () =>
      activeTab !== "login" ||
      !isConfigured ||
      !email.trim() ||
      !password.trim() ||
      !isEmailValid ||
      loading ||
      initializing ||
      pendingLogin,
    [
      activeTab,
      isConfigured,
      email,
      password,
      isEmailValid,
      loading,
      initializing,
      pendingLogin,
    ]
  );

  const registerDisabled = useMemo(
    () =>
      activeTab !== "register" ||
      !isConfigured ||
      !email.trim() ||
      !password.trim() ||
      !name.trim() ||
      !isEmailValid ||
      passwordStrength.score < 2 ||
      loading ||
      initializing,
    [
      activeTab,
      isConfigured,
      email,
      password,
      name,
      isEmailValid,
      passwordStrength.score,
      loading,
      initializing,
    ]
  );

  const handleForgotPassword = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert(
        t("auth.errors.email_required_title"),
        t("auth.errors.email_required_message")
      );
      return;
    }
    if (!isEmailValid) {
      Alert.alert(
        t("auth.errors.invalid_email_title"),
        t("auth.errors.invalid_email_message")
      );
      return;
    }

    try {
      const redirectUrl = "https://cloud.appwrite.io/v1/account/recovery";
      await recoverPassword(email, redirectUrl);
      Alert.alert(
        t("auth.recovery.email_sent_title"),
        t("auth.recovery.email_sent_message", { email }),
        [
          { text: t("common.ok") },
          {
            text: t("auth.recovery.already_have_code"),
            onPress: () => router.push("/reset-password"),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("auth.errors.recovery_email_fail");
      Alert.alert(t("auth.errors.error_title"), message);
    }
  }, [email, isEmailValid, recoverPassword, router]);

  const handleLogin = useCallback(async () => {
    try {
      if (user) {
        await logout();
      }
    } catch (e) {
      // Ignorar errores
    }
    try {
      setSnackbarMessage(t("auth.messages.login_success"));
      setSnackbarVisible(true);
      await login(email, password);
      setPendingLogin(true);
      if (rememberMe) {
        console.log("Remember me enabled");
      }
    } catch (error) {
      setSnackbarVisible(false);
      let message =
        error instanceof Error ? error.message : t("auth.errors.login_fail");
      if (typeof message === "string" && message.includes("Rate limit")) {
        message = t("auth.errors.rate_limit_error");
      }
      Alert.alert(t("auth.errors.login_error_title"), message);
    }
  }, [login, logout, user, email, password, rememberMe]);

  const handleRegister = useCallback(async () => {
    try {
      await register(email, password, name);
      setSnackbarMessage(t("auth.messages.verification_code_sent"));
      setSnackbarVisible(true);
      setIsVerifying(true);
    } catch (error) {
      setSnackbarVisible(false);
      const message =
        error instanceof Error ? error.message : t("auth.errors.register_fail");
      Alert.alert(t("auth.errors.register_error_title"), message);
    }
  }, [register, email, password, name, t]);

  const handleVerifyEmail = useCallback(async () => {
    if (!verificationCode.trim()) {
      Alert.alert(t("auth.errors.error_title"), t("auth.errors.code_required"));
      return;
    }

    try {
      await verifyEmail(verificationCode);
      setSnackbarMessage(t("auth.messages.register_success"));
      setSnackbarVisible(true);
      setIsVerifying(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("auth.errors.verify_fail");
      Alert.alert(t("auth.errors.verify_error_title"), message);
    }
  }, [verifyEmail, verificationCode, t]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      Alert.alert(
        t("auth.messages.logout_title"),
        t("auth.messages.logout_message")
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("auth.errors.logout_fail");
      Alert.alert(t("auth.errors.logout_error_title"), message);
    }
  }, [logout]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      await loginWithGoogle();
      setSnackbarMessage(t("auth.messages.google_login_success"));
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarVisible(false);
      const message =
        error instanceof Error
          ? error.message
          : t("auth.errors.google_login_fail");
      Alert.alert(t("auth.errors.error_title"), message);
    }
  }, [loginWithGoogle]);

  useEffect(() => {
    if (pendingLogin && user) {
      const isAliado =
        user.publicMetadata?.role === "aliado" ||
        user.unsafeMetadata?.role === "aliado";

      const targetRoute = isAliado
        ? "/(panel-aliado)/dashboard"
        : "/(clientes)";
      router.replace(targetRoute);
      setPendingLogin(false);
    }
  }, [pendingLogin, user, router]);

  return {
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
    isVerifying,
    setIsVerifying,
    verificationCode,
    setVerificationCode,
    handleVerifyEmail,
  };
};

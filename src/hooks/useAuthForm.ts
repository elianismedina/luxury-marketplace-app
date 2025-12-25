import { useAuth } from "@/context/AuthContext";
import { teams } from "@/lib/appwrite";
import { getPasswordStrength, validateEmail } from "@/lib/authUtils";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

type AuthTab = "login" | "register";

const checkIfUserIsAliado = async (): Promise<boolean> => {
  try {
    // ID del team de aliados
    const teamId = "6942bcc6001056b6c3d8";
    const memberships = await teams.listMemberships(teamId);
    return memberships.total > 0;
  } catch (error) {
    console.error("Error verificando team aliado:", error);
    return false;
  }
};

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
      setSnackbarMessage(t("auth.messages.register_success"));
      setSnackbarVisible(true);
      await register(email, password, name);
      // Refrescar usuario para asegurar contexto actualizado
      if (typeof refresh === "function") {
        await refresh();
      }
      // Esperar un poco para asegurar que el contexto se actualice
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Ahora usar el user actualizado del hook
      const aliadoTeamId = "6942bcc6001056b6c3d8";
      if (user && user.email === email) {
        try {
          await teams.createMembership(aliadoTeamId, user.email, ["owner"]);
        } catch (err) {
          // Si ya es miembro, ignorar error
          const errorMessage = err instanceof Error ? err.message : String(err);
          if (errorMessage.includes("already a member")) {
            // Ignore
          } else {
            console.warn("No se pudo agregar al team aliado:", err);
          }
        }
      }
      const isAliado = await checkIfUserIsAliado();
      const targetRoute = isAliado
        ? "/(panel-aliado)/dashboard"
        : "/(clientes)";
      setTimeout(() => {
        router.replace(targetRoute);
      }, 1500);
    } catch (error) {
      setSnackbarVisible(false);
      const message =
        error instanceof Error ? error.message : t("auth.errors.register_fail");
      setTimeout(() => {
        Alert.alert(t("auth.errors.register_error_title"), message);
      }, 400);
    }
  }, [register, email, password, name, router, user, refresh]);

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
      (async () => {
        try {
          const isAliado = await checkIfUserIsAliado();
          const targetRoute = isAliado
            ? "/(panel-aliado)/dashboard"
            : "/(clientes)";
          router.replace(targetRoute);
        } catch (redirectError) {
          router.replace("/(clientes)");
        } finally {
          setPendingLogin(false);
        }
      })();
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
  };
};

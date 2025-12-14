import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { databaseId, databases, Query } from "@/lib/appwrite";
import { getPasswordStrength, validateEmail } from "@/lib/authUtils";

type AuthTab = "login" | "register";

const checkIfUserIsAliado = async (userEmail: string): Promise<boolean> => {
  try {
    const response = await databases.listDocuments(
      databaseId,
      "aliado", // Collection ID de aliados
      [Query.equal("correoElectronico", userEmail.trim().toLowerCase())]
    );
    return response.documents.length > 0;
  } catch (error) {
    console.error("Error verificando si es aliado:", error);
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
  } = useAuth();

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
        "Correo electrónico requerido",
        "Por favor ingresa tu correo electrónico para recuperar tu contraseña."
      );
      return;
    }
    if (!isEmailValid) {
      Alert.alert(
        "Correo electrónico inválido",
        "Por favor ingresa un correo electrónico válido."
      );
      return;
    }

    try {
      const redirectUrl = "https://cloud.appwrite.io/v1/account/recovery";
      await recoverPassword(email, redirectUrl);
      Alert.alert(
        "Correo enviado",
        `Hemos enviado un enlace de recuperación a ${email}.\n\n1. Revisa tu correo\n2. Abre el enlace en el email\n3. Copia el userId y secret de la URL\n4. Usa el botón "Ya tengo el código" abajo`,
        [
          { text: "OK" },
          {
            text: "Ya tengo el código",
            onPress: () => router.push("/reset-password"),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo enviar el email de recuperación.";
      Alert.alert("Error", message);
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
      setSnackbarMessage("✓ Sesión iniciada correctamente");
      setSnackbarVisible(true);
      await login(email, password);
      setPendingLogin(true);
      if (rememberMe) {
        console.log("Remember me enabled");
      }
    } catch (error) {
      setSnackbarVisible(false);
      let message =
        error instanceof Error ? error.message : "No se pudo iniciar sesión.";
      if (typeof message === "string" && message.includes("Rate limit")) {
        message =
          "Has intentado iniciar sesión demasiadas veces. Espera unos segundos e inténtalo de nuevo.";
      }
      Alert.alert("Error al iniciar sesión", message);
    }
  }, [login, logout, user, email, password, rememberMe]);

  const handleRegister = useCallback(async () => {
    try {
      setSnackbarMessage("✓ Cuenta creada correctamente");
      setSnackbarVisible(true);
      await register(email, password, name);
      try {
        const isAliado = await checkIfUserIsAliado(email.trim().toLowerCase());
        const targetRoute = isAliado
          ? "/(panel-aliado)/dashboard"
          : "/(clientes)";
        setTimeout(() => {
          router.replace(targetRoute);
        }, 1500);
      } catch (redirectError) {
        setTimeout(() => {
          router.replace("/(clientes)");
        }, 1500);
      }
    } catch (error) {
      setSnackbarVisible(false);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo completar el registro.";
      Alert.alert("Error al registrar", message);
    }
  }, [register, email, password, name, router]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      Alert.alert("Sesión cerrada", "Has cerrado sesión correctamente.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cerrar la sesión.";
      Alert.alert("Error al cerrar sesión", message);
    }
  }, [logout]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      await loginWithGoogle();
      setSnackbarMessage("✓ Sesión iniciada con Google");
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarVisible(false);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión con Google.";
      Alert.alert("Error", message);
    }
  }, [loginWithGoogle]);

  useEffect(() => {
    if (pendingLogin && user && user.email) {
      (async () => {
        try {
          const isAliado = await checkIfUserIsAliado(user.email);
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

import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { useAuth } from "@/context/AuthContext";
import { databaseId, databases, Query } from "@/lib/appwrite";

type AuthTab = "login" | "register";

type PasswordStrength = {
  score: number; // 0-4
  label: string;
  color: string;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

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

const getPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const labels = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Muy fuerte"];
  const colors = ["#f44336", "#ff9800", "#ffeb3b", "#8bc34a", "#4caf50"];

  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    color: colors[Math.min(score, 4)],
  };
};

export default function AuthScreen() {
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

  // Estado para controlar si se acaba de hacer login
  const [pendingLogin, setPendingLogin] = useState(false);

  useEffect(() => {
    if (params.tab === "register" || params.tab === "login") {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  // No redirigir automáticamente - solo al hacer login/registro manual

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
      // URL temporal para desarrollo - Appwrite envía el email con userId y secret como parámetros
      // En producción: registra tu deep link en Appwrite Console → Settings → Platforms
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
  }, [email, isEmailValid, recoverPassword]);

  const handleLogin = useCallback(async () => {
    try {
      // Solo cerrar sesión si hay usuario activo
      if (user) {
        await logout();
      }
    } catch (e) {
      // Ignorar errores de logout (por ejemplo, si no hay sesión activa)
    }
    try {
      setSnackbarMessage("✓ Sesión iniciada correctamente");
      setSnackbarVisible(true);
      await login(email, password);
      setPendingLogin(true); // Esperar a que el usuario esté disponible
      if (rememberMe) {
        // TODO: Guardar preferencia de sesión persistente
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
  }, [login, logout, user, email, password, rememberMe, router]);

  // Efecto para redirigir solo cuando el usuario esté disponible
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

  const handleRegister = useCallback(async () => {
    try {
      setSnackbarMessage("✓ Cuenta creada correctamente");
      setSnackbarVisible(true);

      await register(email, password, name);

      // Verificar tipo de usuario después del registro
      try {
        console.log("Verificando tipo de usuario después del registro...");
        const isAliado = await checkIfUserIsAliado(email.trim().toLowerCase());
        const targetRoute = isAliado
          ? "/(panel-aliado)/dashboard"
          : "/(clientes)";

        setTimeout(() => {
          router.replace(targetRoute);
        }, 1500);
      } catch (redirectError) {
        console.error("Error verificando tipo de usuario:", redirectError);
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
    console.log("handleGoogleLogin: Button clicked");
    try {
      console.log("handleGoogleLogin: Calling loginWithGoogle...");
      await loginWithGoogle();
      console.log("handleGoogleLogin: loginWithGoogle completed");

      // Show success message and redirect
      setSnackbarMessage("✓ Sesión iniciada con Google");
      setSnackbarVisible(true);
    } catch (error) {
      console.error("handleGoogleLogin: Error caught:", error);
      setSnackbarVisible(false);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión con Google.";
      Alert.alert("Error", message);
    }
  }, [loginWithGoogle, router]);

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
                  {`Sesión iniciada como ${user.name || user.email}`}
                </Text>
              ) : null}
              {loading ? <ActivityIndicator size="small" /> : null}
            </View>

            {!isConfigured ? (
              <HelperText type="info" visible style={styles.warning}>
                Appwrite no está configurado. Define las variables de entorno
                `EXPO_PUBLIC_APPWRITE_*` para activar el login.
              </HelperText>
            ) : null}

            <SegmentedButtons
              style={styles.tabs}
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as AuthTab)}
              buttons={[
                {
                  value: "login",
                  label: "Iniciar sesión",
                  icon: "login",
                },
                {
                  value: "register",
                  label: "Registrarse",
                  icon: "account-plus",
                },
              ]}
            />

            <View style={styles.form}>
              <View>
                <TextInput
                  label="Correo electrónico"
                  placeholder="tu@correo.com"
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
                    Por favor ingresa un correo electrónico válido
                  </HelperText>
                )}
                {emailTouched && isEmailValid && (
                  <HelperText type="info" visible style={styles.successText}>
                    ✓ Correo electrónico válido
                  </HelperText>
                )}
              </View>

              <View>
                <TextInput
                  label="Contraseña"
                  placeholder="Mínimo 8 caracteres"
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
                          Fortaleza: {passwordStrength.label}
                        </Text>
                      </View>
                      <ProgressBar
                        progress={(passwordStrength.score + 1) / 5}
                        color={passwordStrength.color}
                        style={styles.progressBar}
                      />
                      <HelperText type="info" visible>
                        {passwordStrength.score < 2
                          ? "Usa mayúsculas, minúsculas, números y símbolos"
                          : "Contraseña segura"}
                      </HelperText>
                    </View>
                  )}
              </View>

              {activeTab === "register" ? (
                <TextInput
                  label="Nombre"
                  placeholder="Tu nombre"
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
                      Recordarme
                    </Text>
                  </View>
                  <Button
                    mode="text"
                    onPress={handleForgotPassword}
                    compact
                    style={styles.forgotButton}
                    textColor="#0055D4"
                  >
                    ¿Olvidaste tu contraseña?
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
                >
                  Iniciar sesión
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
                  Registrarse
                </Button>
              )}

              {/* OAuth Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>O continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Login Button */}
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
                Continuar con Google
              </Button>

              {activeTab === "register" && (
                <View style={styles.aliadoContainer}>
                  <Text style={styles.aliadoText}>
                    ¿Eres un taller, vendes repuestos y accesorios o prestas
                    servicios?
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
                    Registrate como Aliado Zona Pits
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
                  Cerrar sesión
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

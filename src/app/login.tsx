import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Checkbox,
  HelperText,
  ProgressBar,
  SegmentedButtons,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

const logoImage = require("../../assets/images/zonaPitsLogo2.png");

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
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  useEffect(() => {
    if (params.tab === "register" || params.tab === "login") {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  useEffect(() => {
    if (!initializing && user) {
      router.replace("/(tabs)");
    }
  }, [initializing, user, router]);

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
      initializing,
    [
      activeTab,
      isConfigured,
      email,
      password,
      isEmailValid,
      loading,
      initializing,
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
        "Email requerido",
        "Por favor ingresa tu email para recuperar tu contraseña."
      );
      return;
    }
    if (!isEmailValid) {
      Alert.alert("Email inválido", "Por favor ingresa un email válido.");
      return;
    }

    try {
      // URL temporal para desarrollo - Appwrite envía el email con userId y secret como parámetros
      // En producción: registra tu deep link en Appwrite Console → Settings → Platforms
      const redirectUrl = "https://cloud.appwrite.io/v1/account/recovery";
      await recoverPassword(email, redirectUrl);
      Alert.alert(
        "Email enviado",
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
      await login(email, password);
      if (rememberMe) {
        // TODO: Guardar preferencia de sesión persistente
        console.log("Remember me enabled");
      }
      Alert.alert("Login exitoso", "Sesión iniciada correctamente.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo iniciar sesión.";
      Alert.alert("Error al iniciar sesión", message);
    }
  }, [login, email, password, rememberMe]);

  const handleRegister = useCallback(async () => {
    try {
      await register(email, password, name);
      Alert.alert(
        "Registro exitoso",
        "Cuenta creada y sesión iniciada correctamente."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo completar el registro.";
      Alert.alert("Error al registrar", message);
    }
  }, [register, email, password, name]);

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

  if (initializing && !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.root}>
          <View style={styles.logoContainer}>
            <Image
              source={logoImage}
              style={styles.logo}
              resizeMode="contain"
            />
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
                label="Email"
                placeholder="tu@email.com"
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
                  Por favor ingresa un email válido
                </HelperText>
              )}
              {emailTouched && isEmailValid && (
                <HelperText type="info" visible style={styles.successText}>
                  ✓ Email válido
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
                label="Nombre completo"
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
                    Mantenerme conectado
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  root: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  logo: {
    width: 120,
    height: 120,
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
  },
  forgotButton: {
    alignSelf: "flex-start",
    marginLeft: -8,
  },
});

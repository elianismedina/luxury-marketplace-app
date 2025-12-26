import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, HelperText, ProgressBar, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

type PasswordStrength = {
  score: number;
  label: string;
  color: string;
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

const extractParamsFromUrl = (
  url: string
): { userId: string; secret: string } | null => {
  try {
    // Intentar extraer userId y secret de la URL
    const urlObj = new URL(url);
    const userId = urlObj.searchParams.get("userId");
    const secret = urlObj.searchParams.get("secret");

    if (userId && secret) {
      return { userId, secret };
    }
    return null;
  } catch {
    return null;
  }
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; secret?: string }>();
  const { loading, confirmPasswordReset } = useAuth();
  const [recoveryUrl, setRecoveryUrl] = useState("");
  const [userId, setUserId] = useState(params.userId || "");
  const [secret, setSecret] = useState(params.secret || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const passwordsMatch = useMemo(
    () => password === confirmPassword && confirmPassword.length > 0,
    [password, confirmPassword]
  );

  const isValid = useMemo(
    () =>
      password.length >= 8 &&
      passwordStrength.score >= 2 &&
      passwordsMatch &&
      userId.trim() &&
      secret.trim(),
    [password, passwordStrength.score, passwordsMatch, userId, secret]
  );

  const handleExtractFromUrl = useCallback(() => {
    if (!recoveryUrl.trim()) {
      Alert.alert("Error", "Por favor pega la URL del email de recuperación");
      return;
    }

    const extracted = extractParamsFromUrl(recoveryUrl);
    if (extracted) {
      setUserId(extracted.userId);
      setSecret(extracted.secret);
      Alert.alert(
        "Éxito",
        "Parámetros extraídos correctamente. Ahora ingresa tu nueva contraseña."
      );
    } else {
      Alert.alert(
        "Error",
        "No se pudieron extraer los parámetros de la URL. Verifica que hayas copiado la URL completa del botón 'Reset Password' del email."
      );
    }
  }, [recoveryUrl]);

  const handleResetPassword = useCallback(async () => {
    if (!userId.trim() || !secret.trim()) {
      Alert.alert(
        "Error",
        "Por favor ingresa el User ID y Secret del email de recuperación"
      );
      return;
    }

    if (!isValid) {
      Alert.alert(
        "Error",
        "Por favor verifica que las contraseñas coincidan y cumplan los requisitos de seguridad"
      );
      return;
    }

    try {
      await confirmPasswordReset(userId.trim(), secret.trim(), password);
      Alert.alert(
        "Contraseña actualizada",
        "Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión.",
        [
          {
            text: "Ir al login",
            onPress: () => router.replace("/sign-in"),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo restablecer la contraseña.";
      Alert.alert("Error", message);
    }
  }, [userId, secret, password, isValid, confirmPasswordReset, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.root}>
          <View style={styles.header}>
            <Text style={styles.title}>Restablecer Contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
            </Text>
          </View>

          <View style={styles.form}>
            <HelperText type="info" visible style={styles.infoBox}>
              📧 Ve a tu email → Haz clic derecho en el botón "Reset Password" →
              Copiar enlace → Pega aquí abajo
            </HelperText>

            {!useManualEntry ? (
              <>
                <TextInput
                  label="URL del email de recuperación"
                  placeholder="Pega aquí el enlace completo"
                  value={recoveryUrl}
                  onChangeText={setRecoveryUrl}
                  autoCapitalize="none"
                  multiline
                  numberOfLines={3}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="link" />}
                />

                <Button
                  mode="contained"
                  onPress={handleExtractFromUrl}
                  disabled={!recoveryUrl.trim() || loading}
                  style={styles.extractButton}
                >
                  Extraer códigos del enlace
                </Button>

                <Button
                  mode="text"
                  onPress={() => setUseManualEntry(true)}
                  compact
                  style={styles.toggleButton}
                >
                  O ingresar códigos manualmente
                </Button>
              </>
            ) : (
              <>
                <TextInput
                  label="User ID"
                  placeholder="Usuario desde el email"
                  value={userId}
                  onChangeText={setUserId}
                  autoCapitalize="none"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="account-key" />}
                />

                <TextInput
                  label="Secret"
                  placeholder="Código secreto desde el email"
                  value={secret}
                  onChangeText={setSecret}
                  autoCapitalize="none"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="key" />}
                />

                <Button
                  mode="text"
                  onPress={() => setUseManualEntry(false)}
                  compact
                  style={styles.toggleButton}
                >
                  ← Volver a pegar enlace
                </Button>
              </>
            )}

            {userId && secret && (
              <HelperText type="info" visible style={styles.successText}>
                ✓ Códigos de recuperación listos
              </HelperText>
            )}

            <View style={styles.divider} />

            <View>
              <TextInput
                label="Nueva contraseña"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChangeText={setPassword}
                onBlur={() => setPasswordTouched(true)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
              {passwordTouched && password.length > 0 && (
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

            <View>
              <TextInput
                label="Confirmar contraseña"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                mode="outlined"
                style={styles.input}
                error={
                  confirmPassword.length > 0 && password !== confirmPassword
                }
                left={<TextInput.Icon icon="lock-check" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? "eye-off" : "eye"}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <HelperText type="error" visible>
                  Las contraseñas no coinciden
                </HelperText>
              )}
              {passwordsMatch && (
                <HelperText type="info" visible style={styles.successText}>
                  ✓ Las contraseñas coinciden
                </HelperText>
              )}
            </View>

            <Button
              mode="contained"
              onPress={handleResetPassword}
              disabled={!isValid || loading}
              loading={loading}
              style={styles.button}
            >
              Restablecer contraseña
            </Button>

            <Button
              mode="text"
              onPress={() => router.replace("/sign-in")}
              disabled={loading}
              style={styles.cancelButton}
            >
              Cancelar
            </Button>
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
    gap: 32,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: "white",
  },
  button: {
    marginTop: 8,
  },
  cancelButton: {
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
  infoBox: {
    backgroundColor: "#e3f2fd",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
  },
  extractButton: {
    marginTop: 8,
  },
  toggleButton: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
});

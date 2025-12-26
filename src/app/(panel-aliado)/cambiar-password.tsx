import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { account, isAppwriteConfigured } from "@/lib/appwrite";

type PasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function CambiarPasswordScreen() {
  const { user, initializing, refresh } = useAuth();
  // Forzar refresh si no hay usuario
  useEffect(() => {
    if (!user && !initializing) {
      refresh();
    }
  }, [user, initializing, refresh]);

  if (initializing || !user) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#121212",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18 }}>Cargando usuario...</Text>
      </SafeAreaView>
    );
  }
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Partial<PasswordFormData>>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<PasswordFormData> = {};

    // Validar contraseña actual
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "La contraseña actual es requerida";
    }

    // Validar nueva contraseña
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "La nueva contraseña es requerida";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "La contraseña debe tener al menos 8 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword =
        "La contraseña debe contener al menos una mayúscula, una minúscula y un número";
    }

    // Validar confirmación
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirme la nueva contraseña";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Por favor corrige los errores en el formulario");
      return;
    }

    if (!isAppwriteConfigured) {
      Alert.alert("Error", "La aplicación no está configurada correctamente");
      return;
    }

    if (!user) {
      Alert.alert(
        "No autenticado",
        "Debes iniciar sesión para cambiar tu contraseña."
      );
      return;
    }

    setLoading(true);

    try {
      await account.updatePassword(
        formData.newPassword,
        formData.currentPassword
      );

      Alert.alert(
        "¡Contraseña Actualizada!",
        "Su contraseña ha sido cambiada exitosamente.",
        [
          {
            text: "Continuar",
            onPress: () => router.replace("/(panel-aliado)/dashboard"),
          },
        ]
      );

      // Limpiar formulario
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Error updating password:", error);

      let errorMessage =
        "No se pudo cambiar la contraseña. Intente nuevamente.";

      if (error && typeof error === "object" && "message" in error) {
        const errorMsg = (error as any).message;
        if (
          errorMsg.includes("Invalid credentials") ||
          errorMsg.includes("password")
        ) {
          errorMessage = "La contraseña actual es incorrecta.";
        }
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Logo width={80} height={80} />
            <Text style={styles.title}>Cambiar Contraseña</Text>
            <Text style={styles.subtitle}>
              Actualice su contraseña por mayor seguridad
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Contraseña Actual *"
              value={formData.currentPassword}
              onChangeText={(text) => {
                setFormData({ ...formData, currentPassword: text });
                if (errors.currentPassword) {
                  setErrors({ ...errors, currentPassword: undefined });
                }
              }}
              mode="outlined"
              error={!!errors.currentPassword}
              style={styles.input}
              disabled={loading}
              secureTextEntry={!showPasswords.current}
              right={
                <TextInput.Icon
                  icon={showPasswords.current ? "eye-off" : "eye"}
                  onPress={() =>
                    setShowPasswords({
                      ...showPasswords,
                      current: !showPasswords.current,
                    })
                  }
                />
              }
              placeholder="Ingrese su contraseña actual"
            />
            <HelperText type="error" visible={!!errors.currentPassword}>
              {errors.currentPassword}
            </HelperText>

            <TextInput
              label="Nueva Contraseña *"
              value={formData.newPassword}
              onChangeText={(text) => {
                setFormData({ ...formData, newPassword: text });
                if (errors.newPassword) {
                  setErrors({ ...errors, newPassword: undefined });
                }
              }}
              mode="outlined"
              error={!!errors.newPassword}
              style={styles.input}
              disabled={loading}
              secureTextEntry={!showPasswords.new}
              right={
                <TextInput.Icon
                  icon={showPasswords.new ? "eye-off" : "eye"}
                  onPress={() =>
                    setShowPasswords({
                      ...showPasswords,
                      new: !showPasswords.new,
                    })
                  }
                />
              }
              placeholder="Mínimo 8 caracteres"
            />
            <HelperText type="error" visible={!!errors.newPassword}>
              {errors.newPassword}
            </HelperText>

            <TextInput
              label="Confirmar Nueva Contraseña *"
              value={formData.confirmPassword}
              onChangeText={(text) => {
                setFormData({ ...formData, confirmPassword: text });
                if (errors.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: undefined });
                }
              }}
              mode="outlined"
              error={!!errors.confirmPassword}
              style={styles.input}
              disabled={loading}
              secureTextEntry={!showPasswords.confirm}
              right={
                <TextInput.Icon
                  icon={showPasswords.confirm ? "eye-off" : "eye"}
                  onPress={() =>
                    setShowPasswords({
                      ...showPasswords,
                      confirm: !showPasswords.confirm,
                    })
                  }
                />
              }
              placeholder="Repita la nueva contraseña"
            />
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword}
            </HelperText>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📋 Requisitos de Contraseña</Text>
            <Text style={styles.infoText}>
              • Mínimo 8 caracteres{"\n"}• Al menos una letra mayúscula{"\n"}•
              Al menos una letra minúscula{"\n"}• Al menos un número{"\n"}• Se
              recomienda incluir símbolos (@, #, $, etc.)
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.buttonContent}
            >
              {loading ? "Actualizando..." : "Cambiar Contraseña"}
            </Button>

            <Button
              mode="outlined"
              onPress={() => router.replace("/(panel-aliado)/dashboard")}
              disabled={loading}
              style={styles.cancelButton}
              contentStyle={styles.buttonContent}
            >
              Cancelar
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 4,
    backgroundColor: "#1E1E1E",
  },
  infoCard: {
    backgroundColor: "#1A2B1A",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#9CA3AF",
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  submitButton: {
    borderRadius: 25,
    backgroundColor: "#FF0000",
  },
  cancelButton: {
    borderRadius: 25,
    borderColor: "#666666",
  },
  buttonContent: {
    height: 50,
  },
});

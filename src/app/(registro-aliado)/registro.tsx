import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ID } from "react-native-appwrite";
import { Button, HelperText, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import Logo from "@/components/Logo";
import {
  account,
  databaseId,
  databases,
  isAppwriteConfigured,
} from "@/lib/appwrite";

const ALIADOS_COLLECTION_ID = "aliado";

type AliadoFormData = {
  nombreAliado: string;
  nombre_Encargado: string;
  correoElectronico: string;
  telefonoContacto: string;
  ciudad: string;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9+\-\s()]{10,20}$/;
  return phoneRegex.test(phone.trim());
};

const generateTempPassword = (): string => {
  // Generar contraseña temporal: 8 caracteres con mayúscula, minúscula, número y símbolo
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const nums = "0123456789";
  const symbols = "@#$%";

  let password = "";
  password += chars
    .charAt(Math.floor(Math.random() * chars.length))
    .toUpperCase(); // 1 mayúscula
  password += chars.charAt(Math.floor(Math.random() * chars.length)); // 1 minúscula
  password += nums.charAt(Math.floor(Math.random() * nums.length)); // 1 número
  password += symbols.charAt(Math.floor(Math.random() * symbols.length)); // 1 símbolo

  // Completar con 4 caracteres aleatorios
  const allChars = chars + chars.toUpperCase() + nums;
  for (let i = 0; i < 4; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Mezclar los caracteres
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
};

export default function RegistroAliadoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<AliadoFormData>({
    nombreAliado: "",
    nombre_Encargado: "",
    correoElectronico: "",
    telefonoContacto: "",
    ciudad: "",
  });

  const [errors, setErrors] = useState<Partial<AliadoFormData>>({});

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      // Verificar si ya existe un aliado con este email
      const response = await databases.listDocuments(
        databaseId,
        ALIADOS_COLLECTION_ID,
        [`correoElectronico = "${email.trim().toLowerCase()}"`]
      );

      return response.documents.length > 0;
    } catch (error) {
      console.error("Error al verificar email:", error);
      // En caso de error, permitir que continúe y que falle en el registro
      return false;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AliadoFormData> = {};

    // Validar nombre del aliado
    if (!formData.nombreAliado.trim()) {
      newErrors.nombreAliado = "El nombre del aliado es requerido";
    } else if (formData.nombreAliado.length > 255) {
      newErrors.nombreAliado = "El nombre no puede exceder 255 caracteres";
    }

    // Validar nombre del encargado
    if (!formData.nombre_Encargado.trim()) {
      newErrors.nombre_Encargado = "El nombre del encargado es requerido";
    } else if (formData.nombre_Encargado.length > 255) {
      newErrors.nombre_Encargado = "El nombre no puede exceder 255 caracteres";
    }

    // Validar correo electrónico
    if (!formData.correoElectronico.trim()) {
      newErrors.correoElectronico = "El correo electrónico es requerido";
    } else if (!validateEmail(formData.correoElectronico)) {
      newErrors.correoElectronico = "Ingrese un correo electrónico válido";
    } else if (formData.correoElectronico.length > 320) {
      newErrors.correoElectronico = "El correo no puede exceder 320 caracteres";
    }

    // Validar teléfono
    if (!formData.telefonoContacto.trim()) {
      newErrors.telefonoContacto = "El teléfono de contacto es requerido";
    } else if (!validatePhone(formData.telefonoContacto)) {
      newErrors.telefonoContacto = "Ingrese un número de teléfono válido";
    } else if (formData.telefonoContacto.length > 20) {
      newErrors.telefonoContacto = "El teléfono no puede exceder 20 caracteres";
    }

    // Validar ciudad
    if (!formData.ciudad.trim()) {
      newErrors.ciudad = "La ciudad es requerida";
    } else if (formData.ciudad.length > 100) {
      newErrors.ciudad = "La ciudad no puede exceder 100 caracteres";
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
      Alert.alert(
        "Error",
        "La aplicación no está configurada correctamente. Contacte al administrador."
      );
      return;
    }

    setLoading(true);

    try {
      // Verificar si el email ya existe antes de proceder
      const emailExists = await checkEmailExists(formData.correoElectronico);

      if (emailExists) {
        Alert.alert(
          "Email ya registrado",
          "Ya existe una cuenta con este correo electrónico. Si ya está registrado, puede iniciar sesión directamente.",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Ir a Login",
              onPress: () => router.replace("/login"),
            },
          ]
        );
        return;
      }

      // 1. Crear documento en la colección de aliados
      const aliadoResponse = await databases.createDocument(
        databaseId,
        ALIADOS_COLLECTION_ID,
        ID.unique(),
        {
          nombreAliado: formData.nombreAliado.trim(),
          nombre_Encargado: formData.nombre_Encargado.trim(),
          correoElectronico: formData.correoElectronico.trim().toLowerCase(),
          telefonoContacto: formData.telefonoContacto.trim(),
          ciudad: formData.ciudad.trim(),
        }
      );

      console.log("Aliado registrado:", aliadoResponse);

      // 2. Crear cuenta de usuario con contraseña temporal
      const tempPassword = generateTempPassword();
      const userResponse = await account.create(
        ID.unique(),
        formData.correoElectronico.trim().toLowerCase(),
        tempPassword,
        formData.nombre_Encargado.trim()
      );

      console.log("Cuenta de usuario creada:", userResponse);

      Alert.alert(
        "¡Registro Completado!",
        `Su cuenta ha sido creada exitosamente.\n\n📧 Email: ${formData.correoElectronico
          .trim()
          .toLowerCase()}\n🔐 Contraseña temporal: ${tempPassword}\n\n⚠️ IMPORTANTE: Guarde estas credenciales para acceder a su cuenta. Puede cambiar la contraseña después del primer login.`,
        [
          {
            text: "Ir al Panel de Aliado",
            onPress: () => router.replace("/(panel-aliado)/dashboard"),
          },
        ]
      );

      // Limpiar formulario
      setFormData({
        nombreAliado: "",
        nombre_Encargado: "",
        correoElectronico: "",
        telefonoContacto: "",
        ciudad: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Error al registrar aliado:", error);

      let errorMessage =
        "Ocurrió un error durante el registro. Intente nuevamente.";
      let showLoginOption = false;

      if (error && typeof error === "object" && "message" in error) {
        const errorMsg = (error as any).message;

        // Error específico de Appwrite para usuario duplicado
        if (
          errorMsg.includes(
            "A user with the same id, email, or phone already exists"
          ) ||
          errorMsg.includes("A user with the same email already exists") ||
          errorMsg.includes("unique") ||
          errorMsg.includes("duplicate")
        ) {
          errorMessage =
            "Ya existe una cuenta con este correo electrónico. Si ya está registrado, puede iniciar sesión directamente.";
          showLoginOption = true;
        } else if (errorMsg.includes("Password")) {
          errorMessage =
            "Error al crear la cuenta. Verifique que el correo electrónico sea válido.";
        }
      }

      if (showLoginOption) {
        Alert.alert("Usuario Existente", errorMessage, [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Ir a Login",
            onPress: () => router.replace("/login"),
          },
        ]);
      } else {
        Alert.alert("Error", errorMessage);
      }
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
            <Logo width={120} height={120} />
            <Text style={styles.title}>Registro de Aliado</Text>
            <Text style={styles.subtitle}>
              Únete a nuestra red de talleres especializados
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Nombre del Taller/Empresa *"
              value={formData.nombreAliado}
              onChangeText={(text) => {
                setFormData({ ...formData, nombreAliado: text });
                if (errors.nombreAliado) {
                  setErrors({ ...errors, nombreAliado: undefined });
                }
              }}
              mode="outlined"
              error={!!errors.nombreAliado}
              style={styles.input}
              disabled={loading}
              maxLength={255}
              placeholder="Ej: AutoServicio Premium"
            />
            <HelperText type="error" visible={!!errors.nombreAliado}>
              {errors.nombreAliado}
            </HelperText>

            <TextInput
              label="Nombre del Encargado *"
              value={formData.nombre_Encargado}
              onChangeText={(text) => {
                setFormData({ ...formData, nombre_Encargado: text });
                if (errors.nombre_Encargado) {
                  setErrors({ ...errors, nombre_Encargado: undefined });
                }
              }}
              mode="outlined"
              error={!!errors.nombre_Encargado}
              style={styles.input}
              disabled={loading}
              maxLength={255}
              placeholder="Ej: Juan Carlos Pérez"
            />
            <HelperText type="error" visible={!!errors.nombre_Encargado}>
              {errors.nombre_Encargado}
            </HelperText>

            <TextInput
              label="Correo Electrónico *"
              value={formData.correoElectronico}
              onChangeText={(text) => {
                setFormData({ ...formData, correoElectronico: text });
                if (errors.correoElectronico) {
                  setErrors({ ...errors, correoElectronico: undefined });
                }
              }}
              mode="outlined"
              error={!!errors.correoElectronico}
              style={styles.input}
              disabled={loading}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={320}
              placeholder="Ej: contacto@autoservicio.com"
            />
            <HelperText type="error" visible={!!errors.correoElectronico}>
              {errors.correoElectronico}
            </HelperText>

            <TextInput
              label="Teléfono de Contacto *"
              value={formData.telefonoContacto}
              onChangeText={(text) => {
                setFormData({ ...formData, telefonoContacto: text });
                if (errors.telefonoContacto) {
                  setErrors({ ...errors, telefonoContacto: undefined });
                }
              }}
              mode="outlined"
              error={!!errors.telefonoContacto}
              style={styles.input}
              disabled={loading}
              keyboardType="phone-pad"
              maxLength={20}
              placeholder="Ej: +57 301 234 5678"
            />
            <HelperText type="error" visible={!!errors.telefonoContacto}>
              {errors.telefonoContacto}
            </HelperText>

            <TextInput
              label="Ciudad *"
              value={formData.ciudad}
              onChangeText={(text) => {
                setFormData({ ...formData, ciudad: text });
                if (errors.ciudad) {
                  setErrors({ ...errors, ciudad: undefined });
                }
              }}
              mode="outlined"
              error={!!errors.ciudad}
              style={styles.input}
              disabled={loading}
              maxLength={100}
              placeholder="Ej: Bogotá"
            />
            <HelperText type="error" visible={!!errors.ciudad}>
              {errors.ciudad}
            </HelperText>
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
              {loading ? "Registrando..." : "Registrar Aliado"}
            </Button>

            <Button
              mode="outlined"
              onPress={() => router.back()}
              disabled={loading}
              style={styles.cancelButton}
              contentStyle={styles.buttonContent}
            >
              Cancelar
            </Button>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Al registrarte aceptas formar parte de nuestra red de aliados
              especializados
            </Text>
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
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 4,
    backgroundColor: "#1E1E1E",
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
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
  footer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    lineHeight: 18,
  },
});

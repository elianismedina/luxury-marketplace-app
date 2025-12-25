import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ID } from "react-native-appwrite";
import { Button, HelperText, Searchbar, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import Logo from "@/components/Logo";
import { COLOMBIAN_CITIES } from "@/constants/cities";
import {
  account,
  databaseId,
  databases,
  isAppwriteConfigured,
  Query,
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
  const { t } = useTranslation();

  const [formData, setFormData] = useState<AliadoFormData>({
    nombreAliado: "",
    nombre_Encargado: "",
    correoElectronico: "",
    telefonoContacto: "",
    ciudad: "",
  });

  const [errors, setErrors] = useState<Partial<AliadoFormData>>({});
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const filteredCities = COLOMBIAN_CITIES.filter((city) =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      // Verificar si ya existe un aliado con este email

      const response = await databases.listDocuments(
        databaseId,
        ALIADOS_COLLECTION_ID,
        [Query.equal("correoElectronico", email.trim().toLowerCase())]
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
      newErrors.nombreAliado = t(
        "aliado_registro.errors.workshop_name_required"
      );
    } else if (formData.nombreAliado.length > 255) {
      newErrors.nombreAliado = t(
        "aliado_registro.errors.workshop_name_too_long"
      );
    }

    // Validar nombre del encargado
    if (!formData.nombre_Encargado.trim()) {
      newErrors.nombre_Encargado = t(
        "aliado_registro.errors.manager_name_required"
      );
    } else if (formData.nombre_Encargado.length > 255) {
      newErrors.nombre_Encargado = t(
        "aliado_registro.errors.manager_name_too_long"
      );
    }

    // Validar correo electrónico
    if (!formData.correoElectronico.trim()) {
      newErrors.correoElectronico = t("aliado_registro.errors.email_required");
    } else if (!validateEmail(formData.correoElectronico)) {
      newErrors.correoElectronico = t("aliado_registro.errors.email_invalid");
    } else if (formData.correoElectronico.length > 320) {
      newErrors.correoElectronico = t("aliado_registro.errors.email_too_long");
    }

    // Validar teléfono
    if (!formData.telefonoContacto.trim()) {
      newErrors.telefonoContacto = t("aliado_registro.errors.phone_required");
    } else if (!validatePhone(formData.telefonoContacto)) {
      newErrors.telefonoContacto = t("aliado_registro.errors.phone_invalid");
    } else if (formData.telefonoContacto.length > 20) {
      newErrors.telefonoContacto = t("aliado_registro.errors.phone_too_long");
    }

    // Validar ciudad
    if (!formData.ciudad.trim()) {
      newErrors.ciudad = t("aliado_registro.errors.city_required");
    } else if (formData.ciudad.length > 100) {
      newErrors.ciudad = t("aliado_registro.errors.city_too_long");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(t("common.error"), t("aliado_registro.errors.form_invalid"));
      return;
    }

    if (!isAppwriteConfigured) {
      Alert.alert(
        t("common.error"),
        t("aliado_registro.errors.appwrite_not_configured")
      );
      return;
    }

    setLoading(true);

    try {
      // Verificar si el email ya existe antes de proceder
      const emailExists = await checkEmailExists(formData.correoElectronico);

      if (emailExists) {
        Alert.alert(
          t("aliado_registro.errors.email_exists_title"),
          t("aliado_registro.errors.email_exists_msg"),
          [
            {
              text: t("common.cancelar"),
              style: "cancel",
            },
            {
              text: t("common.ir_a_login"),
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

      // 3. Llamar función Appwrite para agregar al team 'aliados' con rol 'ALIADO'
      const ALIADOS_TEAM_ID = "6942bcc6001056b6c3d8"; // ID del team 'aliados'
      const ADD_TO_TEAM_FUNCTION_ID = "6942d4ff001e477fedc0"; // ID de la función Appwrite
      try {
        // Llamada HTTP a la función Appwrite (REST API)
        const functionEndpoint = `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT}/functions/${ADD_TO_TEAM_FUNCTION_ID}/executions`;
        const response = await fetch(functionEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Appwrite-Project":
              process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || "",
          } as HeadersInit,
          body: JSON.stringify({
            userId: userResponse.$id,
            teamId: ALIADOS_TEAM_ID,
            email: formData.correoElectronico.trim().toLowerCase(),
            name: formData.nombre_Encargado.trim(),
            roles: ["ALIADO"],
          }),
        });
        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || "No se pudo asignar el rol de aliado");
        }
      } catch (err) {
        console.error("Error al asignar team via función Appwrite:", err);
        // No bloquear el registro si falla el team, pero mostrar alerta
        Alert.alert(
          t("common.advertencia"),
          t("aliado_registro.errors.team_assignment_fail")
        );
      }

      // 4. Login automático tras registro
      try {
        await account.createEmailPasswordSession({
          email: formData.correoElectronico.trim().toLowerCase(),
          password: tempPassword,
        });
      } catch (err) {
        console.error("Error en login automático tras registro:", err);
        Alert.alert(
          t("common.advertencia"),
          t("aliado_registro.errors.auto_login_fail")
        );
      }

      Alert.alert(
        t("aliado_registro.success.title"),
        `${t("aliado_registro.success.msg")}\n\n📧 ${t(
          "aliado_registro.success.email_label"
        )}: ${formData.correoElectronico.trim().toLowerCase()}\n🔐 ${t(
          "aliado_registro.success.temp_password_label"
        )}: ${tempPassword}\n\n⚠️ ${t(
          "aliado_registro.success.important_warning"
        )}`,
        [
          {
            text: t("aliado_registro.success.go_to_panel_btn"),
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

      let errorMessage = t("aliado_registro.errors.generic_error");
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
          errorMessage = t("aliado_registro.errors.email_exists_msg");
          showLoginOption = true;
        } else if (errorMsg.includes("Password")) {
          errorMessage = t("aliado_registro.errors.generic_error"); // Could be more specific if keys were added
        }
      }

      if (showLoginOption) {
        Alert.alert(
          t("aliado_registro.errors.user_exists_title"),
          errorMessage,
          [
            {
              text: t("common.cancelar"),
              style: "cancel",
            },
            {
              text: t("common.ir_a_login"),
              onPress: () => router.replace("/login"),
            },
          ]
        );
      } else {
        Alert.alert(t("common.error"), errorMessage);
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
            <Text style={styles.title}>{t("aliado_registro.title")}</Text>
            <Text style={styles.subtitle}>{t("aliado_registro.subtitle")}</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label={t("aliado_registro.form.workshop_name_label")}
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
              placeholder={t("aliado_registro.form.workshop_name_placeholder")}
            />
            <HelperText type="error" visible={!!errors.nombreAliado}>
              {errors.nombreAliado}
            </HelperText>

            <TextInput
              label={t("aliado_registro.form.manager_name_label")}
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
              placeholder={t("aliado_registro.form.manager_name_placeholder")}
            />
            <HelperText type="error" visible={!!errors.nombre_Encargado}>
              {errors.nombre_Encargado}
            </HelperText>

            <TextInput
              label={t("aliado_registro.form.email_label")}
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
              placeholder={t("aliado_registro.form.email_placeholder")}
            />
            <HelperText type="error" visible={!!errors.correoElectronico}>
              {errors.correoElectronico}
            </HelperText>

            <TextInput
              label={t("aliado_registro.form.phone_label")}
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
              keyboardType="number-pad"
              maxLength={20}
              placeholder={t("aliado_registro.form.phone_placeholder")}
            />
            <HelperText type="error" visible={!!errors.telefonoContacto}>
              {errors.telefonoContacto}
            </HelperText>

            <Pressable
              onPress={() => setCityModalVisible(true)}
              disabled={loading}
            >
              <View pointerEvents="none">
                <TextInput
                  label={t("aliado_registro.form.city_label")}
                  value={formData.ciudad}
                  mode="outlined"
                  error={!!errors.ciudad}
                  style={styles.input}
                  editable={false}
                  placeholder={t("aliado_registro.form.city_placeholder")}
                  right={<TextInput.Icon icon="chevron-down" />}
                />
              </View>
            </Pressable>
            <HelperText type="error" visible={!!errors.ciudad}>
              {errors.ciudad}
            </HelperText>
          </View>

          <Modal
            visible={cityModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setCityModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {t("common.seleccionar_ciudad")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCityModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Searchbar
                  placeholder={t("common.seleccionar_ciudad")}
                  onChangeText={setCitySearch}
                  value={citySearch}
                  style={styles.searchBar}
                  inputStyle={styles.searchBarInput}
                  iconColor="#9CA3AF"
                  placeholderTextColor="#6B7280"
                />

                <FlatList
                  data={filteredCities}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.cityItem}
                      onPress={() => {
                        setFormData({ ...formData, ciudad: item });
                        if (errors.ciudad) {
                          setErrors({ ...errors, ciudad: undefined });
                        }
                        setCityModalVisible(false);
                        setCitySearch("");
                      }}
                    >
                      <Text style={styles.cityText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  style={styles.cityList}
                />
              </View>
            </View>
          </Modal>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.buttonContent}
            >
              {loading
                ? t("aliado_registro.form.submitting_btn")
                : t("aliado_registro.form.submit_btn")}
            </Button>

            <Button
              mode="outlined"
              onPress={() => router.back()}
              disabled={loading}
              style={styles.cancelButton}
              contentStyle={styles.buttonContent}
            >
              {t("common.cancelar")}
            </Button>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("aliado_registro.footer")}</Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1E1E1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: "#9CA3AF",
    fontSize: 24,
  },
  searchBar: {
    backgroundColor: "#2D2D2D",
    marginBottom: 15,
    borderRadius: 10,
    elevation: 0,
  },
  searchBarInput: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  cityList: {
    flex: 1,
  },
  cityItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
  },
  cityText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
});

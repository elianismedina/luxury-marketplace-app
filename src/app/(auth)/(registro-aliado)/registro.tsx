import { useSignUp } from "@clerk/clerk-expo";
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
import { Button, Searchbar, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import Logo from "@/components/Logo";
import { COLOMBIAN_CITIES } from "@/constants/cities";

import { databaseId, databases, Query } from "@/lib/appwrite";

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
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const nums = "0123456789";
  const symbols = "@#$%";

  let password = "";
  password += chars
    .charAt(Math.floor(Math.random() * chars.length))
    .toUpperCase();
  password += chars.charAt(Math.floor(Math.random() * chars.length));
  password += nums.charAt(Math.floor(Math.random() * nums.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));

  const allChars = chars + chars.toUpperCase() + nums;
  for (let i = 0; i < 4; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
};

export default function RegistroAliadoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { isLoaded, signUp, setActive } = useSignUp();

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
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [tempPasswordUsed, setTempPasswordUsed] = useState("");

  const filteredCities = COLOMBIAN_CITIES.filter((city) =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const response = await databases.listDocuments(
        databaseId,
        ALIADOS_COLLECTION_ID,
        [Query.equal("correoElectronico", email.trim().toLowerCase())]
      );
      return response.documents.length > 0;
    } catch (error) {
      console.error("Error al verificar email:", error);
      return false;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AliadoFormData> = {};
    if (!formData.nombreAliado.trim()) {
      newErrors.nombreAliado = t(
        "aliado_registro.errors.workshop_name_required"
      );
    }
    if (!formData.nombre_Encargado.trim()) {
      newErrors.nombre_Encargado = t(
        "aliado_registro.errors.manager_name_required"
      );
    }
    if (!formData.correoElectronico.trim()) {
      newErrors.correoElectronico = t("aliado_registro.errors.email_required");
    } else if (!validateEmail(formData.correoElectronico)) {
      newErrors.correoElectronico = t("aliado_registro.errors.email_invalid");
    }
    if (!formData.telefonoContacto.trim()) {
      newErrors.telefonoContacto = t("aliado_registro.errors.phone_required");
    } else if (!validatePhone(formData.telefonoContacto)) {
      newErrors.telefonoContacto = t("aliado_registro.errors.phone_invalid");
    }
    if (!formData.ciudad.trim()) {
      newErrors.ciudad = t("aliado_registro.errors.city_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!isLoaded) return;
    if (!validateForm()) {
      Alert.alert(t("common.error"), t("aliado_registro.errors.form_invalid"));
      return;
    }

    setLoading(true);

    try {
      // 1. Verificar email duplicado en Appwrite
      const emailExists = await checkEmailExists(formData.correoElectronico);
      if (emailExists) {
        Alert.alert(
          t("aliado_registro.errors.email_exists_title"),
          t("aliado_registro.errors.email_exists_msg"),
          [
            {
              text: t("common.ir_a_login"),
              onPress: () => router.replace("/sign-in"),
            },
          ]
        );
        return;
      }

      // 2. Registrar en Appwrite (Datos de negocio)
      await databases.createDocument(
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

      // 3. Crear cuenta en Clerk
      const tempPass = generateTempPassword();
      setTempPasswordUsed(tempPass);

      await signUp.create({
        emailAddress: formData.correoElectronico.trim().toLowerCase(),
        password: tempPass,
        firstName: formData.nombre_Encargado.trim(),
        unsafeMetadata: {
          role: "aliado",
          temporaryPassword: true,
          workshopName: formData.nombreAliado.trim(),
        },
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setIsVerifying(true);
    } catch (error: any) {
      console.error("Error al registrar:", error);
      Alert.alert(
        t("common.error"),
        error.message || t("aliado_registro.errors.generic_error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });

        Alert.alert(
          t("aliado_registro.success.title"),
          `${t(
            "aliado_registro.success.msg"
          )}\n\n🔐 Contraseña temporal: ${tempPasswordUsed}`,
          [
            {
              text: "Ir al Dashboard",
              onPress: () => router.replace("/(panel-aliado)/dashboard"),
            },
          ]
        );
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
      }
    } catch (error: any) {
      Alert.alert(
        t("auth.errors.verify_error_title"),
        error.message || t("auth.errors.verify_fail")
      );
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

          {isVerifying ? (
            <View style={styles.form}>
              <Text style={styles.verificationText}>
                {t("auth.verify_email_subtitle", {
                  email: formData.correoElectronico,
                })}
              </Text>
              <TextInput
                label={t("auth.verification_code_label")}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                mode="outlined"
                style={styles.input}
                textColor="#FFFFFF"
              />
              <Button
                mode="contained"
                onPress={handleVerifyCode}
                loading={loading}
                disabled={loading || verificationCode.length < 6}
                style={styles.submitButton}
              >
                {t("auth.verify_button")}
              </Button>
            </View>
          ) : (
            <>
              <View style={styles.form}>
                <TextInput
                  label={t("aliado_registro.form.workshop_name_label")}
                  value={formData.nombreAliado}
                  onChangeText={(text) =>
                    setFormData({ ...formData, nombreAliado: text })
                  }
                  mode="outlined"
                  error={!!errors.nombreAliado}
                  style={styles.input}
                  disabled={loading}
                  textColor="#FFFFFF"
                />
                <TextInput
                  label={t("aliado_registro.form.manager_name_label")}
                  value={formData.nombre_Encargado}
                  onChangeText={(text) =>
                    setFormData({ ...formData, nombre_Encargado: text })
                  }
                  mode="outlined"
                  error={!!errors.nombre_Encargado}
                  style={styles.input}
                  disabled={loading}
                  textColor="#FFFFFF"
                />
                <TextInput
                  label={t("aliado_registro.form.email_label")}
                  value={formData.correoElectronico}
                  onChangeText={(text) =>
                    setFormData({ ...formData, correoElectronico: text })
                  }
                  mode="outlined"
                  error={!!errors.correoElectronico}
                  style={styles.input}
                  disabled={loading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textColor="#FFFFFF"
                />
                <TextInput
                  label={t("aliado_registro.form.phone_label")}
                  value={formData.telefonoContacto}
                  onChangeText={(text) =>
                    setFormData({ ...formData, telefonoContacto: text })
                  }
                  mode="outlined"
                  error={!!errors.telefonoContacto}
                  style={styles.input}
                  disabled={loading}
                  keyboardType="number-pad"
                  textColor="#FFFFFF"
                />
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
                      textColor="#FFFFFF"
                      right={<TextInput.Icon icon="chevron-down" />}
                    />
                  </View>
                </Pressable>
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={loading}
                  style={styles.submitButton}
                >
                  {t("aliado_registro.form.submit_btn")}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => router.back()}
                  style={styles.cancelButton}
                  textColor="#666666"
                >
                  {t("common.cancelar")}
                </Button>
              </View>
            </>
          )}

          <Modal
            visible={cityModalVisible}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {t("common.seleccionar_ciudad")}
                  </Text>
                  <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Searchbar
                  placeholder={t("common.seleccionar_ciudad")}
                  onChangeText={setCitySearch}
                  value={citySearch}
                  style={styles.searchBar}
                />
                <FlatList
                  data={filteredCities}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.cityItem}
                      onPress={() => {
                        setFormData({ ...formData, ciudad: item });
                        setCityModalVisible(false);
                      }}
                    >
                      <Text style={styles.cityText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("aliado_registro.footer")}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#121212" },
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 24 },
  header: { alignItems: "center", marginBottom: 32 },
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
  form: { marginBottom: 24, gap: 8 },
  input: { backgroundColor: "#1E1E1E" },
  buttonContainer: { gap: 12, marginBottom: 24 },
  submitButton: {
    borderRadius: 8,
    backgroundColor: "#FF0000",
    paddingVertical: 4,
  },
  cancelButton: { borderRadius: 8, borderColor: "#666666" },
  footer: { alignItems: "center", paddingVertical: 16 },
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
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF" },
  closeButtonText: { color: "#9CA3AF", fontSize: 24 },
  searchBar: {
    backgroundColor: "#2D2D2D",
    marginBottom: 15,
    borderRadius: 10,
    elevation: 0,
  },
  cityItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
  },
  cityText: { fontSize: 16, color: "#FFFFFF" },
  verificationText: {
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 15,
  },
});

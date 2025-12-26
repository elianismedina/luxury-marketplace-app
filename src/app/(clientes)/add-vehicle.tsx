import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ID } from "react-native-appwrite";
import {
  Button,
  HelperText,
  IconButton,
  Modal,
  Portal,
  Snackbar,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { LUXURY_BRANDS } from "@/constants/brands";
import { COMBUSTIBLES } from "@/constants/combustibles";
import { TRANSMISSIONS } from "@/constants/transmissions";
import { useAuth } from "@/context/AuthContext";
import {
  bucketId,
  databaseId,
  databases,
  isAppwriteConfigured,
  storage,
} from "@/lib/appwrite";

const VEHICULOS_COLLECTION_ID =
  process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_VEHICULO_ID ?? "vehiculo";

type VehiculoFormData = {
  marca: string;
  linea: string;
  combustible: string;
  modelo: string;
  motor: string;
  cajasCambios: string;
  fechaVencimientoSOAT: string;
};

export default function AddVehicleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showBrandMenu, setShowBrandMenu] = useState(false);
  const [showCombustibleMenu, setShowCombustibleMenu] = useState(false);
  const [showTransmissionMenu, setShowTransmissionMenu] = useState(false);
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear + 1 - 1950 + 1 }, (_, i) =>
    (currentYear + 1 - i).toString()
  );

  const [formData, setFormData] = useState<VehiculoFormData>({
    marca: "",
    linea: "",
    combustible: "",
    modelo: "",
    motor: "",
    cajasCambios: "",
    fechaVencimientoSOAT: "",
  });

  const [errors, setErrors] = useState<Partial<VehiculoFormData>>({});

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Se necesita permiso para acceder a las fotos"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<VehiculoFormData> = {};

    if (!formData.marca.trim()) newErrors.marca = "La marca es requerida";
    if (!formData.linea.trim()) newErrors.linea = "La línea es requerida";
    if (!formData.combustible.trim())
      newErrors.combustible = "El combustible es requerido";
    if (!formData.modelo.trim()) newErrors.modelo = "El modelo es requerido";
    if (!formData.motor.trim()) newErrors.motor = "El motor es requerido";
    if (!formData.cajasCambios.trim())
      newErrors.cajasCambios = "La transmisión es requerida";
    if (!formData.fechaVencimientoSOAT.trim())
      newErrors.fechaVencimientoSOAT = "La fecha de vencimiento es requerida";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    if (!isAppwriteConfigured) {
      Alert.alert("Error", "Appwrite no está configurado correctamente");
      return;
    }

    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión para registrar un vehículo");
      return;
    }

    // Convertir fecha de DD/MM/AAAA a ISO 8601
    const [day, month, year] = formData.fechaVencimientoSOAT.split("/");
    let fechaISO: string;
    try {
      const fecha = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      if (isNaN(fecha.getTime())) {
        Alert.alert("Error", "Formato de fecha inválido. Use DD/MM/AAAA");
        return;
      }
      fechaISO = fecha.toISOString();
    } catch (error) {
      Alert.alert("Error", "Formato de fecha inválido. Use DD/MM/AAAA");
      return;
    }

    setLoading(true);
    let imageId: string | undefined;

    try {
      // Upload image if selected
      if (imageUri) {
        setUploadingImage(true);
        try {
          const response = await fetch(imageUri);
          const blob = await response.blob();

          // Crear el objeto file compatible con React Native
          const file = {
            name: `vehiculo_${Date.now()}.jpg`,
            type: "image/jpeg",
            size: blob.size,
            uri: imageUri,
          };

          const uploadResult = await storage.createFile(
            bucketId,
            ID.unique(),
            file
          );
          imageId = uploadResult.$id;
        } catch (uploadError) {
          console.error("Error al subir imagen:", uploadError);
          Alert.alert(
            "Advertencia",
            "No se pudo subir la imagen, pero el vehículo se registrará sin foto"
          );
        } finally {
          setUploadingImage(false);
        }
      }

      await databases.createDocument(
        databaseId,
        VEHICULOS_COLLECTION_ID,
        ID.unique(),
        {
          userId: user.id,
          marca: formData.marca.trim(),
          linea: formData.linea.trim(),
          combustible: formData.combustible.trim(),
          modelo: formData.modelo.trim(),
          motor: formData.motor.trim(),
          cajacambios: formData.cajasCambios.trim(),
          fechaVencimientoSoat: fechaISO,
          imageId: imageId || "",
        }
      );

      // Limpiar el formulario
      setFormData({
        marca: "",
        linea: "",
        combustible: "",
        modelo: "",
        motor: "",
        cajasCambios: "",
        fechaVencimientoSOAT: "",
      });
      setErrors({});
      setImageUri(null);

      // Mostrar Snackbar y redirigir
      setSnackbarMessage("✓ Vehículo registrado correctamente");
      setSnackbarVisible(true);

      // Redirigir a Mi Garaje después de un breve delay
      setTimeout(() => {
        router.push("/garage");
      }, 1500);
    } catch (error: any) {
      console.error("Error al registrar vehículo:", error);
      Alert.alert("Error", error.message || "No se pudo registrar el vehículo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineMedium" style={styles.title}>
          Registrar Vehículo
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Completa la información de tu vehículo
        </Text>

        <View style={styles.imageSection}>
          <Text variant="titleMedium" style={styles.imageSectionTitle}>
            Foto del vehículo
          </Text>
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <IconButton
                icon="close-circle"
                size={32}
                onPress={removeImage}
                style={styles.removeImageButton}
                iconColor="#fff"
              />
            </View>
          ) : (
            <Button
              mode="outlined"
              onPress={pickImage}
              icon="camera"
              disabled={loading}
              style={styles.imageButton}
              buttonColor={theme.colors.secondary}
              textColor="#FFFFFF"
            >
              Seleccionar imagen
            </Button>
          )}
        </View>

        <View style={styles.form}>
          <TouchableRipple onPress={() => setShowBrandMenu(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Marca"
                value={formData.marca}
                mode="outlined"
                error={!!errors.marca}
                style={styles.input}
                editable={false}
                right={<TextInput.Icon icon="chevron-down" />}
              />
            </View>
          </TouchableRipple>

          <Portal>
            <Modal
              visible={showBrandMenu}
              onDismiss={() => setShowBrandMenu(false)}
              contentContainerStyle={styles.modalContent}
            >
              <Text variant="titleMedium" style={styles.modalTitle}>
                Seleccione la Marca
              </Text>
              <FlatList
                data={LUXURY_BRANDS}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableRipple
                    onPress={() => {
                      setFormData({ ...formData, marca: item });
                      if (errors.marca)
                        setErrors({ ...errors, marca: undefined });
                      setShowBrandMenu(false);
                    }}
                    style={styles.yearItem}
                  >
                    <Text style={styles.yearText}>{item}</Text>
                  </TouchableRipple>
                )}
              />
            </Modal>
          </Portal>
          {errors.marca && (
            <HelperText type="error" visible={!!errors.marca}>
              {errors.marca}
            </HelperText>
          )}

          <TextInput
            label="Línea"
            value={formData.linea}
            onChangeText={(text) => {
              setFormData({ ...formData, linea: text });
              if (errors.linea) setErrors({ ...errors, linea: undefined });
            }}
            mode="outlined"
            error={!!errors.linea}
            style={styles.input}
            disabled={loading}
          />
          {errors.linea && (
            <HelperText type="error" visible={!!errors.linea}>
              {errors.linea}
            </HelperText>
          )}

          <TouchableRipple onPress={() => setShowCombustibleMenu(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Combustible"
                value={formData.combustible}
                mode="outlined"
                error={!!errors.combustible}
                style={styles.input}
                placeholder="Seleccione combustible"
                editable={false}
                right={<TextInput.Icon icon="chevron-down" />}
              />
            </View>
          </TouchableRipple>

          <Portal>
            <Modal
              visible={showCombustibleMenu}
              onDismiss={() => setShowCombustibleMenu(false)}
              contentContainerStyle={styles.modalContent}
            >
              <Text variant="titleMedium" style={styles.modalTitle}>
                Seleccione el Combustible
              </Text>
              <FlatList
                data={COMBUSTIBLES}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableRipple
                    onPress={() => {
                      setFormData({ ...formData, combustible: item });
                      if (errors.combustible)
                        setErrors({ ...errors, combustible: undefined });
                      setShowCombustibleMenu(false);
                    }}
                    style={styles.yearItem}
                  >
                    <Text style={styles.yearText}>{item}</Text>
                  </TouchableRipple>
                )}
              />
            </Modal>
          </Portal>
          {errors.combustible && (
            <HelperText type="error" visible={!!errors.combustible}>
              {errors.combustible}
            </HelperText>
          )}

          <TouchableRipple onPress={() => setShowYearMenu(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Modelo (Año)"
                value={formData.modelo}
                mode="outlined"
                error={!!errors.modelo}
                style={styles.input}
                placeholder="Seleccione año"
                editable={false}
                right={<TextInput.Icon icon="chevron-down" />}
              />
            </View>
          </TouchableRipple>

          <Portal>
            <Modal
              visible={showYearMenu}
              onDismiss={() => setShowYearMenu(false)}
              contentContainerStyle={styles.modalContent}
            >
              <Text variant="titleMedium" style={styles.modalTitle}>
                Seleccione el Año
              </Text>
              <FlatList
                data={years}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableRipple
                    onPress={() => {
                      setFormData({ ...formData, modelo: item });
                      if (errors.modelo)
                        setErrors({ ...errors, modelo: undefined });
                      setShowYearMenu(false);
                    }}
                    style={styles.yearItem}
                  >
                    <Text style={styles.yearText}>{item}</Text>
                  </TouchableRipple>
                )}
                style={{ maxHeight: 300 }}
              />
            </Modal>
          </Portal>
          {errors.modelo && (
            <HelperText type="error" visible={!!errors.modelo}>
              {errors.modelo}
            </HelperText>
          )}

          <TextInput
            label="Motor"
            value={formData.motor}
            onChangeText={(text) => {
              setFormData({ ...formData, motor: text });
              if (errors.motor) setErrors({ ...errors, motor: undefined });
            }}
            mode="outlined"
            error={!!errors.motor}
            style={styles.input}
            placeholder="Ej: 2.0L Turbo"
            disabled={loading}
          />
          {errors.motor && (
            <HelperText type="error" visible={!!errors.motor}>
              {errors.motor}
            </HelperText>
          )}

          <TouchableRipple onPress={() => setShowTransmissionMenu(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Transmisión"
                value={formData.cajasCambios}
                mode="outlined"
                error={!!errors.cajasCambios}
                style={styles.input}
                placeholder="Seleccione transmisión"
                editable={false}
                right={<TextInput.Icon icon="chevron-down" />}
              />
            </View>
          </TouchableRipple>

          <Portal>
            <Modal
              visible={showTransmissionMenu}
              onDismiss={() => setShowTransmissionMenu(false)}
              contentContainerStyle={styles.modalContent}
            >
              <Text variant="titleMedium" style={styles.modalTitle}>
                Seleccione la Transmisión
              </Text>
              <FlatList
                data={TRANSMISSIONS}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableRipple
                    onPress={() => {
                      setFormData({ ...formData, cajasCambios: item });
                      if (errors.cajasCambios)
                        setErrors({ ...errors, cajasCambios: undefined });
                      setShowTransmissionMenu(false);
                    }}
                    style={styles.yearItem}
                  >
                    <Text style={styles.yearText}>{item}</Text>
                  </TouchableRipple>
                )}
              />
            </Modal>
          </Portal>
          {errors.cajasCambios && (
            <HelperText type="error" visible={!!errors.cajasCambios}>
              {errors.cajasCambios}
            </HelperText>
          )}

          <TouchableRipple onPress={() => setShowDatePicker(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Fecha Vencimiento SOAT"
                value={formData.fechaVencimientoSOAT}
                mode="outlined"
                error={!!errors.fechaVencimientoSOAT}
                style={styles.input}
                placeholder="DD/MM/AAAA"
                editable={false}
                right={<TextInput.Icon icon="calendar" />}
              />
            </View>
          </TouchableRipple>
          {showDatePicker && (
            <DateTimePicker
              value={(() => {
                if (formData.fechaVencimientoSOAT) {
                  const [day, month, year] =
                    formData.fechaVencimientoSOAT.split("/");
                  return new Date(
                    parseInt(year),
                    parseInt(month) - 1,
                    parseInt(day)
                  );
                }
                return new Date();
              })()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                if (Platform.OS === "android") {
                  setShowDatePicker(false);
                }
                if (selectedDate && event.type !== "dismissed") {
                  const day = selectedDate
                    .getDate()
                    .toString()
                    .padStart(2, "0");
                  const month = (selectedDate.getMonth() + 1)
                    .toString()
                    .padStart(2, "0");
                  const year = selectedDate.getFullYear();
                  setFormData({
                    ...formData,
                    fechaVencimientoSOAT: `${day}/${month}/${year}`,
                  });
                  if (errors.fechaVencimientoSOAT)
                    setErrors({ ...errors, fechaVencimientoSOAT: undefined });
                }
                if (Platform.OS === "ios") {
                  // On iOS we might want to manually close it if it's in a modal,
                  // or keep it if it's inline. Here assuming default behavior (modal/compact-like popup)
                  // For simplicity in this stack, we'll let user tap outside or add a done button if needed,
                  // but standard DateTimePicker on iOS often needs wrapping if not inline.
                  // However, 'default' on iOS 14+ is usually a compact picker.
                  // To be safe and consistent, we'll auto-close on selection if it's not inline.
                  // But often iOS users expect to see the change live.
                  setShowDatePicker(false);
                }
              }}
              locale="es-ES"
            />
          )}
          {errors.fechaVencimientoSOAT && (
            <HelperText type="error" visible={!!errors.fechaVencimientoSOAT}>
              {errors.fechaVencimientoSOAT}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor={theme.colors.secondary}
          >
            {loading ? "Guardando..." : "Registrar Vehículo"}
          </Button>
          <Button
            mode="outlined"
            onPress={() => {
              // Limpiar datos y redirigir
              setFormData({
                marca: "",
                linea: "",
                combustible: "",
                modelo: "",
                motor: "",
                cajasCambios: "",
                fechaVencimientoSOAT: "",
              });
              setErrors({});
              setImageUri(null);
              router.push("/garage");
            }}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
            textColor={theme.colors.error}
          >
            Cancelar
          </Button>
        </View>
      </ScrollView>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2500}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  subtitle: {
    marginBottom: 24,
    opacity: 0.7,
  },
  imageSection: {
    marginBottom: 24,
  },
  imageSectionTitle: {
    marginBottom: 12,
    fontWeight: "600",
  },
  imagePreviewContainer: {
    position: "relative",
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#2A2A2A",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  imageButton: {
    borderStyle: "dashed",
    borderWidth: 2,
    paddingVertical: 32,
  },
  form: {
    gap: 8,
  },
  input: {
    backgroundColor: "#2A2A2A",
  },
  button: {
    marginTop: 16,
  },
  cancelButton: {
    marginTop: 12,
    borderColor: "#CF6679",
  },
  buttonContent: {
    paddingVertical: 8,
  },
  snackbar: {
    backgroundColor: "#10B981",
  },
  modalContent: {
    backgroundColor: "#2A2A2A",
    margin: 20,
    borderRadius: 8,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
  },
  yearItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3E3E3E",
  },
  yearText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
  },
});

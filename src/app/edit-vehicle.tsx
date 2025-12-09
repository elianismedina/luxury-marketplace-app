import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ID } from "react-native-appwrite";
import {
  Button,
  HelperText,
  IconButton,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import {
  bucketId,
  databaseId,
  databases,
  endpoint,
  isAppwriteConfigured,
  projectId,
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

export default function EditVehicleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageId, setExistingImageId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

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

  // Load vehicle data
  useEffect(() => {
    const loadVehicle = async () => {
      if (!id || typeof id !== "string") {
        Alert.alert("Error", "ID de vehículo no válido");
        router.back();
        return;
      }

      if (!isAppwriteConfigured) {
        Alert.alert("Error", "Appwrite no está configurado correctamente");
        router.back();
        return;
      }

      try {
        const vehicle = await databases.getDocument(
          databaseId,
          VEHICULOS_COLLECTION_ID,
          id
        );

        // Convert ISO date to DD/MM/YYYY
        const fecha = new Date(vehicle.fechaVencimientoSoat);
        const day = String(fecha.getDate()).padStart(2, "0");
        const month = String(fecha.getMonth() + 1).padStart(2, "0");
        const year = fecha.getFullYear();
        const fechaFormateada = `${day}/${month}/${year}`;

        setFormData({
          marca: vehicle.marca || "",
          linea: vehicle.linea || "",
          combustible: vehicle.combustible || "",
          modelo: vehicle.modelo || "",
          motor: vehicle.motor || "",
          cajasCambios: vehicle.cajacambios || "",
          fechaVencimientoSOAT: fechaFormateada,
        });

        if (vehicle.imageId) {
          setExistingImageId(vehicle.imageId);
          // Get image URL for preview (construct manually)
          const imageUrl = `${endpoint}/storage/buckets/${bucketId}/files/${vehicle.imageId}/view?project=${projectId}`;
          setImageUri(imageUrl);
        }
      } catch (error: any) {
        console.error("Error al cargar vehículo:", error);
        Alert.alert("Error", "No se pudo cargar el vehículo");
        router.back();
      } finally {
        setLoadingData(false);
      }
    };

    loadVehicle();
  }, [id]);

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
    setExistingImageId(null);
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
      newErrors.cajasCambios = "La caja de cambios es requerida";
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
      Alert.alert("Error", "Debes iniciar sesión");
      return;
    }

    if (!id || typeof id !== "string") {
      Alert.alert("Error", "ID de vehículo no válido");
      return;
    }

    // Convert date from DD/MM/YYYY to ISO 8601
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
    let imageId: string | undefined = existingImageId || undefined;

    try {
      // Upload new image if selected and different from existing
      if (imageUri && !imageUri.includes("appwrite")) {
        setUploadingImage(true);
        try {
          // Delete old image if exists
          if (existingImageId) {
            try {
              await storage.deleteFile(bucketId, existingImageId);
            } catch (deleteError) {
              console.error("Error al eliminar imagen anterior:", deleteError);
            }
          }

          const response = await fetch(imageUri);
          const blob = await response.blob();

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
          Alert.alert("Advertencia", "No se pudo actualizar la imagen");
        } finally {
          setUploadingImage(false);
        }
      } else if (!imageUri && existingImageId) {
        // User removed the image
        try {
          await storage.deleteFile(bucketId, existingImageId);
          imageId = undefined;
        } catch (deleteError) {
          console.error("Error al eliminar imagen:", deleteError);
        }
      }

      await databases.updateDocument(databaseId, VEHICULOS_COLLECTION_ID, id, {
        marca: formData.marca.trim(),
        linea: formData.linea.trim(),
        combustible: formData.combustible.trim(),
        modelo: formData.modelo.trim(),
        motor: formData.motor.trim(),
        cajacambios: formData.cajasCambios.trim(),
        fechaVencimientoSoat: fechaISO,
        imageId: imageId || "",
      });

      // Show Snackbar and redirect
      setSnackbarMessage("✓ Vehículo actualizado correctamente");
      setSnackbarVisible(true);

      setTimeout(() => {
        router.push("/(tabs)/four");
      }, 1500);
    } catch (error: any) {
      console.error("Error al actualizar vehículo:", error);
      Alert.alert(
        "Error",
        error.message || "No se pudo actualizar el vehículo"
      );
    } finally {
      setLoading(false);
    }
  };

  // Exponer función globalmente para el header
  useEffect(() => {
    (global as any).handleSaveVehiculo = handleSubmit;

    return () => {
      delete (global as any).handleSaveVehiculo;
    };
  }, [handleSubmit]);

  if (loadingData) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando vehículo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineMedium" style={styles.title}>
          Editar Vehículo
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Modifica la información de tu vehículo
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
              mode="contained"
              onPress={pickImage}
              icon="camera"
              style={styles.imageButton}
              buttonColor={theme.colors.secondary}
              textColor="#FFFFFF"
            >
              Seleccionar Imagen
            </Button>
          )}
        </View>

        <View style={styles.form}>
          <TextInput
            label="Marca *"
            value={formData.marca}
            onChangeText={(text) => {
              setFormData({ ...formData, marca: text });
              setErrors({ ...errors, marca: undefined });
            }}
            mode="outlined"
            error={!!errors.marca}
            style={styles.input}
            textColor="#FFFFFF"
            outlineColor="#8E8E8E"
            activeOutlineColor="#FF3333"
            placeholderTextColor="#9CA3AF"
          />
          <HelperText type="error" visible={!!errors.marca}>
            {errors.marca}
          </HelperText>

          <TextInput
            label="Línea *"
            value={formData.linea}
            onChangeText={(text) => {
              setFormData({ ...formData, linea: text });
              setErrors({ ...errors, linea: undefined });
            }}
            mode="outlined"
            error={!!errors.linea}
            style={styles.input}
            textColor="#FFFFFF"
            outlineColor="#8E8E8E"
            activeOutlineColor="#FF3333"
            placeholderTextColor="#9CA3AF"
          />
          <HelperText type="error" visible={!!errors.linea}>
            {errors.linea}
          </HelperText>

          <TextInput
            label="Combustible *"
            value={formData.combustible}
            onChangeText={(text) => {
              setFormData({ ...formData, combustible: text });
              setErrors({ ...errors, combustible: undefined });
            }}
            mode="outlined"
            error={!!errors.combustible}
            style={styles.input}
            textColor="#FFFFFF"
            outlineColor="#8E8E8E"
            activeOutlineColor="#FF3333"
            placeholderTextColor="#9CA3AF"
          />
          <HelperText type="error" visible={!!errors.combustible}>
            {errors.combustible}
          </HelperText>

          <TextInput
            label="Modelo *"
            value={formData.modelo}
            onChangeText={(text) => {
              setFormData({ ...formData, modelo: text });
              setErrors({ ...errors, modelo: undefined });
            }}
            mode="outlined"
            error={!!errors.modelo}
            style={styles.input}
            textColor="#FFFFFF"
            outlineColor="#8E8E8E"
            activeOutlineColor="#FF3333"
            placeholderTextColor="#9CA3AF"
          />
          <HelperText type="error" visible={!!errors.modelo}>
            {errors.modelo}
          </HelperText>

          <TextInput
            label="Motor *"
            value={formData.motor}
            onChangeText={(text) => {
              setFormData({ ...formData, motor: text });
              setErrors({ ...errors, motor: undefined });
            }}
            mode="outlined"
            error={!!errors.motor}
            style={styles.input}
            textColor="#FFFFFF"
            outlineColor="#8E8E8E"
            activeOutlineColor="#FF3333"
            placeholderTextColor="#9CA3AF"
          />
          <HelperText type="error" visible={!!errors.motor}>
            {errors.motor}
          </HelperText>

          <TextInput
            label="Caja de Cambios *"
            value={formData.cajasCambios}
            onChangeText={(text) => {
              setFormData({ ...formData, cajasCambios: text });
              setErrors({ ...errors, cajasCambios: undefined });
            }}
            mode="outlined"
            error={!!errors.cajasCambios}
            style={styles.input}
            textColor="#FFFFFF"
            outlineColor="#8E8E8E"
            activeOutlineColor="#FF3333"
            placeholderTextColor="#9CA3AF"
          />
          <HelperText type="error" visible={!!errors.cajasCambios}>
            {errors.cajasCambios}
          </HelperText>

          <TextInput
            label="Fecha Vencimiento SOAT (DD/MM/AAAA) *"
            value={formData.fechaVencimientoSOAT}
            onChangeText={(text) => {
              setFormData({ ...formData, fechaVencimientoSOAT: text });
              setErrors({ ...errors, fechaVencimientoSOAT: undefined });
            }}
            mode="outlined"
            error={!!errors.fechaVencimientoSOAT}
            placeholder="DD/MM/AAAA"
            style={styles.input}
            keyboardType="numeric"
            textColor="#FFFFFF"
            outlineColor="#8E8E8E"
            activeOutlineColor="#FF3333"
            placeholderTextColor="#9CA3AF"
          />
          <HelperText type="error" visible={!!errors.fechaVencimientoSOAT}>
            {errors.fechaVencimientoSOAT}
          </HelperText>
        </View>
      </ScrollView>

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
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    color: "#9CA3AF",
    marginBottom: 24,
  },
  imageSection: {
    marginBottom: 24,
  },
  imageSectionTitle: {
    color: "#FFFFFF",
    marginBottom: 12,
  },
  imageButton: {
    borderRadius: 8,
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  form: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#2A2A2A",
    marginBottom: 4,
  },
  snackbar: {
    backgroundColor: "#4CAF50",
  },
});

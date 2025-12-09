import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, View } from "react-native";
import { ID } from "react-native-appwrite";
import {
  Button,
  HelperText,
  IconButton,
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

export default function TabThreeScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
          userId: user.$id,
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

      Alert.alert("Éxito", "Vehículo registrado correctamente", [
        {
          text: "OK",
          onPress: () => {
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
          },
        },
      ]);
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
              buttonColor={theme.colors.secondaryContainer}
              textColor={theme.colors.secondary}
            >
              Seleccionar imagen
            </Button>
          )}
        </View>

        <View style={styles.form}>
          <TextInput
            label="Marca"
            value={formData.marca}
            onChangeText={(text) => {
              setFormData({ ...formData, marca: text });
              if (errors.marca) setErrors({ ...errors, marca: undefined });
            }}
            mode="outlined"
            error={!!errors.marca}
            style={styles.input}
            disabled={loading}
          />
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

          <TextInput
            label="Combustible"
            value={formData.combustible}
            onChangeText={(text) => {
              setFormData({ ...formData, combustible: text });
              if (errors.combustible)
                setErrors({ ...errors, combustible: undefined });
            }}
            mode="outlined"
            error={!!errors.combustible}
            style={styles.input}
            placeholder="Ej: Gasolina, Diesel, Eléctrico"
            disabled={loading}
          />
          {errors.combustible && (
            <HelperText type="error" visible={!!errors.combustible}>
              {errors.combustible}
            </HelperText>
          )}

          <TextInput
            label="Modelo (Año)"
            value={formData.modelo}
            onChangeText={(text) => {
              setFormData({ ...formData, modelo: text });
              if (errors.modelo) setErrors({ ...errors, modelo: undefined });
            }}
            mode="outlined"
            error={!!errors.modelo}
            style={styles.input}
            keyboardType="numeric"
            placeholder="Ej: 2024"
            disabled={loading}
          />
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

          <TextInput
            label="Caja de Cambios"
            value={formData.cajasCambios}
            onChangeText={(text) => {
              setFormData({ ...formData, cajasCambios: text });
              if (errors.cajasCambios)
                setErrors({ ...errors, cajasCambios: undefined });
            }}
            mode="outlined"
            error={!!errors.cajasCambios}
            style={styles.input}
            placeholder="Ej: Manual, Automática, CVT"
            disabled={loading}
          />
          {errors.cajasCambios && (
            <HelperText type="error" visible={!!errors.cajasCambios}>
              {errors.cajasCambios}
            </HelperText>
          )}

          <TextInput
            label="Fecha Vencimiento SOAT"
            value={formData.fechaVencimientoSOAT}
            onChangeText={(text) => {
              setFormData({ ...formData, fechaVencimientoSOAT: text });
              if (errors.fechaVencimientoSOAT)
                setErrors({ ...errors, fechaVencimientoSOAT: undefined });
            }}
            mode="outlined"
            error={!!errors.fechaVencimientoSOAT}
            style={styles.input}
            placeholder="DD/MM/AAAA"
            disabled={loading}
          />
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
        </View>
      </ScrollView>
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
  buttonContent: {
    paddingVertical: 8,
  },
});

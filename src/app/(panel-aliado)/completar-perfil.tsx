import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ID } from "react-native-appwrite";
import { Button, Card, Chip, HelperText, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import Logo from "@/components/Logo";
import { CATEGORIAS_ALIADO } from "@/constants/categorias";
import { useAuth } from "@/context/AuthContext";
import {
  bucketId,
  databaseId,
  databases,
  isAppwriteConfigured,
  Query,
  storage,
} from "@/lib/appwrite";

const PERFIL_ALIADO_COLLECTION_ID = "perfil_aliado";

type PerfilFormData = {
  descripcion: string;
  sitio_web: string;
  logo_url?: string;
  categoria: string[];
};

export default function CompletarPerfilScreen() {
  const router = useRouter();
  const { user, initializing } = useAuth();
  console.log("[COMPLETAR PERFIL] Renderizando pantalla. User:", user);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState<PerfilFormData>({
    descripcion: "",
    sitio_web: "",
    logo_url: undefined,
    categoria: [],
  });
  const [errors, setErrors] = useState<Partial<PerfilFormData>>({});

  // Load existing perfil if available
  useEffect(() => {
    const loadExistingPerfil = async () => {
      if (!isAppwriteConfigured || !user || !user.email) return;

      try {
        // Find aliado
        const aliadoRes = await databases.listDocuments(databaseId, "aliado", [
          Query.equal("correoElectronico", user.email.trim().toLowerCase()),
        ]);
        if (!aliadoRes.documents.length) return;

        const aliadoId = aliadoRes.documents[0].$id;

        // Find existing perfil_aliado
        const perfilRes = await databases.listDocuments(
          databaseId,
          PERFIL_ALIADO_COLLECTION_ID,
          [Query.equal("aliado", aliadoId), Query.equal("activo", true)]
        );

        if (perfilRes.documents.length > 0) {
          const perfil = perfilRes.documents[0];
          setFormData({
            descripcion: perfil.descripcion || "",
            sitio_web: perfil.sitio_web || "",
            logo_url: perfil.logo_url || undefined,
            categoria: perfil.categoria || [],
          });
        }
      } catch (error) {
        console.error("Error loading existing perfil:", error);
      }
    };

    loadExistingPerfil();
  }, [user]);

  // Wait for authentication to initialize
  if (initializing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Don't render anything if no user (redirect will happen via useEffect)
  if (!user) {
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<PerfilFormData> = {};

    // Validar descripción
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción de su negocio es requerida";
    } else if (formData.descripcion.length > 1000) {
      newErrors.descripcion = "La descripción no puede exceder 1000 caracteres";
    }

    // Validar sitio web (opcional)
    if (formData.sitio_web.trim() && !formData.sitio_web.includes(".")) {
      newErrors.sitio_web = "Ingrese una URL válida (ej: www.mitaller.com)";
    }

    // Validar categorías
    if (formData.categoria.length === 0) {
      newErrors.categoria = [
        "Debe seleccionar al menos una categoría" as any,
      ] as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleCategoria = (id: string) => {
    setFormData((prev) => {
      const isSelected = prev.categoria.includes(id);
      const newCategoria = isSelected
        ? prev.categoria.filter((c) => c !== id)
        : [...prev.categoria, id];

      if (errors.categoria) {
        setErrors({ ...errors, categoria: undefined });
      }

      return { ...prev, categoria: newCategoria };
    });
  };

  const pickImage = async () => {
    // Pedir permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permisos requeridos",
        "Se necesitan permisos de cámara para subir el logo"
      );
      return;
    }

    // Seleccionar imagen
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Logo cuadrado
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!isAppwriteConfigured) return;

    setUploadingImage(true);
    try {
      // Crear el objeto File para Appwrite
      const file = {
        name: `logo_${Date.now()}.jpg`,
        type: "image/jpeg",
        uri,
        size: 0, // Appwrite calculará el tamaño
      };

      // Subir a Appwrite Storage
      const response = await storage.createFile(bucketId, ID.unique(), file);

      // Construir URL de la imagen
      const imageUrl = `https://fra.cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${response.$id}/view?project=6910079a00217d16d0ed`;

      setFormData({ ...formData, logo_url: imageUrl });
      Alert.alert("¡Éxito!", "Logo subido correctamente");
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "No se pudo subir el logo. Intente nuevamente.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    console.log("[COMPLETAR PERFIL] handleSubmit llamado");
    if (!validateForm()) {
      Alert.alert("Error", "Por favor corrige los errores en el formulario");
      return;
    }

    if (!isAppwriteConfigured) {
      Alert.alert("Error", "La aplicación no está configurada correctamente");
      return;
    }

    setLoading(true);

    try {
      // Buscar el aliado por el email del usuario logueado
      if (!user || !user.email) {
        throw new Error("No se encontró el usuario actual");
      }
      let aliadoRes = await databases.listDocuments(databaseId, "aliado", [
        Query.equal("correoElectronico", user.email.trim().toLowerCase()),
      ]);
      let aliadoId;
      if (!aliadoRes.documents.length) {
        // Crear documento aliado automáticamente
        const nuevoAliado = await databases.createDocument(
          databaseId,
          "aliado",
          ID.unique(),
          {
            correoElectronico: user.email.trim().toLowerCase(),
            nombreAliado: user.name || "Aliado",
            nombre_Encargado: user.name || "Encargado",
            // Agrega aquí otros campos requeridos por la colección aliado
          }
        );
        aliadoId = nuevoAliado.$id;
      } else {
        aliadoId = aliadoRes.documents[0].$id;
      }

      // Check if perfil_aliado already exists
      const existingPerfilRes = await databases.listDocuments(
        databaseId,
        PERFIL_ALIADO_COLLECTION_ID,
        [Query.equal("aliado", aliadoId), Query.equal("activo", true)]
      );

      const perfilData = {
        aliado: aliadoId,
        descripcion: formData.descripcion.trim(),
        sitio_web: formData.sitio_web.trim() || null,
        logo_url: formData.logo_url || null,
        categoria: formData.categoria,
        activo: true,
      };
      console.log("[COMPLETAR PERFIL] Objeto enviado a Appwrite:", perfilData);

      if (existingPerfilRes.documents.length > 0) {
        // Update existing perfil
        const perfilId = existingPerfilRes.documents[0].$id;
        const updated = await databases.updateDocument(
          databaseId,
          PERFIL_ALIADO_COLLECTION_ID,
          perfilId,
          perfilData
        );
        console.log("[COMPLETAR PERFIL] Documento actualizado:", updated);
      } else {
        // Create new perfil
        await databases.createDocument(
          databaseId,
          PERFIL_ALIADO_COLLECTION_ID,
          ID.unique(),
          perfilData
        );
      }

      console.log("Perfil guardado");
      // Navegación automática
      router.replace("/(panel-aliado)/dashboard");
      // Mostrar confirmación (opcional, no bloqueante)
      setTimeout(() => {
        Alert.alert(
          "¡Perfil Guardado!",
          "Su perfil básico ha sido guardado. Ahora puede agregar sucursales y servicios."
        );
      }, 500);
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "No se pudo guardar el perfil. Intente nuevamente.");
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
            <Text style={styles.title}>Completar Perfil</Text>
            <Text style={styles.subtitle}>
              Configure la información básica de su negocio
            </Text>
          </View>

          {/* Logo Upload */}
          <Card style={styles.logoCard}>
            <Text style={styles.sectionTitle}>Logo del Negocio</Text>
            <View style={styles.logoContainer}>
              {formData.logo_url ? (
                <Image
                  source={{ uri: formData.logo_url }}
                  style={styles.logoPreview}
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoPlaceholderText}>Sin logo</Text>
                </View>
              )}
              <Button
                mode="outlined"
                onPress={pickImage}
                loading={uploadingImage}
                disabled={loading || uploadingImage}
                style={styles.uploadButton}
              >
                {uploadingImage ? "Subiendo..." : "Seleccionar Logo"}
              </Button>
            </View>
          </Card>

          {/* Categorías */}
          <Card style={styles.categoryCard}>
            <Text style={styles.sectionTitle}>Categorías de Negocio *</Text>
            <Text style={styles.sectionSubtitle}>
              Seleccione una o más categorías que describan sus servicios
            </Text>
            <View style={styles.chipContainer}>
              {CATEGORIAS_ALIADO.map((cat) => {
                const isSelected = formData.categoria.includes(cat.id);
                return (
                  <Chip
                    key={cat.id}
                    selected={isSelected}
                    onPress={() => toggleCategoria(cat.id)}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    selectedColor="#FFFFFF"
                    showSelectedOverlay
                  >
                    {cat.name}
                  </Chip>
                );
              })}
            </View>
            {errors.categoria && (
              <HelperText type="error" visible={!!errors.categoria}>
                {errors.categoria[0]}
              </HelperText>
            )}
          </Card>

          {/* Formulario */}
          <View style={styles.form}>
            <TextInput
              label="Descripción del Negocio *"
              value={formData.descripcion}
              onChangeText={(text) => {
                setFormData({ ...formData, descripcion: text });
                if (errors.descripcion) {
                  setErrors({ ...errors, descripcion: undefined });
                }
              }}
              mode="outlined"
              error={!!errors.descripcion}
              style={styles.input}
              disabled={loading}
              multiline
              numberOfLines={4}
              maxLength={1000}
              placeholder="Describa su taller, servicios principales, especialidades..."
            />
            <HelperText type="error" visible={!!errors.descripcion}>
              {errors.descripcion}
            </HelperText>

            <TextInput
              label="Sitio Web (Opcional)"
              value={formData.sitio_web}
              onChangeText={(text) => {
                setFormData({ ...formData, sitio_web: text });
                if (errors.sitio_web) {
                  setErrors({ ...errors, sitio_web: undefined });
                }
              }}
              mode="outlined"
              error={!!errors.sitio_web}
              style={styles.input}
              disabled={loading}
              keyboardType="url"
              autoCapitalize="none"
              placeholder="www.mitaller.com"
            />
            <HelperText type="error" visible={!!errors.sitio_web}>
              {errors.sitio_web}
            </HelperText>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading || uploadingImage}
              style={styles.submitButton}
              contentStyle={styles.buttonContent}
            >
              {(() => {
                console.log(
                  "[COMPLETAR PERFIL] Render botón. loading:",
                  loading,
                  "uploadingImage:",
                  uploadingImage,
                  "disabled:",
                  loading || uploadingImage
                );
                return loading ? "Guardando..." : "Guardar y Continuar";
              })()}
            </Button>

            <Button
              mode="outlined"
              onPress={() => router.replace("/(panel-aliado)/dashboard")}
              disabled={loading}
              style={styles.cancelButton}
              contentStyle={styles.buttonContent}
            >
              Volver
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
    marginBottom: 24,
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
  },
  logoCard: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#333333",
  },
  chipSelected: {
    backgroundColor: "#FF0000",
  },
  logoContainer: {
    alignItems: "center",
    gap: 12,
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#333333",
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#555555",
    borderStyle: "dashed",
  },
  logoPlaceholderText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  uploadButton: {
    borderColor: "#FF0000",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
});

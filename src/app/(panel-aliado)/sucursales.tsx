import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ID } from "react-native-appwrite";
import {
  Button,
  Card,
  Chip,
  HelperText,
  IconButton,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import {
  databaseId,
  databases,
  isAppwriteConfigured,
  Query,
} from "@/lib/appwrite";

const SUCURSALES_COLLECTION_ID = "sucursales_aliado";

type Sucursal = {
  $id?: string;
  nombre: string;
  direccion: [number, number]; // [latitude, longitude] para type point
  telefono: string;
  activa: boolean;
};

type SucursalFormData = {
  nombre: string;
  direccion_texto: string; // Campo temporal para input de texto
  telefono: string;
  activa: boolean;
};

export default function SucursalesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState<SucursalFormData>({
    nombre: "",
    direccion_texto: "",
    telefono: "",
    activa: true,
  });

  const [errors, setErrors] = useState<Partial<SucursalFormData>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSucursales();
    }
  }, [user]);

  const loadSucursales = async () => {
    if (!isAppwriteConfigured || !user?.email) return;

    try {
      // Buscar el $id del aliado por el email del usuario logueado
      const aliadoRes = await databases.listDocuments(databaseId, "aliado", [
        Query.equal("correoElectronico", user.email.trim().toLowerCase()),
      ]);
      if (!aliadoRes.documents.length) {
        setSucursales([]);
        return;
      }
      const aliadoId = aliadoRes.documents[0].$id;
      // Filtrar sucursales por el id del aliado actual
      const response = await databases.listDocuments(
        databaseId,
        SUCURSALES_COLLECTION_ID,
        [Query.equal("aliado", aliadoId)]
      );
      setSucursales(response.documents as Sucursal[]);
    } catch (error) {
      console.error("Error loading sucursales:", error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SucursalFormData> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre de la sucursal es requerido";
    } else if (formData.nombre.length > 255) {
      newErrors.nombre = "El nombre no puede exceder 255 caracteres";
    }

    if (!formData.direccion_texto.trim()) {
      newErrors.direccion_texto = "La dirección es requerida";
    } else if (formData.direccion_texto.length > 200) {
      newErrors.direccion_texto =
        "La dirección no puede exceder 200 caracteres";
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    } else if (formData.telefono.length > 20) {
      newErrors.telefono = "El teléfono no puede exceder 20 caracteres";
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

    setLoading(true);

    try {
      // Buscar el $id del aliado por el email del usuario logueado
      const aliadoRes = await databases.listDocuments(databaseId, "aliado", [
        Query.equal("correoElectronico", user?.email.trim().toLowerCase()),
      ]);
      if (!aliadoRes.documents.length)
        throw new Error("No se encontró el aliado actual");
      const aliadoId = aliadoRes.documents[0].$id;

      // Por ahora usaremos coordenadas por defecto, en el futuro se puede geocodificar la dirección
      const direccionPoint = [4.6097, -74.0817]; // Coordenadas de Bogotá por defecto

      const sucursalData = {
        aliado: aliadoId, // Relationship field
        nombre: formData.nombre.trim(),
        direccion: direccionPoint, // Array [lat, lng] para type point
        telefono: formData.telefono.trim(),
        activa: formData.activa,
      };

      if (editingId) {
        // Editar sucursal existente
        await databases.updateDocument(
          databaseId,
          SUCURSALES_COLLECTION_ID,
          editingId,
          sucursalData
        );
        Alert.alert("¡Éxito!", "Sucursal actualizada correctamente");
      } else {
        // Crear nueva sucursal
        await databases.createDocument(
          databaseId,
          SUCURSALES_COLLECTION_ID,
          ID.unique(),
          sucursalData
        );
        Alert.alert("¡Éxito!", "Sucursal agregada correctamente");
      }

      // Limpiar formulario y recargar lista
      resetForm();
      await loadSucursales();
    } catch (error) {
      console.error("Error saving sucursal:", error);
      Alert.alert(
        "Error",
        "No se pudo guardar la sucursal. Intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      direccion_texto: "",
      telefono: "",
      activa: true,
    });
    setErrors({});
    setShowForm(false);
    setEditingId(null);
  };

  const editSucursal = (sucursal: Sucursal) => {
    // Convertir coordenadas point a texto para edición (por ahora texto genérico)
    const direccionTexto = `Lat: ${sucursal.direccion[0]}, Lng: ${sucursal.direccion[1]}`;

    setFormData({
      nombre: sucursal.nombre,
      direccion_texto: direccionTexto,
      telefono: sucursal.telefono,
      activa: sucursal.activa,
    });
    setEditingId(sucursal.$id || null);
    setShowForm(true);
  };

  const deleteSucursal = (sucursal: Sucursal) => {
    Alert.alert(
      "Confirmar Eliminación",
      `¿Está seguro de eliminar la sucursal "${sucursal.nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            if (sucursal.$id && isAppwriteConfigured) {
              try {
                await databases.deleteDocument(
                  databaseId,
                  SUCURSALES_COLLECTION_ID,
                  sucursal.$id
                );
                Alert.alert("¡Éxito!", "Sucursal eliminada correctamente");
                await loadSucursales();
              } catch (error) {
                console.error("Error deleting sucursal:", error);
                Alert.alert("Error", "No se pudo eliminar la sucursal");
              }
            }
          },
        },
      ]
    );
  };

  const renderSucursal = ({ item }: { item: Sucursal }) => (
    <Card style={styles.sucursalCard}>
      <View style={styles.sucursalHeader}>
        <View style={styles.sucursalInfo}>
          <Text style={styles.sucursalName}>{item.nombre}</Text>
          <View style={styles.chipsContainer}>
            <Chip
              compact
              textStyle={styles.chipText}
              style={item.activa ? styles.activaChip : styles.inactivaChip}
            >
              {item.activa ? "Activa" : "Inactiva"}
            </Chip>
          </View>
        </View>
        <View style={styles.sucursalActions}>
          <IconButton
            icon="pencil"
            iconColor="#FF0000"
            size={20}
            onPress={() => editSucursal(item)}
          />
          <IconButton
            icon="delete"
            iconColor="#FF6B6B"
            size={20}
            onPress={() => deleteSucursal(item)}
          />
        </View>
      </View>
      <Text style={styles.sucursalAddress}>
        Coordenadas: {item.direccion[0].toFixed(4)},{" "}
        {item.direccion[1].toFixed(4)}
      </Text>
      <Text style={styles.sucursalPhone}>{item.telefono}</Text>
    </Card>
  );

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
            <Text style={styles.title}>Sucursales</Text>
            <Text style={styles.subtitle}>
              Administre las ubicaciones de su negocio
            </Text>
          </View>

          {/* Lista de Sucursales */}
          <View style={styles.sucursalesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mis Sucursales</Text>
              <Button
                mode="contained"
                onPress={() => setShowForm(true)}
                style={styles.addButton}
                compact
              >
                Agregar
              </Button>
            </View>

            {sucursales.length > 0 ? (
              <FlatList
                data={sucursales}
                renderItem={renderSucursal}
                keyExtractor={(item) => item.$id || Math.random().toString()}
                style={styles.sucursalesList}
                scrollEnabled={false}
              />
            ) : (
              <Card style={styles.emptySucursales}>
                <Text style={styles.emptyText}>
                  No tiene sucursales registradas aún.{"\n"}
                  Agregue al menos una ubicación para su negocio.
                </Text>
              </Card>
            )}
          </View>

          {/* Formulario de Sucursal */}
          {showForm && (
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingId ? "Editar Sucursal" : "Nueva Sucursal"}
              </Text>

              <TextInput
                label="Nombre de la Sucursal *"
                value={formData.nombre}
                onChangeText={(text) => {
                  setFormData({ ...formData, nombre: text });
                  if (errors.nombre) {
                    setErrors({ ...errors, nombre: undefined });
                  }
                }}
                mode="outlined"
                error={!!errors.nombre}
                style={styles.input}
                disabled={loading}
                maxLength={255}
                placeholder="Ej: Sede Principal, Sucursal Norte"
              />
              <HelperText type="error" visible={!!errors.nombre}>
                {errors.nombre}
              </HelperText>

              <TextInput
                label="Dirección de Referencia *"
                value={formData.direccion_texto}
                onChangeText={(text) => {
                  setFormData({ ...formData, direccion_texto: text });
                  if (errors.direccion_texto) {
                    setErrors({ ...errors, direccion_texto: undefined });
                  }
                }}
                mode="outlined"
                error={!!errors.direccion_texto}
                style={styles.input}
                disabled={loading}
                multiline
                numberOfLines={2}
                maxLength={200}
                placeholder="Calle, número, barrio, ciudad (se usarán coordenadas por defecto)"
              />
              <HelperText type="error" visible={!!errors.direccion_texto}>
                {errors.direccion_texto}
              </HelperText>

              <TextInput
                label="Teléfono *"
                value={formData.telefono}
                onChangeText={(text) => {
                  setFormData({ ...formData, telefono: text });
                  if (errors.telefono) {
                    setErrors({ ...errors, telefono: undefined });
                  }
                }}
                mode="outlined"
                error={!!errors.telefono}
                style={styles.input}
                disabled={loading}
                keyboardType="phone-pad"
                maxLength={20}
                placeholder="Ej: +57 301 234 5678"
              />
              <HelperText type="error" visible={!!errors.telefono}>
                {errors.telefono}
              </HelperText>

              {/* Switch para activa */}
              <View style={styles.switchesContainer}>
                <Button
                  mode={formData.activa ? "contained" : "outlined"}
                  onPress={() =>
                    setFormData({ ...formData, activa: !formData.activa })
                  }
                  style={[
                    styles.switchButton,
                    formData.activa && styles.activaButton,
                  ]}
                  compact
                >
                  Activa
                </Button>
              </View>

              <View style={styles.formButtons}>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={loading}
                  style={styles.saveButton}
                >
                  {loading
                    ? "Guardando..."
                    : editingId
                    ? "Actualizar"
                    : "Guardar"}
                </Button>
                <Button
                  mode="outlined"
                  onPress={resetForm}
                  disabled={loading}
                  style={styles.cancelFormButton}
                >
                  Cancelar
                </Button>
              </View>
            </Card>
          )}

          <View style={styles.navigationButtons}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={styles.backButton}
              contentStyle={styles.buttonContent}
            >
              Atrás
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push("./categorias-servicios")}
              style={styles.nextButton}
              contentStyle={styles.buttonContent}
            >
              Continuar
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
  sucursalesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  addButton: {
    backgroundColor: "#FF0000",
  },
  sucursalesList: {
    maxHeight: 300,
  },
  sucursalCard: {
    backgroundColor: "#1E1E1E",
    marginBottom: 12,
    padding: 16,
  },
  sucursalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  sucursalInfo: {
    flex: 1,
  },
  sucursalName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  chipText: {
    fontSize: 12,
  },
  principalChip: {
    backgroundColor: "#FF0000",
  },
  activaChip: {
    backgroundColor: "#10B981",
  },
  inactivaChip: {
    backgroundColor: "#6B7280",
  },
  sucursalActions: {
    flexDirection: "row",
  },
  sucursalAddress: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  sucursalPhone: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  emptySucursales: {
    backgroundColor: "#1E1E1E",
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  input: {
    marginBottom: 4,
    backgroundColor: "#2A2A2A",
  },
  switchesContainer: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 16,
  },
  switchButton: {
    flex: 1,
    borderColor: "#666666",
  },
  principalButton: {
    backgroundColor: "#FF0000",
  },
  activaButton: {
    backgroundColor: "#10B981",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#FF0000",
  },
  cancelFormButton: {
    flex: 1,
    borderColor: "#666666",
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
    borderColor: "#666666",
  },
  nextButton: {
    flex: 1,
    backgroundColor: "#FF0000",
  },
  buttonContent: {
    height: 48,
  },
});

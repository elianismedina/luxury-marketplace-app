import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { ID } from "react-native-appwrite";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  HelperText,
  IconButton,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "styled-components/native";

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
  direccion: [number, number]; // [latitude, longitude]
  telefono: string;
  activa: boolean;
};

type SucursalFormData = {
  nombre: string;
  direccion_texto: string;
  telefono: string;
  activa: boolean;
};

const BranchIcon = ({ nombre }: { nombre: string }) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.imageCircle,
        {
          backgroundColor: "#2A2A2A",
          borderColor: theme.colors.primary,
          borderWidth: 1,
        },
      ]}
    >
      <Text
        variant="titleLarge"
        style={[styles.placeholderText, { color: theme.colors.primary }]}
      >
        {nombre.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
};

export default function SucursalesScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SucursalFormData>({
    nombre: "",
    direccion_texto: "",
    telefono: "",
    activa: true,
  });
  const [errors, setErrors] = useState<Partial<SucursalFormData>>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const loadSucursales = useCallback(async () => {
    if (!isAppwriteConfigured || !user?.email) {
      setLoading(false);
      return;
    }

    try {
      const aliadoRes = await databases.listDocuments(databaseId, "aliado", [
        Query.equal("correoElectronico", user.email.trim().toLowerCase()),
      ]);
      if (!aliadoRes.documents.length) {
        setSucursales([]);
        return;
      }
      const aliadoId = aliadoRes.documents[0].$id;
      const response = await databases.listDocuments(
        databaseId,
        SUCURSALES_COLLECTION_ID,
        [Query.equal("aliado", aliadoId)]
      );
      setSucursales(response.documents as Sucursal[]);
    } catch (error) {
      console.error("Error loading sucursales:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadSucursales();
  }, [loadSucursales]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSucursales();
  }, [loadSucursales]);

  const validateForm = (): boolean => {
    const newErrors: Partial<SucursalFormData> = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido";
    if (!formData.direccion_texto.trim())
      newErrors.direccion_texto = "La dirección es requerida";
    if (!formData.telefono.trim())
      newErrors.telefono = "El teléfono es requerido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof SucursalFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const aliadoRes = await databases.listDocuments(databaseId, "aliado", [
        Query.equal("correoElectronico", user?.email.trim().toLowerCase()),
      ]);
      const aliadoId = aliadoRes.documents[0].$id;
      const direccionPoint = [4.6097, -74.0817]; // Default

      const sucursalData = {
        aliado: aliadoId,
        nombre: formData.nombre.trim(),
        direccion: direccionPoint,
        telefono: formData.telefono.trim(),
        activa: formData.activa,
      };

      if (editingId) {
        await databases.updateDocument(
          databaseId,
          SUCURSALES_COLLECTION_ID,
          editingId,
          sucursalData
        );
        setSnackbarMessage("✓ Sucursal actualizada correctamente");
      } else {
        await databases.createDocument(
          databaseId,
          SUCURSALES_COLLECTION_ID,
          ID.unique(),
          sucursalData
        );
        setSnackbarMessage("✓ Sucursal agregada correctamente");
      }

      setSnackbarVisible(true);
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadSucursales();
    } catch (error) {
      console.error("Error saving sucursal:", error);
      Alert.alert("Error", "No se pudo guardar la sucursal.");
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
    setEditingId(null);
  };

  const editSucursal = (sucursal: Sucursal) => {
    setFormData({
      nombre: sucursal.nombre,
      direccion_texto: `Coordenadas: ${sucursal.direccion[0]}, ${sucursal.direccion[1]}`,
      telefono: sucursal.telefono,
      activa: sucursal.activa,
    });
    setEditingId(sucursal.$id || null);
    setShowForm(true);
  };

  const deleteSucursal = (id: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar esta sucursal?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await databases.deleteDocument(
                databaseId,
                SUCURSALES_COLLECTION_ID,
                id
              );
              setSnackbarMessage("✓ Sucursal eliminada correctamente");
              setSnackbarVisible(true);
              loadSucursales();
            } catch (error) {
              setSnackbarMessage("Error al eliminar la sucursal");
              setSnackbarVisible(true);
            }
          },
        },
      ]
    );
  };

  const renderSucursal = ({ item }: { item: Sucursal }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BranchIcon nombre={item.nombre} />
            <View style={styles.headerInfo}>
              <Text variant="headlineSmall" style={styles.marca}>
                {item.nombre}
              </Text>
              <Text variant="titleMedium" style={styles.linea}>
                {item.telefono}
              </Text>
            </View>
          </View>
          <Chip
            mode="outlined"
            style={{
              borderColor: item.activa
                ? theme.colors.success || "#10B981"
                : theme.colors.error || "#EF4444",
            }}
            textStyle={{
              color: item.activa
                ? theme.colors.success || "#10B981"
                : theme.colors.error || "#EF4444",
            }}
          >
            {item.activa ? "Activa" : "Inactiva"}
          </Chip>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Ubicación:
            </Text>
            <Text variant="bodyMedium" style={{ flex: 1 }}>
              {item.direccion[0].toFixed(4)}, {item.direccion[1].toFixed(4)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => editSucursal(item)}
            style={styles.actionButton}
            icon="pencil"
          >
            Editar
          </Button>
          <Button
            mode="outlined"
            onPress={() => deleteSucursal(item.$id!)}
            style={[styles.actionButton, { borderColor: theme.colors.error }]}
            textColor={theme.colors.error}
            icon="delete"
          >
            Eliminar
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.topHeader}>
        <IconButton
          icon="arrow-left"
          size={28}
          onPress={() => (showForm ? setShowForm(false) : router.back())}
          iconColor="#FFFFFF"
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          {showForm ? (editingId ? "Editar" : "Nueva Sede") : "Sucursales"}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {showForm ? (
        <View style={styles.formContainer}>
          <View style={styles.titleContainer}>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Administre las ubicaciones de su negocio
            </Text>
          </View>

          <FlatList
            data={[1]}
            keyExtractor={() => "form"}
            renderItem={() => (
              <View style={styles.formContent}>
                <TextInput
                  label="Nombre de la Sucursal *"
                  value={formData.nombre}
                  onChangeText={(v) => handleInputChange("nombre", v)}
                  mode="outlined"
                  error={!!errors.nombre}
                  style={styles.input}
                />
                <HelperText type="error" visible={!!errors.nombre}>
                  {errors.nombre}
                </HelperText>

                <TextInput
                  label="Dirección de Referencia *"
                  value={formData.direccion_texto}
                  onChangeText={(v) => handleInputChange("direccion_texto", v)}
                  mode="outlined"
                  multiline
                  numberOfLines={2}
                  error={!!errors.direccion_texto}
                  style={styles.input}
                />
                <HelperText type="error" visible={!!errors.direccion_texto}>
                  {errors.direccion_texto}
                </HelperText>

                <TextInput
                  label="Teléfono *"
                  value={formData.telefono}
                  onChangeText={(v) => handleInputChange("telefono", v)}
                  mode="outlined"
                  keyboardType="phone-pad"
                  error={!!errors.telefono}
                  style={styles.input}
                />
                <HelperText type="error" visible={!!errors.telefono}>
                  {errors.telefono}
                </HelperText>

                <View style={styles.switchRow}>
                  <Text variant="bodyLarge">¿Sucursal Activa?</Text>
                  <Button
                    mode={formData.activa ? "contained" : "outlined"}
                    onPress={() =>
                      handleInputChange("activa", !formData.activa)
                    }
                    style={{ borderRadius: 20 }}
                  >
                    {formData.activa ? "SÍ" : "NO"}
                  </Button>
                </View>

                <View style={styles.formActions}>
                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={styles.submitButton}
                    buttonColor={theme.colors.primary}
                  >
                    {editingId ? "Guardar Cambios" : "Agregar Sucursal"}
                  </Button>
                  <Button
                    mode="text"
                    onPress={() => setShowForm(false)}
                    disabled={loading}
                    textColor={theme.colors.error}
                  >
                    Cancelar
                  </Button>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          />
        </View>
      ) : (
        <>
          <View style={styles.titleContainer}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  {`${sucursales.length} ${
                    sucursales.length === 1 ? "sede activa" : "sedes activas"
                  }`}
                </Text>
              </View>
              <IconButton
                icon="plus-circle"
                mode="contained"
                containerColor={theme.colors.primary}
                iconColor="#fff"
                size={32}
                onPress={() => {
                  resetForm();
                  setShowForm(true);
                }}
              />
            </View>
          </View>

          {loading && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={sucursales}
              renderItem={renderSucursal}
              keyExtractor={(item) => item.$id!}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <IconButton
                    icon="map-marker-plus"
                    size={64}
                    iconColor={theme.colors.primary}
                    style={{ opacity: 0.5 }}
                  />
                  <Text variant="titleLarge" style={styles.emptyTitle}>
                    Sin sucursales
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    Agrega la ubicación física de tu negocio para que los
                    clientes te encuentren.
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}

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
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    height: 56,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 16,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  imageCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontWeight: "bold",
  },
  headerInfo: {
    flex: 1,
  },
  marca: {
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  linea: {
    opacity: 0.7,
    color: "#FFFFFF",
    fontSize: 14,
  },
  details: {
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  detailRow: {
    flexDirection: "row",
    gap: 8,
  },
  label: {
    fontWeight: "600",
    color: "#9CA3AF",
    minWidth: 90,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: "#FFFFFF",
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
    color: "#FFFFFF",
    paddingHorizontal: 40,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    gap: 4,
  },
  input: {
    backgroundColor: "#1E1E1E",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  formActions: {
    marginTop: 24,
    gap: 12,
  },
  submitButton: {
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    width: "100%",
  },
  snackbar: {
    backgroundColor: "#10B981",
  },
});

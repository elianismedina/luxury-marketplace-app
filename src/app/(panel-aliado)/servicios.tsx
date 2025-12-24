import { useAuth } from "@/context/AuthContext";
import {
  Query,
  databaseId,
  databases,
  isAppwriteConfigured,
} from "@/lib/appwrite";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
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

// Collection IDs
const PERFIL_ALIADO_COLLECTION_ID = "perfil_aliado";
const ALIADO_COLLECTION_ID =
  process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ALIADO_ID ?? "aliado";
const CATEGORIAS_COLLECTION_ID =
  process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_CATEGORIA_ID ?? "categoria";
const SERVICIOS_ALIADO_COLLECTION = "servicios_aliado";

type Categoria = {
  $id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
};

const initialForm = {
  servicioNombre: "",
  descripcion: "",
  precio: "",
  categoria: [] as string[],
  disponibilidad: true,
};

const ServiceIcon = ({ nombre }: { nombre: string }) => {
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

const ServiciosAliadoScreen = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const [servicios, setServicios] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [aliadoId, setAliadoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingServicio, setEditingServicio] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ ...initialForm });
  const [errors, setErrors] = useState<any>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const fetchServicios = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await databases.listDocuments(
        databaseId,
        SERVICIOS_ALIADO_COLLECTION,
        [Query.select(["*", "categoria.*"])]
      );
      setServicios(res.documents || []);
    } catch (e) {
      console.log("Fallo Query.select, intentando carga simple...");
      try {
        const res = await databases.listDocuments(
          databaseId,
          SERVICIOS_ALIADO_COLLECTION
        );
        setServicios(res.documents || []);
      } catch (e2) {
        console.error("Error fatal cargando servicios:", e2);
        setServicios([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const fetchCategorias = useCallback(async () => {
    if (!user || !isAppwriteConfigured) return;

    try {
      const res = await databases.listDocuments(
        databaseId,
        CATEGORIAS_COLLECTION_ID
      );
      const todas = res.documents as Categoria[];
      setCategorias(todas);

      const email = user.email;
      if (!email) return;

      const aliadoRes = await databases.listDocuments(
        databaseId,
        ALIADO_COLLECTION_ID,
        [Query.equal("correoElectronico", email)]
      );

      if (aliadoRes.documents.length > 0) {
        const aId = aliadoRes.documents[0].$id;
        setAliadoId(aId);

        const perfilesRes = await databases.listDocuments(
          databaseId,
          PERFIL_ALIADO_COLLECTION_ID
        );
        const perfil = perfilesRes.documents.find((p: any) =>
          typeof p.aliado === "string"
            ? p.aliado === aId
            : p.aliado?.$id === aId
        );

        if (perfil && perfil.categoria && perfil.categoria.length > 0) {
          const catIds = Array.isArray(perfil.categoria)
            ? perfil.categoria
            : [perfil.categoria];

          if (typeof catIds[0] === "object") {
            setCategorias(catIds);
          } else {
            const filtradas = todas.filter((c) => catIds.includes(c.$id));
            if (filtradas.length > 0) setCategorias(filtradas);
          }
        }
      }
    } catch (error) {
      console.error("Error en fetchCategorias:", error);
    }
  }, [user]);

  React.useEffect(() => {
    fetchServicios();
    fetchCategorias();
  }, [fetchServicios, fetchCategorias]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchServicios();
  }, [fetchServicios]);

  const handleAddServicio = () => {
    setEditingServicio(null);
    setForm({ ...initialForm });
    setErrors({});
    setShowForm(true);
  };

  const handleEditServicio = (servicio: any) => {
    setEditingServicio(servicio);
    setForm({
      servicioNombre: servicio.servicioNombre || "",
      descripcion: servicio.descripcion || "",
      precio: String(servicio.precio ?? ""),
      categoria: Array.isArray(servicio.categoria)
        ? servicio.categoria.map((c: any) =>
            typeof c === "object" ? c.$id : c
          )
        : [],
      disponibilidad:
        typeof servicio.disponibilidad === "boolean"
          ? servicio.disponibilidad
          : true,
    });
    setErrors({});
    setShowForm(true);
  };

  const handleDeleteServicio = async (id: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este servicio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await databases.deleteDocument(
                databaseId,
                SERVICIOS_ALIADO_COLLECTION,
                id
              );
              setSnackbarMessage("✓ Servicio eliminado correctamente");
              setSnackbarVisible(true);
              fetchServicios();
            } catch (e) {
              setSnackbarMessage("Error al eliminar el servicio");
              setSnackbarVisible(true);
            }
          },
        },
      ]
    );
  };

  const handleInputChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!form.servicioNombre?.trim()) {
      newErrors.servicioNombre = "El nombre es obligatorio";
    }
    if (
      !form.precio ||
      isNaN(Number(form.precio)) ||
      Number(form.precio) <= 0
    ) {
      newErrors.precio = "Ingrese un precio válido";
    }
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!aliadoId) {
      Alert.alert("Error", "No se pudo identificar el aliado.");
      return;
    }

    const data = {
      servicioNombre: form.servicioNombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: parseFloat(form.precio),
      categoria: form.categoria,
      disponibilidad: form.disponibilidad,
      aliado: aliadoId,
    };

    try {
      setLoading(true);
      if (editingServicio) {
        await databases.updateDocument(
          databaseId,
          SERVICIOS_ALIADO_COLLECTION,
          editingServicio.$id,
          data
        );
        setSnackbarMessage("✓ Servicio actualizado correctamente");
      } else {
        await databases.createDocument(
          databaseId,
          SERVICIOS_ALIADO_COLLECTION,
          "unique()",
          data
        );
        setSnackbarMessage("✓ Servicio agregado correctamente");
      }
      setSnackbarVisible(true);
      setShowForm(false);
      fetchServicios();
    } catch (e) {
      console.error("Error al guardar servicio:", e);
      Alert.alert("Error", "No se pudo guardar el servicio");
    } finally {
      setLoading(false);
    }
  };

  const renderServicio = ({ item }: { item: any }) => {
    const safeCategorias = (() => {
      if (!item.categoria) return "";
      const cats = Array.isArray(item.categoria)
        ? item.categoria
        : [item.categoria];
      if (cats.length === 0) return "";

      const nombres = cats
        .map((cat: any) => {
          if (typeof cat === "object" && cat !== null && cat.nombre) {
            return cat.nombre;
          }
          if (typeof cat === "string") {
            const found = categorias.find((c: any) => c.$id === cat);
            return found ? found.nombre : "";
          }
          return "";
        })
        .filter((n: string) => n.length > 0);

      return nombres.join(", ");
    })();

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ServiceIcon nombre={item.servicioNombre} />
              <View style={styles.headerInfo}>
                <Text variant="headlineSmall" style={styles.marca}>
                  {item.servicioNombre}
                </Text>
                <Text variant="titleMedium" style={styles.linea}>
                  {safeCategorias || "Sin categoría"}
                </Text>
              </View>
            </View>
            <Chip
              mode="outlined"
              style={{
                borderColor: item.disponibilidad
                  ? theme.colors.success || "#10B981"
                  : theme.colors.error || "#EF4444",
              }}
              textStyle={{
                color: item.disponibilidad
                  ? theme.colors.success || "#10B981"
                  : theme.colors.error || "#EF4444",
              }}
            >
              {item.disponibilidad ? "Disponible" : "Agotado"}
            </Chip>
          </View>

          <View style={styles.details}>
            {item.descripcion ? (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Descripción:
                </Text>
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {item.descripcion}
                </Text>
              </View>
            ) : null}
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Precio:
              </Text>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.primary, fontWeight: "bold" }}
              >
                ${parseFloat(item.precio).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => handleEditServicio(item)}
              style={styles.actionButton}
              icon="pencil"
            >
              Editar
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleDeleteServicio(item.$id)}
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
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header con botón de volver */}
      <View style={styles.topHeader}>
        <IconButton
          icon="arrow-left"
          size={28}
          onPress={() => (showForm ? setShowForm(false) : router.back())}
          iconColor="#FFFFFF"
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          {showForm ? (editingServicio ? "Editar" : "Nuevo") : "Mis Servicios"}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {showForm ? (
        <View style={styles.formContainer}>
          <View style={styles.titleContainer}>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Completa los detalles del servicio
            </Text>
          </View>

          <FlatList
            data={[1]}
            keyExtractor={() => "form"}
            renderItem={() => (
              <View style={styles.formContent}>
                <TextInput
                  label="Nombre del servicio *"
                  value={form.servicioNombre}
                  onChangeText={(v) => handleInputChange("servicioNombre", v)}
                  mode="outlined"
                  error={!!errors.servicioNombre}
                  style={styles.input}
                />
                <HelperText type="error" visible={!!errors.servicioNombre}>
                  {errors.servicioNombre}
                </HelperText>

                <TextInput
                  label="Descripción"
                  value={form.descripcion}
                  onChangeText={(v) => handleInputChange("descripcion", v)}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />

                <TextInput
                  label="Precio *"
                  value={form.precio}
                  onChangeText={(v) => handleInputChange("precio", v)}
                  mode="outlined"
                  keyboardType="numeric"
                  error={!!errors.precio}
                  style={styles.input}
                  left={<TextInput.Affix text="$" />}
                />
                <HelperText type="error" visible={!!errors.precio}>
                  {errors.precio}
                </HelperText>

                <Text style={styles.sectionLabel}>Categorías:</Text>
                <View style={styles.chipContainer}>
                  {categorias.map((cat: any) => (
                    <Chip
                      key={cat.$id}
                      selected={form.categoria.includes(cat.$id)}
                      onPress={() => {
                        const newCats = form.categoria.includes(cat.$id)
                          ? form.categoria.filter((id: any) => id !== cat.$id)
                          : [...form.categoria, cat.$id];
                        handleInputChange("categoria", newCats);
                      }}
                      style={styles.chip}
                      showSelectedCheck
                      mode="outlined"
                    >
                      {cat.nombre}
                    </Chip>
                  ))}
                </View>

                <View style={styles.switchRow}>
                  <Text variant="bodyLarge">¿Está disponible?</Text>
                  <Button
                    mode={form.disponibilidad ? "contained" : "outlined"}
                    onPress={() =>
                      handleInputChange("disponibilidad", !form.disponibilidad)
                    }
                    style={{ borderRadius: 20 }}
                  >
                    {form.disponibilidad ? "SÍ" : "NO"}
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
                    {editingServicio ? "Guardar Cambios" : "Agregar Servicio"}
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
                  {`${servicios.length} ${
                    servicios.length === 1
                      ? "servicio ofrecido"
                      : "servicios ofrecidos"
                  }`}
                </Text>
              </View>
              <IconButton
                icon="plus-circle"
                mode="contained"
                containerColor={theme.colors.primary}
                iconColor="#fff"
                size={32}
                onPress={handleAddServicio}
              />
            </View>
          </View>

          {loading && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={servicios}
              renderItem={renderServicio}
              keyExtractor={(item) => item.$id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <IconButton
                    icon="hand-wash"
                    size={64}
                    iconColor={theme.colors.primary}
                    style={{ opacity: 0.5 }}
                  />
                  <Text variant="titleLarge" style={styles.emptyTitle}>
                    No has agregado servicios
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    Toca el botón + para comenzar a ofrecer tus servicios
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
};

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
  title: {
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
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
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
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
  },
  snackbar: {
    backgroundColor: "#10B981",
  },
});

export default ServiciosAliadoScreen;

import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import {
  ActivityIndicator,
  Card,
  Checkbox,
  Chip,
  Snackbar,
  Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "styled-components/native";

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

type Vehiculo = {
  $id: string;
  marca: string;
  linea: string;
  modelo: string;
  motor: string;
  combustible: string;
  cajacambios: string;
  fechaVencimientoSoat: string;
  imageId?: string;
  $createdAt: string;
};

const VehicleImage = ({
  imageUrl,
  marca,
}: {
  imageUrl: string | null;
  marca: string;
}) => {
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <View
        style={[
          styles.imageCircle,
          {
            backgroundColor: theme.colors.primaryFaded,
            borderColor: theme.colors.primary,
          },
        ]}
      >
        <Text
          variant="titleLarge"
          style={[styles.placeholderText, { color: theme.colors.primary }]}
        >
          {marca.charAt(0)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.imageCircle}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.circleImage}
        resizeMode="cover"
        onError={() => {
          setImageError(true);
        }}
      />
    </View>
  );
};

export default function TabFourScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedVehiculos, setSelectedVehiculos] = useState<Set<string>>(
    new Set()
  );
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const loadVehiculos = useCallback(async () => {
    if (!isAppwriteConfigured || !user) {
      setLoading(false);
      return;
    }

    try {
      const response = await databases.listDocuments(
        databaseId,
        VEHICULOS_COLLECTION_ID,
        [Query.equal("userId", user.$id), Query.orderDesc("$createdAt")]
      );
      setVehiculos(response.documents as unknown as Vehiculo[]);
    } catch (error) {
      console.error("Error al cargar vehículos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadVehiculos();
  }, [loadVehiculos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadVehiculos();
  }, [loadVehiculos]);

  const getImageUrl = (imageId?: string) => {
    if (!imageId || !bucketId || !endpoint || !projectId) {
      return null;
    }
    // Construir URL manualmente: endpoint/storage/buckets/[BUCKET_ID]/files/[FILE_ID]/view?project=[PROJECT_ID]
    const url = `${endpoint}/storage/buckets/${bucketId}/files/${imageId}/view?project=${projectId}`;
    return url;
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedVehiculos);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedVehiculos(newSelected);
  };

  const handleDelete = useCallback(async () => {
    if (selectedVehiculos.size === 0) {
      Alert.alert("Error", "No hay vehículos seleccionados");
      return;
    }

    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro de eliminar ${selectedVehiculos.size} vehículo(s)?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              // Eliminar cada vehículo seleccionado
              for (const vehiculoId of selectedVehiculos) {
                const vehiculo = vehiculos.find((v) => v.$id === vehiculoId);

                // Eliminar imagen si existe
                if (vehiculo?.imageId) {
                  try {
                    await storage.deleteFile(bucketId, vehiculo.imageId);
                  } catch (error) {
                    console.error("Error al eliminar imagen:", error);
                  }
                }

                // Eliminar documento
                await databases.deleteDocument(
                  databaseId,
                  VEHICULOS_COLLECTION_ID,
                  vehiculoId
                );
              }

              setSnackbarMessage(
                `✓ ${selectedVehiculos.size} vehículo(s) eliminado(s)`
              );
              setSnackbarVisible(true);
              setSelectedVehiculos(new Set());
              setSelectionMode(false);
              await loadVehiculos();
            } catch (error) {
              console.error("Error al eliminar:", error);
              Alert.alert("Error", "No se pudieron eliminar los vehículos");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [selectedVehiculos, vehiculos, loadVehiculos]);

  const handleEdit = useCallback(() => {
    if (selectedVehiculos.size === 0) {
      Alert.alert("Error", "No hay vehículos seleccionados");
      return;
    }

    if (selectedVehiculos.size > 1) {
      Alert.alert("Error", "Solo puedes editar un vehículo a la vez");
      return;
    }

    const vehiculoId = Array.from(selectedVehiculos)[0];
    setSelectedVehiculos(new Set());
    setSelectionMode(false);
    router.push(`/edit-vehicle?id=${vehiculoId}`);
  }, [selectedVehiculos, router]);

  // Exponer funciones globalmente para que el navbar pueda acceder
  useEffect(() => {
    (global as any).handleDeleteVehiculos = handleDelete;
    (global as any).handleEditVehiculo = handleEdit;
    (global as any).selectionMode = selectionMode;

    return () => {
      delete (global as any).handleDeleteVehiculos;
      delete (global as any).handleEditVehiculo;
      delete (global as any).selectionMode;
    };
  }, [handleDelete, handleEdit, selectionMode]);

  const renderVehiculo = ({ item }: { item: Vehiculo }) => {
    const imageUrl = getImageUrl(item.imageId);
    const isSelected = selectedVehiculos.has(item.$id);

    return (
      <TouchableOpacity
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleSelection(item.$id);
          }
        }}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(item.$id);
          }
        }}
        activeOpacity={0.7}
      >
        <Card style={[styles.card, isSelected && styles.selectedCard]}>
          <Card.Content>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {selectionMode && (
                  <Checkbox.Android
                    status={isSelected ? "checked" : "unchecked"}
                    onPress={() => toggleSelection(item.$id)}
                    color={theme.colors.primary}
                  />
                )}
                <VehicleImage imageUrl={imageUrl} marca={item.marca} />
                <View style={styles.headerInfo}>
                  <Text variant="headlineSmall" style={styles.marca}>
                    {item.marca}
                  </Text>
                  <Text variant="titleMedium" style={styles.linea}>
                    {item.linea}
                  </Text>
                </View>
              </View>
              <Chip
                mode="outlined"
                style={{ borderColor: theme.colors.secondary }}
                textStyle={{ color: theme.colors.secondary }}
              >
                {item.modelo}
              </Chip>
            </View>
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Motor:
                </Text>
                <Text variant="bodyMedium">{item.motor}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Combustible:
                </Text>
                <Text variant="bodyMedium">{item.combustible}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Transmisión:
                </Text>
                <Text variant="bodyMedium">{item.cajacambios}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const theme = useTheme();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Cargando vehículos...
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="headlineSmall">
          Inicia sesión para ver tus vehículos
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.titleContainer}>
        <Text variant="headlineMedium" style={styles.title}>
          Mi Garaje
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {vehiculos.length}{" "}
          {vehiculos.length === 1
            ? "vehículo registrado"
            : "vehículos registrados"}
        </Text>
      </View>
      <FlatList
        data={vehiculos}
        renderItem={renderVehiculo}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="titleLarge" style={styles.emptyTitle}>
              No hay vehículos registrados
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Agrega tu primer vehículo desde la pestaña "Añadir"
            </Text>
          </View>
        }
      />
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  titleContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  loadingText: {
    marginTop: 16,
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  selectedCard: {
    borderColor: "#FF0000",
    borderWidth: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  imageCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
  },
  circleImage: {
    width: 60,
    height: 60,
  },
  placeholderCircle: {
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#666",
    fontWeight: "bold",
  },
  headerInfo: {
    flex: 1,
  },
  marca: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  linea: {
    opacity: 0.7,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    gap: 8,
  },
  label: {
    fontWeight: "600",
    minWidth: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
  },
  snackbar: {
    backgroundColor: "#10B981",
  },
});

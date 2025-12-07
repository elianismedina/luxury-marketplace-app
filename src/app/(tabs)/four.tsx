import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { ActivityIndicator, Card, Chip, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import {
  bucketId,
  databaseId,
  databases,
  endpoint,
  isAppwriteConfigured,
  projectId,
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
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <View style={[styles.imageCircle, styles.placeholderCircle]}>
        <Text variant="titleLarge" style={styles.placeholderText}>
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
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const renderVehiculo = ({ item }: { item: Vehiculo }) => {
    const imageUrl = getImageUrl(item.imageId);

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
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
            <Chip mode="outlined">{item.modelo}</Chip>
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
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    backgroundColor: "#e0e0e0",
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
});

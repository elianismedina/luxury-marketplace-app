import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { Button, Card, Chip, Searchbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import Logo from "@/components/Logo";
import { CATEGORIAS_ALIADO } from "@/constants/categorias";
import { useAuth } from "@/context/AuthContext";
import {
  databaseId,
  databases,
  ID,
  isAppwriteConfigured,
  Query,
} from "@/lib/appwrite";

const PERFIL_ALIADO_COLLECTION_ID = "perfil_aliado";

import { categoriesCollectionId } from "@/lib/appwrite";

export default function CategoriasServiciosScreen() {
  const { user, initializing, refresh } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<
    string[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  const categoriasFiltradas = CATEGORIAS_ALIADO.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Seed all 15 categories in Appwrite 'categoria' collection if missing
  useEffect(() => {
    async function seedCategoriasIfNeeded() {
      if (!isAppwriteConfigured) return;
      try {
        // Get all categories from DB
        const res = await databases.listDocuments(
          databaseId,
          categoriesCollectionId,
          [Query.limit(100)]
        );
        const dbCats = res.documents || [];
        for (const cat of CATEGORIAS_ALIADO) {
          const exists = dbCats.some(
            (dbCat) => dbCat.$id === cat.id || dbCat.nombre === cat.name
          );
          if (!exists) {
            await databases.createDocument(
              databaseId,
              categoriesCollectionId,
              cat.id, // Use constant id as $id
              {
                nombre: cat.name,
                icon: cat.icon,
              }
            );
          }
        }
      } catch (e) {
        // Ignore errors (e.g., permissions)
        console.warn(
          "No se pudo sincronizar categorías en Appwrite:",
          e?.message || e
        );
      }
    }
    seedCategoriasIfNeeded();
  }, []);

  useEffect(() => {
    if (!user || !user.email) {
      refresh && refresh();
      return;
    }
    loadCategoriasSeleccionadas();
  }, [user]);

  if (initializing || !user || !user.email) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#121212",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18 }}>Cargando usuario...</Text>
      </SafeAreaView>
    );
  }

  // Helper handling accents
  const normalizeString = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  async function loadCategoriasSeleccionadas() {
    try {
      const email = user?.email;
      if (!email) return;

      const searchEmail = email.trim().toLowerCase();

      const aliadoQuery = await databases.listDocuments(
        databaseId,
        process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ALIADO_ID ?? "aliado",
        [Query.equal("correoElectronico", searchEmail)]
      );

      if (!aliadoQuery.documents.length) return;

      const aliadoId = aliadoQuery.documents[0].$id;

      const perfilQuery = await databases.listDocuments(
        databaseId,
        PERFIL_ALIADO_COLLECTION_ID,
        [Query.equal("aliado", aliadoId)]
      );

      if (perfilQuery.documents.length > 0) {
        const perfil = perfilQuery.documents[0];
        // Assume perfil.categoria is an array of category IDs (from CATEGORIAS_ALIADO)
        const catIds = Array.isArray(perfil.categoria)
          ? perfil.categoria
          : perfil.categoria
          ? [perfil.categoria]
          : [];
        setCategoriasSeleccionadas(catIds);
      }
    } catch (error) {
      console.error("Error loading selected categorias:", error);
    }
  }

  function toggleCategoria(localId: string) {
    setCategoriasSeleccionadas((prev) =>
      prev.includes(localId)
        ? prev.filter((id) => id !== localId)
        : [...prev, localId]
    );
  }

  async function handleSubmit() {
    if (categoriasSeleccionadas.length === 0) {
      Alert.alert(
        "Seleccione Categorías",
        "Debe seleccionar al menos una categoría de servicios que ofrece."
      );
      return;
    }

    if (!isAppwriteConfigured) {
      Alert.alert("Error", "La aplicación no está configurada correctamente");
      return;
    }

    setLoading(true);
    try {
      const email = user?.email;
      if (!email) throw new Error("No se encontró el email del usuario");

      const searchEmail = email.trim().toLowerCase();
      const aliadoQuery = await databases.listDocuments(
        databaseId,
        process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ALIADO_ID ?? "aliado",
        [Query.equal("correoElectronico", searchEmail)]
      );

      if (!aliadoQuery.documents.length)
        throw new Error("No se encontró el aliado para este usuario");

      const aliadoId = aliadoQuery.documents[0].$id;

      const perfilQuery = await databases.listDocuments(
        databaseId,
        PERFIL_ALIADO_COLLECTION_ID,
        [Query.equal("aliado", aliadoId)]
      );

      const perfilData = {
        aliado: aliadoId,
        categoria: categoriasSeleccionadas, // Save selected category IDs directly
        descripcion: perfilQuery.documents[0]?.descripcion || "",
        activo: true,
      };

      if (!perfilQuery.documents.length) {
        // Create new
        await databases.createDocument(
          databaseId,
          PERFIL_ALIADO_COLLECTION_ID,
          ID.unique(),
          perfilData
        );
      } else {
        // Update existing
        const perfilAliadoId = perfilQuery.documents[0].$id;
        await databases.updateDocument(
          databaseId,
          PERFIL_ALIADO_COLLECTION_ID,
          perfilAliadoId,
          perfilData
        );
      }

      Alert.alert(
        "¡Perfil Actualizado!",
        `Ha seleccionado ${categoriasSeleccionadas.length} categoría(s) de servicios.`,
        [
          {
            text: "Ir al Dashboard",
            onPress: () => router.replace("/(panel-aliado)/dashboard"),
          },
        ]
      );
    } catch (error) {
      console.error("Error updating categorias:", error);
      Alert.alert(
        "Error",
        "No se pudieron guardar las categorías. Intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  const renderCategoria = ({
    item,
  }: {
    item: (typeof CATEGORIAS_ALIADO)[0];
  }) => {
    const selected = categoriasSeleccionadas.includes(item.id);

    return (
      <Card
        style={[styles.categoriaCard, selected && styles.categoriaSelected]}
        onPress={() => toggleCategoria(item.id)}
      >
        <View style={styles.categoriaContent}>
          <View style={styles.categoriaInfo}>
            {item.icon ? (
              <MaterialCommunityIcons
                name={item.icon as any}
                size={22}
                color={selected ? "#FF0000" : "#9CA3AF"}
                style={styles.categoriaIcon}
              />
            ) : null}
            <View style={styles.categoriaTexts}>
              <Text
                style={[
                  styles.categoriaNombre,
                  selected && styles.categoriaSelectedText,
                ]}
              >
                {item.name}
              </Text>
            </View>
          </View>
          {selected ? <Text style={styles.categoriaCheck}>✓</Text> : null}
        </View>
      </Card>
    );
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
            <Text style={styles.title}>Categorías de Servicios</Text>
            <Text style={styles.subtitle}>
              Seleccione los tipos de servicios que ofrece su negocio
            </Text>
          </View>

          {/* Resumen de selección */}
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              Categorías Seleccionadas: {categoriasSeleccionadas.length}
            </Text>
            {categoriasSeleccionadas.length > 0 && (
              <View style={styles.selectedChips}>
                {categoriasSeleccionadas.map((id) => {
                  const categoria = CATEGORIAS_ALIADO.find((c) => c.id === id);
                  return (
                    <Chip
                      key={id}
                      onClose={() => toggleCategoria(id)}
                      style={styles.selectedChip}
                      textStyle={styles.selectedChipText}
                    >
                      {categoria?.name || id}
                    </Chip>
                  );
                })}
              </View>
            )}
          </Card>

          {/* Buscador */}
          <Searchbar
            placeholder="Buscar categorías..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            iconColor="#9CA3AF"
          />

          {/* Lista de Categorías */}
          <View style={styles.categoriasSection}>
            <Text style={styles.sectionTitle}>
              Disponibles ({categoriasFiltradas.length})
            </Text>

            {categoriasFiltradas.length > 0 ? (
              <FlatList
                data={categoriasFiltradas}
                renderItem={renderCategoria}
                keyExtractor={(item) => item.id}
                style={styles.categoriasList}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? `No se encontraron categorías que coincidan con "${searchQuery}"`
                    : "No hay categorías disponibles"}
                </Text>
              </Card>
            )}
          </View>

          {/* Botones de navegación */}
          <View style={styles.navigationButtons}>
            <Button
              mode="outlined"
              onPress={() => router.replace("/(panel-aliado)/dashboard")}
              disabled={loading}
              style={styles.backButton}
              contentStyle={styles.buttonContent}
            >
              Atrás
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading || categoriasSeleccionadas.length === 0}
              style={[
                styles.submitButton,
                categoriasSeleccionadas.length === 0 &&
                  styles.submitButtonDisabled,
              ]}
              contentStyle={styles.buttonContent}
            >
              {loading ? "Guardando..." : "Guardar Categorías"}
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
  categoriaCard: {
    backgroundColor: "#232323",
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#232323",
  },
  categoriaSelected: {
    borderColor: "#FF0000",
    backgroundColor: "#2A1A1A",
  },
  categoriaContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoriaInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  categoriaIcon: {
    marginRight: 12,
  },
  categoriaTexts: {
    flex: 1,
  },
  categoriaNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  categoriaSelectedText: {
    color: "#FF0000",
  },
  categoriaDescripcion: {
    fontSize: 14,
    color: "#9CA3AF",
    lineHeight: 18,
  },
  categoriaSelectedDescripcion: {
    color: "#FFAAAA",
  },
  categoriaCheck: {
    marginLeft: 12,
    fontSize: 18,
    color: "#FF0000",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#1E1E1E",
    marginBottom: 20,
    padding: 16,
    borderRadius: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 8,
  },
  selectedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  selectedChip: {
    backgroundColor: "#FF0000",
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChipText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  searchbar: {
    marginBottom: 16,
    backgroundColor: "#232323",
    borderRadius: 8,
  },
  searchInput: {
    color: "#FFF",
  },
  categoriasSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 8,
  },
  categoriasList: {
    marginBottom: 0,
  },
  emptyCard: {
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
  navigationButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  backButton: {
    flex: 1,
    borderColor: "#666666",
  },
  submitButton: {
    flex: 2,
    backgroundColor: "#FF0000",
  },
  submitButtonDisabled: {
    backgroundColor: "#666666",
  },
  buttonContent: {
    height: 48,
  },
});

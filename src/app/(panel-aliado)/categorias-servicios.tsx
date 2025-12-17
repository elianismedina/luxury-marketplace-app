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
import { useAuth } from "@/context/AuthContext";
import {
  databaseId,
  databases,
  ID,
  isAppwriteConfigured,
  Query,
} from "@/lib/appwrite";

// --- StyleSheet (after component) ---
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
    fontSize: 22,
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
  infoCard: {
    backgroundColor: "#1A2B1A",
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#9CA3AF",
    lineHeight: 20,
  },
});
// Usa el ID de la colección desde la variable de entorno o fallback a "categoria"
const CATEGORIAS_COLLECTION_ID =
  process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_CATEGORIA_ID ?? "categoria";
const PERFIL_ALIADO_COLLECTION_ID = "perfil_aliado";

type Categoria = {
  $id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
};

export default function CategoriasServiciosScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<
    string[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  const categoriasFiltradas = categorias.filter((cat) =>
    cat.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadCategorias();
    loadCategoriasSeleccionadas();
  }, []);

  async function loadCategorias() {
    if (!isAppwriteConfigured) return;
    try {
      const response = await databases.listDocuments(
        databaseId,
        CATEGORIAS_COLLECTION_ID
      );
      setCategorias(response.documents as Categoria[]);
    } catch (error) {
      console.error("Error loading categorias:", error);
      Alert.alert("Error", "No se pudieron cargar las categorías de servicios");
    }
  }

  async function loadCategoriasSeleccionadas() {
    if (!isAppwriteConfigured) return;
    try {
      const email = user?.email;
      if (!email) return;
      const aliadoQuery = await databases.listDocuments(
        databaseId,
        process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ALIADO_ID ?? "aliado",
        [Query.equal("correoElectronico", email)]
      );
      if (!aliadoQuery.documents.length) return;
      const aliadoId = aliadoQuery.documents[0].$id;
      const perfilQuery = await databases.listDocuments(
        databaseId,
        PERFIL_ALIADO_COLLECTION_ID,
        [Query.equal("aliado", aliadoId)]
      );
      if (perfilQuery.documents.length) {
        const perfilAliado = perfilQuery.documents[0];
        setCategoriasSeleccionadas(perfilAliado.categoria || []);
      } else {
        setCategoriasSeleccionadas([]);
      }
    } catch (error) {
      console.error("Error loading selected categorias:", error);
    }
  }

  function toggleCategoria(categoriaId: string) {
    setCategoriasSeleccionadas((prev) =>
      prev.includes(categoriaId)
        ? prev.filter((id) => id !== categoriaId)
        : [...prev, categoriaId]
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
      const aliadoQuery = await databases.listDocuments(
        databaseId,
        process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ALIADO_ID ?? "aliado",
        [Query.equal("correoElectronico", email)]
      );
      if (!aliadoQuery.documents.length)
        throw new Error("No se encontró el aliado para este usuario");
      const aliadoId = aliadoQuery.documents[0].$id;
      let perfilQuery = await databases.listDocuments(
        databaseId,
        PERFIL_ALIADO_COLLECTION_ID,
        [Query.equal("aliado", aliadoId)]
      );
      if (!perfilQuery.documents.length) {
        await databases.createDocument(
          databaseId,
          PERFIL_ALIADO_COLLECTION_ID,
          ID.unique(),
          {
            aliado: aliadoId,
            categoria: categoriasSeleccionadas,
            descripcion: "",
          }
        );
        Alert.alert(
          "¡Perfil Completado!",
          `Ha seleccionado ${categoriasSeleccionadas.length} categoría(s) de servicios. Su perfil está listo para ser revisado por nuestro equipo.`,
          [
            {
              text: "Ir al Dashboard",
              onPress: () => router.replace("./dashboard"),
            },
          ]
        );
        setLoading(false);
        return;
      } else {
        const perfilAliadoId = perfilQuery.documents[0].$id;
        await databases.updateDocument(
          databaseId,
          PERFIL_ALIADO_COLLECTION_ID,
          perfilAliadoId,
          {
            categoria: categoriasSeleccionadas,
            descripcion: "",
          }
        );
        Alert.alert(
          "¡Perfil Completado!",
          `Ha seleccionado ${categoriasSeleccionadas.length} categoría(s) de servicios. Su perfil está listo para ser revisado por nuestro equipo.`,
          [
            {
              text: "Ir al Dashboard",
              onPress: () => router.replace("./dashboard"),
            },
          ]
        );
        setLoading(false);
      }
    } catch (error) {
      console.error("Error updating categorias:", error);
      Alert.alert(
        "Error",
        "No se pudieron guardar las categorías. Intente nuevamente."
      );
      setLoading(false);
    }
  }

  const renderCategoria = ({ item }: { item: Categoria }) => {
    const selected = categoriasSeleccionadas.includes(item.$id);
    return (
      <Card
        style={[styles.categoriaCard, selected && styles.categoriaSelected]}
        onPress={() => toggleCategoria(item.$id)}
      >
        <View style={styles.categoriaContent}>
          <View style={styles.categoriaInfo}>
            {item.icono ? (
              <Text style={styles.categoriaIcon}>{item.icono}</Text>
            ) : null}
            <View style={styles.categoriaTexts}>
              <Text
                style={[
                  styles.categoriaNombre,
                  selected && styles.categoriaSelectedText,
                ]}
              >
                {item.nombre}
              </Text>
              {item.descripcion ? (
                <Text
                  style={[
                    styles.categoriaDescripcion,
                    selected && styles.categoriaSelectedDescripcion,
                  ]}
                >
                  {item.descripcion}
                </Text>
              ) : null}
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
                  const categoria = categorias.find((c) => c.$id === id);
                  return (
                    <Chip
                      key={id}
                      onClose={() => toggleCategoria(id)}
                      style={styles.selectedChip}
                      textStyle={styles.selectedChipText}
                    >
                      {categoria?.nombre || "Categoría"}
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
                keyExtractor={(item) => item.$id}
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
              onPress={() => router.back()}
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
              {loading ? "Guardando..." : "Completar Perfil"}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

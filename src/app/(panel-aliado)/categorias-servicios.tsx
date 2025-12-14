import { MaterialIcons } from "@expo/vector-icons";
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
import { databaseId, databases, isAppwriteConfigured } from "@/lib/appwrite";

// TODO: Cambiar por el ID real de la colección de categorías
const CATEGORIAS_COLLECTION_ID = "categorias_servicios";
const PERFIL_ALIADO_COLLECTION_ID = "perfil_aliado";

type Categoria = {
  $id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
};

export default function CategoriasServiciosScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<
    string[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCategorias();
    loadCategoriasSeleccionadas();
  }, []);

  const loadCategorias = async () => {
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
  };

  const loadCategoriasSeleccionadas = async () => {
    if (!isAppwriteConfigured) return;

    try {
      // TODO: Obtener las categorías ya seleccionadas por este aliado
      // const perfilAliado = await databases.getDocument(databaseId, PERFIL_ALIADO_COLLECTION_ID, perfilId);
      // setCategoriasSeleccionadas(perfilAliado.categoria || []);

      // Por ahora, array vacío
      setCategoriasSeleccionadas([]);
    } catch (error) {
      console.error("Error loading selected categorias:", error);
    }
  };

  const toggleCategoria = (categoriaId: string) => {
    setCategoriasSeleccionadas((prev) => {
      if (prev.includes(categoriaId)) {
        // Remover categoría
        return prev.filter((id) => id !== categoriaId);
      } else {
        // Agregar categoría
        return [...prev, categoriaId];
      }
    });
  };

  const handleSubmit = async () => {
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
      // TODO: Actualizar el perfil del aliado con las categorías seleccionadas
      const perfilAliadoId = "temp_perfil_aliado_id";

      await databases.updateDocument(
        databaseId,
        PERFIL_ALIADO_COLLECTION_ID,
        perfilAliadoId,
        {
          categoria: categoriasSeleccionadas, // Array de IDs de relaciones many-to-many
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
    } catch (error) {
      console.error("Error updating categorias:", error);
      Alert.alert(
        "Error",
        "No se pudieron guardar las categorías. Intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Filtrar categorías por búsqueda
  const categoriasFiltradas = categorias.filter(
    (categoria) =>
      categoria.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (categoria.descripcion &&
        categoria.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderCategoria = ({ item }: { item: Categoria }) => {
    const isSelected = categoriasSeleccionadas.includes(item.$id);

    return (
      <Card
        style={[styles.categoriaCard, isSelected && styles.categoriaSelected]}
        onPress={() => toggleCategoria(item.$id)}
      >
        <View style={styles.categoriaContent}>
          <View style={styles.categoriaInfo}>
            {item.icono && (
              <Text style={styles.categoriaIcon}>{item.icono}</Text>
            )}
            <View style={styles.categoriaTexts}>
              <Text
                style={[
                  styles.categoriaNombre,
                  isSelected && styles.categoriaSelectedText,
                ]}
              >
                {item.nombre}
              </Text>
              {item.descripcion && (
                <Text
                  style={[
                    styles.categoriaDescripcion,
                    isSelected && styles.categoriaSelectedDescripcion,
                  ]}
                >
                  {item.descripcion}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.categoriaCheck}>
            <MaterialIcons
              name={isSelected ? "check-circle" : "radio-button-unchecked"}
              size={24}
              color={isSelected ? "#FF0000" : "#666666"}
            />
          </View>
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

          {/* Información adicional */}
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 Recomendaciones</Text>
            <Text style={styles.infoText}>
              • Seleccione todas las categorías en las que realmente ofrece
              servicios{"\n"}• Puede modificar estas categorías más adelante
              desde su perfil{"\n"}• Los clientes podrán encontrarlo buscando
              por estas categorías
            </Text>
          </Card>
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
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: "#1E1E1E",
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  selectedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedChip: {
    backgroundColor: "#FF0000",
  },
  selectedChipText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  searchbar: {
    backgroundColor: "#1E1E1E",
    marginBottom: 16,
  },
  searchInput: {
    color: "#FFFFFF",
  },
  categoriasSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  categoriasList: {
    maxHeight: 400,
  },
  categoriaCard: {
    backgroundColor: "#1E1E1E",
    marginBottom: 8,
    elevation: 2,
  },
  categoriaSelected: {
    backgroundColor: "#2A1A1A",
    borderWidth: 1,
    borderColor: "#FF0000",
  },
  categoriaContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  categoriaInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  categoriaIcon: {
    fontSize: 32,
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

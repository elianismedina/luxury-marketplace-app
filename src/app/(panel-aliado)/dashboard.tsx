import Logo from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";
import { useAuth } from "@/context/AuthContext";
import {
  databaseId,
  databases,
  isAppwriteConfigured,
  Query,
} from "@/lib/appwrite";
import { useClerk } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Card, IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

interface GridItemProps {
  title: string;
  icon: string;
  onPress: () => void;
  color?: string;
}

const GridItem = ({
  title,
  icon,
  onPress,
  color = "#FF0000",
}: GridItemProps) => (
  <TouchableOpacity
    style={styles.gridItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
      <IconButton icon={icon} iconColor={color} size={32} />
    </View>
    <Text style={styles.gridItemTitle}>{title}</Text>
  </TouchableOpacity>
);

export default function AliadoDashboardScreen() {
  const router = useRouter();
  const { logout, loading: authLoading, user, initializing } = useAuth();
  const { signOut } = useClerk();

  const [hasPerfil, setHasPerfil] = useState(false);
  const [hasSucursales, setHasSucursales] = useState(false);
  const [hasServicios, setHasServicios] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tienePasswordTemporal, setTienePasswordTemporal] = useState(true);

  // Redirect to welcome if no user (after initialization)
  useEffect(() => {
    if (!initializing && !user) {
      router.replace("/(auth)/welcome");
    }
  }, [initializing, user, router]);

  // Handle back button press (only if user exists)
  useEffect(() => {
    if (!user) return;

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.replace("/");
        return true;
      }
    );

    return () => backHandler.remove();
  }, [router, user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user && !initializing) {
        checkPerfilEstado();
      }
    }, [user, initializing])
  );

  useEffect(() => {
    if (user && !initializing) {
      checkPerfilEstado();
    }
  }, [user, initializing]);

  if (initializing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) return null;

  // (Debug eliminado)
  const checkPerfilEstado = async () => {
    if (!isAppwriteConfigured || !user || !user.email) {
      setHasPerfil(false);
      setHasSucursales(false);
      setHasServicios(false);
      setLoading(false);
      return;
    }
    try {
      const aliadoRes = await databases.listDocuments(databaseId, "aliado", [
        Query.equal("correoElectronico", user.email.trim().toLowerCase()),
      ]);
      if (!aliadoRes.documents.length) {
        setHasPerfil(false);
        setHasSucursales(false);
        setHasServicios(false);
        setLoading(false);
        return;
      }
      const aliadoId = aliadoRes.documents[0].$id;

      const perfilRes = await databases.listDocuments(
        databaseId,
        "perfil_aliado",
        [Query.equal("aliado", aliadoId), Query.equal("activo", true)]
      );

      let perfilDoc =
        perfilRes.documents.length > 0 ? perfilRes.documents[0] : null;

      const sucursalRes = await databases.listDocuments(
        databaseId,
        "sucursales_aliado",
        [Query.equal("aliado", aliadoId)]
      );

      const hasPerfil = perfilRes.documents.length > 0;
      const hasSucursales = sucursalRes.documents.length > 0;

      // Normalizar categoria: puede ser array, string, objeto o undefined
      let categoria = perfilDoc?.categoria;
      // (Debug log eliminado)
      let categoriaCount = 0;
      if (Array.isArray(categoria)) {
        categoriaCount = categoria.length;
      } else if (categoria) {
        // Puede ser string o un solo objeto
        categoriaCount = 1;
      } else {
        // vacío
      }
      const hasServicios = hasPerfil && categoriaCount > 0;

      setHasPerfil(hasPerfil);
      setHasSucursales(hasSucursales);
      setHasServicios(hasServicios);
    } catch (err) {
      setHasPerfil(false);
      setHasSucursales(false);
      setHasServicios(false);
    } finally {
      setTienePasswordTemporal(
        user?.unsafeMetadata?.temporaryPassword === true
      );
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Está seguro que desea cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/welcome");
          } catch (error) {
            Alert.alert("Error", "Hubo un problema al cerrar sesión.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isComplete = hasPerfil && hasSucursales && hasServicios;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          {/* Debug eliminado */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Logo width={80} height={80} />
            </View>
            <Text style={styles.title}>Panel de Aliado</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isComplete ? "#10B98120" : "#F59E0B20" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: isComplete ? "#10B981" : "#F59E0B" },
                ]}
              >
                {isComplete ? "Cuenta Activa" : "Perfil Incompleto"}
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            {!isComplete && (
              <Card style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <IconButton
                    icon="alert-circle"
                    iconColor="#F59E0B"
                    size={24}
                  />
                  <Text style={styles.alertTitle}>Pasos Pendientes</Text>
                </View>
                <View style={styles.stepsContainer}>
                  {!hasPerfil && (
                    <Text style={styles.stepItem}>
                      • Información del negocio
                    </Text>
                  )}
                  {!hasSucursales && (
                    <Text style={styles.stepItem}>• Agregar sucursales</Text>
                  )}
                  {!hasServicios && (
                    <Text style={styles.stepItem}>
                      • Seleccionar categorías
                    </Text>
                  )}
                </View>
              </Card>
            )}

            <View style={styles.gridContainer}>
              <GridItem
                title="Editar Perfil"
                icon="store-edit"
                onPress={() => router.push("./completar-perfil")}
                color="#3B82F6"
              />
              <GridItem
                title="Sucursales"
                icon="map-marker-radius"
                onPress={() => router.push("./sucursales")}
                color="#10B981"
              />
              <GridItem
                title="Servicios"
                icon="tools"
                onPress={() => router.push("./servicios")}
                color="#8B5CF6"
              />
              <GridItem
                title="Categorías"
                icon="format-list-bulleted-type"
                onPress={() => router.push("./categorias-servicios")}
                color="#FF0000"
              />
              {tienePasswordTemporal && (
                <GridItem
                  title="Contraseña"
                  icon="lock-reset"
                  onPress={() => router.push("./cambiar-password")}
                  color="#F59E0B"
                />
              )}
              <GridItem
                title="Cerrar Sesión"
                icon="logout"
                onPress={handleLogout}
                color="#EF4444"
              />
            </View>
            <View style={{ marginTop: 32, marginBottom: 20 }}>
              <SignOutButton />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  headerTop: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  alertCard: {
    backgroundColor: "#1E1E1E",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  stepsContainer: {
    marginTop: 8,
    paddingLeft: 8,
  },
  stepItem: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 4,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  gridItem: {
    width: "47%",
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  gridItemTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});

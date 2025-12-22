import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import {
  databaseId,
  databases,
  isAppwriteConfigured,
  Query,
} from "@/lib/appwrite";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, BackHandler, StyleSheet, Text, View } from "react-native";
import { Button, Card, IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AliadoDashboardScreen() {
  const router = useRouter();
  const { logout, loading: authLoading, user, initializing } = useAuth();
  const [hasPerfil, setHasPerfil] = useState(false);
  const [hasSucursales, setHasSucursales] = useState(false);
  const [hasServicios, setHasServicios] = useState(false);
  const [loading, setLoading] = useState(true);
  // Suponiendo que el backend marca si la contraseña es temporal
  // Aquí se simula con un flag. Reemplaza esto por la lógica real (por ejemplo, user.prefs.temporaryPassword)
  const [tienePasswordTemporal, setTienePasswordTemporal] = useState(true);

  // Redirect to welcome if no user (after initialization)
  useEffect(() => {
    if (!initializing && !user) {
      router.replace("/welcome");
    }
  }, [initializing, user, router]);

  // Handle back button press (only if user exists)
  useEffect(() => {
    if (!user) return;

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Navigate to root to exit the aliado panel
        router.replace("/");
        return true; // Prevent default behavior
      }
    );

    return () => backHandler.remove();
  }, [router, user]);

  // Also refresh when screen is focused (e.g., after completing perfil)
  useFocusEffect(
    React.useCallback(() => {
      console.log("useFocusEffect triggered - checking perfil estado");
      if (user && !initializing) { // Only check perfil if user exists and not initializing
        checkPerfilEstado();
      }
    }, [user, initializing])
  );

  // Still run on mount/user change for initial load
  useEffect(() => {
    if (user && !initializing) { // Only check perfil if user exists and not initializing
      checkPerfilEstado();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initializing]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkPerfilEstado = async () => {
    if (!isAppwriteConfigured || !user || !user.email) {
      setHasPerfil(false);
      setHasSucursales(false);
      setHasServicios(false);
      setLoading(false);
      return;
    }
    try {
      // Buscar el $id del aliado por el email del usuario logueado
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

      // Buscar perfil_aliado activo para este aliado con categoria field expandido
      const perfilRes = await databases.listDocuments(
        databaseId,
        "perfil_aliado",
        [
          Query.equal("aliado", aliadoId),
          Query.equal("activo", true),
          Query.select(["*", "categoria.*"]), // Select all fields and expand categoria relationship
        ]
      );

      let perfilDoc = null;
      if (perfilRes.documents.length > 0) {
        perfilDoc = perfilRes.documents[0];
      }
      // Buscar al menos una sucursal para este aliado
      const sucursalRes = await databases.listDocuments(
        databaseId,
        "sucursales_aliado",
        [Query.equal("aliado", aliadoId)]
      );

      const hasPerfil = perfilRes.documents.length > 0;
      const hasSucursales = sucursalRes.documents.length > 0;
      const categoria = perfilDoc?.categoria;
      const hasServicios =
        hasPerfil && Array.isArray(categoria) && categoria.length > 0;

      console.log("Dashboard check:", {
        hasPerfil,
        hasSucursales,
        hasServicios,
        perfilExists: !!perfilDoc,
        categoria,
        categoriaType: typeof categoria,
        isArray: Array.isArray(categoria),
        categoriaLength: Array.isArray(categoria) ? categoria.length : "N/A",
      });

      setHasPerfil(hasPerfil);
      setHasSucursales(hasSucursales);
      setHasServicios(hasServicios);
    } catch (err) {
      setHasPerfil(false);
      setHasSucursales(false);
      setHasServicios(false);
    } finally {
      setTienePasswordTemporal(user?.prefs?.temporaryPassword ?? false);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Está seguro que desea cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            // Navigation will be handled by the useEffect when user becomes null
          } catch (error) {
            Alert.alert(
              "Error",
              "Hubo un problema al cerrar sesión. Inténtelo de nuevo."
            );
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.replace("/")}
              style={styles.backButton}
              iconColor="#FFFFFF"
            />
            <Logo width={80} height={80} />
          </View>
          <Text style={styles.title}>Dashboard Aliado</Text>
          <Text style={styles.subtitle}>
            {hasPerfil && hasSucursales && hasServicios
              ? "Gestiona tu perfil de aliado"
              : "Complete su perfil para activar su cuenta"}
          </Text>
        </View>

        <View style={styles.content}>
          {!hasPerfil ? (
            <>
              <Card style={styles.card}>
                <Text style={styles.cardTitle}>📋 Completar Perfil</Text>
                <Text style={styles.cardText}>
                  Para activar su cuenta de aliado, complete los siguientes
                  pasos:
                </Text>
                <View style={styles.stepsList}>
                  <Text style={styles.step}>
                    1. ✏️ Información básica del negocio
                  </Text>
                  <Text style={styles.step}>2. 📍 Agregar sucursales</Text>
                  <Text style={styles.step}>
                    3. 🔧 Seleccionar categorías de servicios
                  </Text>
                </View>
              </Card>

              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={() => router.push("./completar-perfil")}
                  style={styles.completeButton}
                  contentStyle={styles.buttonContent}
                >
                  Completar Perfil
                </Button>
              </View>
            </>
          ) : !hasSucursales ? (
            <>
              <Card style={styles.card}>
                <Text style={styles.cardTitle}>📍 Agregar Sucursales</Text>
                <Text style={styles.cardText}>
                  Agregue al menos una sucursal para su negocio.
                </Text>
              </Card>

              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={() => router.push("./sucursales")}
                  style={styles.completeButton}
                  contentStyle={styles.buttonContent}
                >
                  Agregar Sucursales
                </Button>
              </View>
            </>
          ) : !hasServicios ? (
            <>
              <Card style={styles.card}>
                <Text style={styles.cardTitle}>🔧 Seleccionar Servicios</Text>
                <Text style={styles.cardText}>
                  Seleccione las categorías de servicios que ofrece.
                </Text>
              </Card>

              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={() => router.push("./categorias-servicios")}
                  style={styles.completeButton}
                  contentStyle={styles.buttonContent}
                >
                  Seleccionar Servicios
                </Button>
              </View>
            </>
          ) : (
            <>
              <Card style={styles.card}>
                <Text style={styles.cardTitle}>✅ Perfil Completado</Text>
                <Text style={styles.cardText}>
                  Su perfil está completo y su cuenta de aliado está activa.
                </Text>
              </Card>

              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  onPress={() => router.push("./completar-perfil")}
                  style={styles.editButton}
                  contentStyle={styles.buttonContent}
                >
                  Editar Perfil
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => router.push("./sucursales")}
                  style={styles.editButton}
                  contentStyle={styles.buttonContent}
                >
                  Gestionar Sucursales
                </Button>
                {/* Solo mostrar si tiene contraseña temporal */}
                {tienePasswordTemporal && (
                  <Button
                    mode="outlined"
                    onPress={() => router.push("./cambiar-password")}
                    style={styles.editButton}
                    contentStyle={styles.buttonContent}
                  >
                    Cambiar Contraseña
                  </Button>
                )}
              </View>
            </>
          )}
        </View>

        {/* Botón de cambiar contraseña solo si tiene contraseña temporal */}
        {tienePasswordTemporal && (
          <View style={styles.securitySection}>
            <Button
              mode="text"
              onPress={() => router.push("./cambiar-password")}
              style={styles.passwordButton}
              textColor="#9CA3AF"
              icon="lock"
            >
              Cambiar Contraseña
            </Button>
          </View>
        )}

        <View style={styles.bottomButtons}>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            buttonColor="#DC2626"
            textColor="#FFFFFF"
            icon="logout"
            loading={authLoading}
            disabled={authLoading}
          >
            Cerrar Sesión
          </Button>
        </View>
      </View>
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
    padding: 24,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    marginTop: 100,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: "#9CA3AF",
    lineHeight: 20,
    marginBottom: 16,
  },
  stepsList: {
    marginLeft: 8,
  },
  step: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 8,
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 32,
  },
  completeButton: {
    backgroundColor: "#FF0000",
    borderRadius: 25,
  },
  editButton: {
    borderColor: "#666666",
    borderRadius: 25,
  },
  securitySection: {
    alignItems: "center",
    marginBottom: 16,
  },
  passwordButton: {
    borderRadius: 25,
  },
  bottomButtons: {
    alignItems: "center",
    gap: 12,
  },
  logoutButton: {
    borderRadius: 25,
    width: "100%",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  backButton: {
    borderRadius: 25,
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

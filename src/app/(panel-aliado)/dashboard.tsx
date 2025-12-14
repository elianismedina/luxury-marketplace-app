import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button, Card } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

export default function AliadoDashboardScreen() {
  const router = useRouter();
  const { logout, loading: authLoading } = useAuth();
  const [perfilCompleto, setPerfilCompleto] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPerfilEstado();
  }, []);

  const checkPerfilEstado = async () => {
    // TODO: Verificar si el perfil del aliado está completo
    // Por ahora, asumimos que no está completo para mostrar las opciones
    setPerfilCompleto(false);
    setLoading(false);
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
            router.replace("/welcome");
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
          <Logo width={120} height={120} />
          <Text style={styles.title}>Dashboard Aliado</Text>
          <Text style={styles.subtitle}>
            {perfilCompleto
              ? "Gestiona tu perfil de aliado"
              : "Complete su perfil para activar su cuenta"}
          </Text>
        </View>

        <View style={styles.content}>
          {!perfilCompleto ? (
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
                <Button
                  mode="outlined"
                  onPress={() => router.push("./cambiar-password")}
                  style={styles.editButton}
                  contentStyle={styles.buttonContent}
                >
                  Cambiar Contraseña
                </Button>
              </View>
            </>
          )}
        </View>

        {/* Botón de cambiar contraseña siempre visible */}
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
  backButton: {
    borderRadius: 25,
  },
  buttonContent: {
    height: 50,
  },
});

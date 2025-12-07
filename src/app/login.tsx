import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  HelperText,
  SegmentedButtons,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

type AuthTab = "login" | "register";

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user, initializing, loading, isConfigured, login, register, logout } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [activeTab, setActiveTab] = useState<AuthTab>("login");

  useEffect(() => {
    if (params.tab === "register" || params.tab === "login") {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  useEffect(() => {
    if (!initializing && user) {
      router.replace("/(tabs)");
    }
  }, [initializing, user, router]);

  const loginDisabled = useMemo(
    () =>
      activeTab !== "login" ||
      !isConfigured ||
      !email.trim() ||
      !password.trim() ||
      loading ||
      initializing,
    [activeTab, isConfigured, email, password, loading, initializing]
  );

  const registerDisabled = useMemo(
    () =>
      activeTab !== "register" ||
      !isConfigured ||
      !email.trim() ||
      !password.trim() ||
      !name.trim() ||
      loading ||
      initializing,
    [activeTab, isConfigured, email, password, name, loading, initializing]
  );

  const handleLogin = useCallback(async () => {
    try {
      await login(email, password);
      Alert.alert("Login exitoso", "Sesión iniciada correctamente.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo iniciar sesión.";
      Alert.alert("Error al iniciar sesión", message);
    }
  }, [login, email, password]);

  const handleRegister = useCallback(async () => {
    try {
      await register(email, password, name);
      Alert.alert(
        "Registro exitoso",
        "Cuenta creada y sesión iniciada correctamente."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo completar el registro.";
      Alert.alert("Error al registrar", message);
    }
  }, [register, email, password, name]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      Alert.alert("Sesión cerrada", "Has cerrado sesión correctamente.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cerrar la sesión.";
      Alert.alert("Error al cerrar sesión", message);
    }
  }, [logout]);

  if (initializing && !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.root}>
          <View style={styles.statusHeader}>
            <Text style={styles.heading}>Zona Pits App</Text>
            {user ? (
              <Text style={styles.statusText}>
                {`Sesión iniciada como ${user.name || user.email}`}
              </Text>
            ) : null}
            {loading ? <ActivityIndicator size="small" /> : null}
          </View>

          {!isConfigured ? (
            <HelperText type="info" visible style={styles.warning}>
              Appwrite no está configurado. Define las variables de entorno
              `EXPO_PUBLIC_APPWRITE_*` para activar el login.
            </HelperText>
          ) : null}

          <SegmentedButtons
            style={styles.tabs}
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AuthTab)}
            buttons={[
              {
                value: "login",
                label: "Iniciar sesión",
                icon: "login",
              },
              {
                value: "register",
                label: "Registrarse",
                icon: "account-plus",
              },
            ]}
          />

          <View style={styles.form}>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              mode="outlined"
              style={styles.input}
            />
            {activeTab === "register" ? (
              <TextInput
                placeholder="Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                mode="outlined"
                style={styles.input}
              />
            ) : null}

            {activeTab === "login" ? (
              <Button
                mode="contained"
                onPress={handleLogin}
                disabled={loginDisabled}
                loading={loading}
                style={styles.button}
              >
                Iniciar sesión
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleRegister}
                disabled={registerDisabled}
                loading={loading}
                style={styles.button}
              >
                Registrarse
              </Button>
            )}

            {user ? (
              <Button
                mode="outlined"
                onPress={handleLogout}
                disabled={loading}
                loading={loading}
                style={styles.button}
              >
                Cerrar sesión
              </Button>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  root: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  heading: {
    flex: 1,
    fontSize: 32,
    fontWeight: "800",
  },
  statusText: {
    fontSize: 16,
    color: "#4b5563",
  },
  warning: {
    marginTop: -8,
  },
  tabs: {
    marginTop: 12,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: "white",
  },
  button: {
    marginTop: 4,
  },
});

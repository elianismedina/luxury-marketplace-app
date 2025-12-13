import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthFailure() {
  const router = useRouter();

  useEffect(() => {
    Alert.alert(
      "Error de autenticación",
      "No se pudo completar el inicio de sesión con Google. Por favor intenta nuevamente.",
      [
        {
          text: "OK",
          onPress: () => router.replace("/login"),
        },
      ]
    );
  }, [router]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Error de autenticación
        </Text>
        <Text variant="bodyLarge" style={styles.text}>
          No se pudo completar el inicio de sesión con Google.
        </Text>
        <Button
          mode="contained"
          onPress={() => router.replace("/login")}
          style={styles.button}
          buttonColor="#FF0000"
        >
          Volver al inicio de sesión
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    color: "#FF0000",
    textAlign: "center",
  },
  text: {
    color: "#FFFFFF",
    textAlign: "center",
  },
  button: {
    marginTop: 16,
  },
});

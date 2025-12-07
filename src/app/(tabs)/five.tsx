import { useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Paragraph, Title } from "react-native-paper";

import { useAuth } from "@/context/AuthContext";

export default function TabFiveScreen() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace("/welcome");
  }, [logout, router]);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Más opciones</Title>
          <Paragraph style={styles.paragraph}>
            {user
              ? `Sesión activa como ${user.name || user.email}.`
              : "No tienes una sesión activa en este momento."}
          </Paragraph>
          <Paragraph style={styles.secondary}>
            Accede a configuraciones adicionales y gestiona tu cuenta desde
            aquí.
          </Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="outlined"
            onPress={handleLogout}
            disabled={!user || loading}
            loading={loading}
          >
            Logout
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  card: {
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  paragraph: {
    marginTop: 8,
    fontSize: 16,
  },
  secondary: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
  },
});

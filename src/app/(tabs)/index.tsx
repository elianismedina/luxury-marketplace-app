import { StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Card,
  Paragraph,
  Title,
} from "react-native-paper";

import { useAuth } from "@/context/AuthContext";

export default function TabOneScreen() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Zona Pits</Title>
          <Paragraph style={styles.paragraph}>
            {user
              ? `Bienvenido de nuevo, ${user.name || user.email}!`
              : "Aún no hay sesión activa."}
          </Paragraph>
          <Paragraph style={styles.secondary}>
            Aquí podrás explorar vehículos de lujo, gestionar tu garaje y
            descubrir nuevas oportunidades exclusivas.
          </Paragraph>
        </Card.Content>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 18,
    marginBottom: 12,
  },
  secondary: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6b7280",
  },
});

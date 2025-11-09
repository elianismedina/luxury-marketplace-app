import { StyleSheet, Text, View } from "react-native";

export default function TabThreeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Añadir</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "black",
  },
});

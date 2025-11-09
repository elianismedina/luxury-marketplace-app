import { StyleSheet, Text, View } from "react-native";

export default function TabFourScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Garaje</Text>
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

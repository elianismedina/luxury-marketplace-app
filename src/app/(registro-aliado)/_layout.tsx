import { Stack } from "expo-router";

export default function AliadosLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="registro"
        options={{
          title: "Registro de Aliado",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

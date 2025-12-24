import { Stack } from "expo-router";

export default function AliadoLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="dashboard"
        options={{
          title: "Dashboard Aliado",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="completar-perfil"
        options={{
          title: "Completar Perfil",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="sucursales"
        options={{
          title: "Gestionar Sucursales",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="categorias-servicios"
        options={{
          title: "Categorías de Servicios",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="cambiar-password"
        options={{
          title: "Cambiar Contraseña",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="servicios"
        options={{
          title: "Servicios Ofrecidos",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

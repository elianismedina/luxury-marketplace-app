import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { IconButton, PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { ThemeProvider as StyledThemeProvider } from "styled-components/native";

import { AnimatedSplashScreen } from "@/components/AnimatedSplashScreen";
import { useColorScheme } from "@/components/useColorScheme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import "@/i18n";
import { teams } from "@/lib/appwrite";
import { paperDarkTheme } from "@/theme/paperTheme";
import { theme } from "@/theme/theme";
import { usePathname, useRouter, useSegments } from "expo-router";
import { useState } from "react";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "welcome",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../../assets/fonts/SpaceMono-Regular.ttf"),
    HomemadeApple: require("../../assets/fonts/HomemadeApple-Regular.ttf"),
    ...FontAwesome.font,
  });
  // Force dark mode implementation
  const systemColorScheme = useColorScheme();
  const colorScheme = "dark";
  const paperTheme = paperDarkTheme;

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <StyledThemeProvider theme={theme}>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <RootLayoutNav />
          <StatusBar style="light" backgroundColor="#121212" />
        </AuthProvider>
      </PaperProvider>
    </StyledThemeProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = "dark";
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const { user, initializing } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const [checkedTeam, setCheckedTeam] = useState(false);

  useEffect(() => {
    if (initializing) return;

    // Use type assertion to avoid 'never' type issue with segments
    const segmentsList = segments as string[];

    const isRegistroAliado =
      pathname.includes("(registro-aliado)") ||
      segmentsList.includes("(registro-aliado)") ||
      pathname.includes("/registro");

    const isPublicRoute =
      ["/welcome", "/login", "/"].includes(pathname) || isRegistroAliado;

    const isAliadoPath =
      pathname.includes("(panel-aliado)") ||
      segmentsList.includes("(panel-aliado)");
    const isClientePath =
      pathname.includes("(clientes)") || segmentsList.includes("(clientes)");

    console.log("[RootLayoutNav] Status:", {
      pathname,
      isPublicRoute,
      isAliadoPath,
      isClientePath,
      hasUser: !!user,
      initializing,
    });

    if (user) {
      // Si hay usuario, verificamos su rol
      (async () => {
        try {
          const teamsList = await teams.list();
          const isAliado = teamsList.teams.some(
            (t: any) => t.$id === "6942bcc6001056b6c3d8"
          );

          console.log("[RootLayoutNav] Role check:", {
            isAliado,
            totalTeams: teamsList.total,
          });

          if (isAliado) {
            // Si es aliado y está en ruta pública o de cliente, redirigir a su panel
            if (isPublicRoute || isClientePath) {
              console.log(
                "[RootLayoutNav] Allied user on wrong route, redirecting to allied dashboard..."
              );
              router.replace("/(panel-aliado)/dashboard");
            }
          } else {
            // Si no es aliado y está en ruta pública o de aliado, redirigir a clientes
            if (isPublicRoute || isAliadoPath) {
              console.log(
                "[RootLayoutNav] Client user on wrong route, redirecting to client panel..."
              );
              router.replace("/(clientes)");
            }
          }
        } catch (err) {
          console.error("[RootLayoutNav] Error fetching memberships:", err);
          // Si falla la verificación, al menos permitimos que el usuario se quede
          // donde está si ya está en una ruta autenticada
          if (isPublicRoute) {
            router.replace("/(clientes)"); // Fallback a clientes si está en public
          }
        } finally {
          setCheckedTeam(true);
        }
      })();
    } else {
      // Si no hay usuario y no es ruta pública (incluyendo registro de aliado), redirigir a welcome
      if (!isPublicRoute) {
        console.log(
          "[RootLayoutNav] No user on private route, redirecting to welcome...",
          { pathname, isPublicRoute, isRegistroAliado }
        );
        router.replace("/welcome");
      }
    }
  }, [user, initializing, pathname, segments, router]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(clientes)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(panel-aliado)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(registro-aliado)"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          <Stack.Screen
            name="edit-vehicle"
            options={{
              title: "Editar Vehículo",
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: "#FFFFFF",
              headerTitleStyle: { fontWeight: "bold" },
              headerRight: () => (
                <View style={{ flexDirection: "row", marginRight: 8 }}>
                  <IconButton
                    icon="check"
                    iconColor="#FFFFFF"
                    size={26}
                    onPress={() => {
                      if ((global as any).handleSaveVehiculo) {
                        (global as any).handleSaveVehiculo();
                      }
                    }}
                  />
                </View>
              ),
            }}
          />
        </Stack>
        {!isSplashFinished && (
          <AnimatedSplashScreen
            triggerAnimation={!initializing}
            onAnimationFinish={() => setIsSplashFinished(true)}
          />
        )}
      </View>
    </ThemeProvider>
  );
}

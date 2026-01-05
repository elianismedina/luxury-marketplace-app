import FontAwesome from "@expo/vector-icons/FontAwesome";
// --- END: Unhandled Promise Rejection Handler ---
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { IconButton, PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { ThemeProvider as StyledThemeProvider } from "styled-components/native";

import { AnimatedSplashScreen } from "@/components/AnimatedSplashScreen";
import { ErrorBoundary } from "@/components/error-boundary";
import { useColorScheme } from "@/components/useColorScheme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ConnectionProvider } from "@/hooks/useConnection";
import "@/i18n";
import { paperDarkTheme } from "@/theme/paperTheme";
import { theme } from "@/theme/theme";
import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
// --- START: Unhandled Promise Rejection Handler ---
// This is a safety net to prevent crashes from uncaught promises.
// It logs the error for debugging but prevents the app from crashing.

const tracking = require("promise/setimmediate/rejection-tracking");

tracking.enable({
  allRejections: true,
  onUnhandled: (id: number, error: any) => {
    console.error("Unhandled Promise Rejection:", { id, error });
    // In a production app, you might log this to an error reporting service.
  },
  onHandled: (id: number) => {
    // This is called when a promise is rejected but handled later.
    // You can use this to clear any error indicators.
  },
});

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

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
  );
}

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
    <ErrorBoundary>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <ClerkLoaded>
          <StyledThemeProvider theme={theme}>
            <PaperProvider theme={paperTheme}>
              <AuthProvider>
                <ConnectionProvider>
                  <RootLayoutNav />
                  <StatusBar style="light" backgroundColor="#121212" />
                </ConnectionProvider>
              </AuthProvider>
            </PaperProvider>
          </StyledThemeProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </ErrorBoundary>
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
      ["/welcome", "/sign-in", "/sign-up", "/"].includes(pathname) ||
      isRegistroAliado;

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
      // Role checking using Clerk metadata (checking both public and unsafe for flexibility)
      const isAliado =
        user.publicMetadata?.role === "aliado" ||
        user.unsafeMetadata?.role === "aliado";

      console.log("[RootLayoutNav] Role check:", {
        isAliado,
        metadata: user.publicMetadata,
      });

      if (isAliado) {
        // Si es aliado y está en ruta pública o de cliente, redirigir a su panel
        if ((isPublicRoute && !isAliadoPath) || isClientePath) {
          console.log(
            "[RootLayoutNav] Allied user on wrong route, redirecting to allied dashboard..."
          );
          router.replace("/(panel-aliado)/dashboard");
        }
      } else {
        // Para clientes (o usuarios sin rol específico)
        // Si está en ruta pública (fuera de /) o de aliado, redirigir a clientes
        if (
          (isPublicRoute && pathname !== "/" && !isClientePath) ||
          isAliadoPath
        ) {
          console.log(
            "[RootLayoutNav] Client user on wrong route, redirecting to client panel..."
          );
          router.replace("/(clientes)");
        }
      }
      setCheckedTeam(true);
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
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />

          <Stack.Screen name="(clientes)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(panel-aliado)"
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

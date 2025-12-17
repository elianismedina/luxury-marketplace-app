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
import { teams } from "@/lib/appwrite";
import { paperDarkTheme } from "@/theme/paperTheme";
import { theme } from "@/theme/theme";
import { usePathname, useRouter } from "expo-router";
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
  const [checkedTeam, setCheckedTeam] = useState(false);

  useEffect(() => {
    // Solo redirigir si hay usuario y no estamos inicializando
    if (!initializing && user && pathname === "/welcome") {
      // Verificar teams del usuario
      (async () => {
        try {
          // Obtener los teams del usuario
          const memberships = await teams.listMemberships();
          const aliadoTeam = memberships.memberships.find(
            (m) => m.teamId === "6942bcc6001056b6c3d8"
          );
          if (aliadoTeam) {
            router.replace("/(panel-aliado)/dashboard");
          } else {
            router.replace("/(clientes)");
          }
        } catch (err) {
          // Si falla, no redirigir
        } finally {
          setCheckedTeam(true);
        }
      })();
    }
  }, [user, initializing, pathname, router]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(clientes)" options={{ headerShown: false }} />
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

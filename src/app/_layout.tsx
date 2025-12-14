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
import { paperDarkTheme } from "@/theme/paperTheme";
import { theme } from "@/theme/theme";
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

  if (initializing && !user) {
    // If initializing but NO user data/check running, we just render normally
    // but keep the Splash Screen up via the component below.
    // However, the original code had an explicit early return for initializing.
    // We should REMOVE that early return because we want to render the Stack (behind the splash)
    // so the Router can initialize and we can perform redirects.
  }

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

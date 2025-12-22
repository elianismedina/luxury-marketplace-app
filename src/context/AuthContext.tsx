import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import { ID, Models } from "react-native-appwrite";

import {
  account,
  getLoggedInUser,
  isAppwriteConfigured,
  teams,
} from "@/lib/appwrite";

type User = Models.User<Models.Preferences>;

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  loading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  recoverPassword: (email: string, redirectUrl: string) => Promise<void>;
  confirmPasswordReset: (
    userId: string,
    secret: string,
    newPassword: string
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const current = await getLoggedInUser();
      setUser(current);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAppwriteConfigured) {
      setInitializing(false);
      return;
    }

    refresh().catch(() => {
      // Swallow errors. `refresh` already sets `user` to null when `getLoggedInUser` fails.
    });
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!isAppwriteConfigured) {
        throw new Error("Appwrite is not configured.");
      }

      setLoading(true);
      try {
        // Delete any existing session before creating a new one
        try {
          await account.deleteSession("current");
        } catch (error) {
          // Ignore errors if no session exists
        }

        await account.createEmailPasswordSession({
          email: email.trim(),
          password,
        });
        await refresh();
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const USERS_TEAM_ID = "6942bcb8001fdb95f907"; // Reemplaza por el ID real de tu team 'users'
  const register = useCallback(
    async (email: string, password: string, name: string) => {
      if (!isAppwriteConfigured) {
        throw new Error("Appwrite is not configured.");
      }

      setLoading(true);
      try {
        // 1. Crear cuenta
        const user = await account.create(
          ID.unique(),
          email.trim(),
          password,
          name.trim()
        );
        // 2. Delete any existing session (shouldn't exist for new accounts, but just in case)
        try {
          await account.deleteSession("current");
        } catch (error) {
          // Ignore errors if no session exists
        }
        // 3. Iniciar sesión
        await account.createEmailPasswordSession({
          email: email.trim(),
          password,
        });
        // 4. Agregar al team 'users' con rol 'USER'
        try {
          await teams.createMembership({
            teamId: USERS_TEAM_ID,
            userId: user.$id,
            roles: ["USER"],
            email: email.trim(),
            name: name.trim(),
          });
        } catch (err) {
          // Si ya es miembro, ignorar error
          if (
            !(
              err &&
              typeof err === "object" &&
              "message" in err &&
              (err as any).message.includes("already")
            )
          ) {
            throw err;
          }
        }
        await refresh();
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    if (!isAppwriteConfigured) {
      setUser(null);
      return;
    }

    setLoading(true);
    try {
      await account.deleteSession("current");
      setUser(null);
    } catch (error: any) {
      // Si el error es por scopes/account, igual limpiamos el estado local y NO mostramos alerta
      if (
        error?.message?.includes("missing scopes") ||
        error?.message?.includes("role: guests")
      ) {
        setUser(null);
        // Opcional: puedes mostrar un toast suave, pero NO alert
      } else {
        console.error("Error al cerrar sesión:", error);
        alert(
          "Hubo un problema al cerrar sesión. Por favor, inténtelo de nuevo o cierre la app."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const recoverPassword = useCallback(
    async (email: string, redirectUrl: string) => {
      if (!isAppwriteConfigured) {
        throw new Error("Appwrite no está configurado");
      }
      setLoading(true);
      try {
        await account.createRecovery(email.trim(), redirectUrl);
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const confirmPasswordReset = useCallback(
    async (userId: string, secret: string, newPassword: string) => {
      if (!isAppwriteConfigured) {
        throw new Error("Appwrite no está configurado");
      }

      setLoading(true);
      try {
        await account.updateRecovery(userId, secret, newPassword, newPassword);
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    if (!isAppwriteConfigured) {
      throw new Error("Appwrite no está configurado");
    }

    console.log("loginWithGoogle: Starting OAuth flow...");

    // Debug: verificar configuración
    console.log("Appwrite Configuration:", {
      endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
      projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
      platform: process.env.EXPO_PUBLIC_APPWRITE_PLATFORM,
      isConfigured: isAppwriteConfigured,
    });

    try {
      // Different approach for web vs native
      const isWeb = Platform.OS === "web";

      if (isWeb) {
        // For web, use relative URLs that Appwrite will construct
        console.log(
          "loginWithGoogle: Web platform detected, using full page redirect"
        );

        // Use the current location to build proper URLs
        const baseUrl = window.location.origin;
        console.log("loginWithGoogle: Base URL:", baseUrl);

        // This method causes a full page redirect, so wrap in try/catch
        // but don't await it - it redirects immediately
        try {
          console.log("loginWithGoogle: Calling createOAuth2Session...");
          const result = account.createOAuth2Session(
            "google" as any,
            `${baseUrl}/auth/callback`,
            `${baseUrl}/auth/failure`
          );
          console.log("loginWithGoogle: createOAuth2Session result:", result);

          // If we get here, it means the SDK returned a URL instead of redirecting
          // Handle both string and URL object types
          if (result) {
            const redirectUrl =
              typeof result === "string" ? result : result.toString();
            console.log("loginWithGoogle: Redirecting to:", redirectUrl);
            window.location.href = redirectUrl;
          }
        } catch (error: any) {
          console.error(
            "loginWithGoogle: Error creating OAuth session:",
            error
          );
          // Check if it's a 401 error
          if (error.code === 401 || error.type === "user_unauthorized") {
            throw new Error(
              "Error de configuración de OAuth. Verifica que Google OAuth esté habilitado y configurado correctamente en Appwrite Console."
            );
          }
          throw error;
        }

        // The page should have redirected by now
      } else {
        // For mobile, use WebBrowser with app scheme
        console.log(
          "loginWithGoogle: Native platform detected, using WebBrowser"
        );

        console.log("loginWithGoogle: Creating OAuth session for mobile...");

        try {
          // Use the Appwrite-specific callback scheme
          const redirectUrl = `appwrite-callback-6910079a00217d16d0ed://`;

          console.log("loginWithGoogle: Redirect URL:", redirectUrl);

          const oauthUrl = await account.createOAuth2Session(
            "google" as any,
            redirectUrl,
            redirectUrl
          );

          console.log("loginWithGoogle: OAuth URL:", oauthUrl);
          console.log("loginWithGoogle: Opening WebBrowser...");

          // Use openAuthSessionAsync with the callback scheme
          const result = await WebBrowser.openAuthSessionAsync(
            oauthUrl.toString(),
            redirectUrl
          );

          console.log("loginWithGoogle: WebBrowser result:", result);
          console.log("loginWithGoogle: Result type:", result.type);

          if (result.type === "success") {
            console.log(
              "loginWithGoogle: OAuth successful, waiting for session..."
            );

            // Try to get the session with retries
            let currentUser = null;
            const maxRetries = 5;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              console.log(
                `loginWithGoogle: Attempt ${attempt}/${maxRetries} to get session...`
              );

              // Wait before each attempt (exponential backoff)
              await new Promise((resolve) =>
                setTimeout(resolve, attempt * 1000)
              );

              try {
                currentUser = await account.get();
                console.log("loginWithGoogle: Session found!", currentUser);
                setUser(currentUser);
                break;
              } catch (e: any) {
                console.log(
                  `loginWithGoogle: Attempt ${attempt} failed:`,
                  e.message || e.type || e
                );
                console.log(`loginWithGoogle: Error code:`, e.code);
                console.log(`loginWithGoogle: Error type:`, e.type);
                console.log(
                  `loginWithGoogle: Full error:`,
                  JSON.stringify(e, null, 2)
                );

                if (attempt === maxRetries) {
                  console.error("loginWithGoogle: All attempts failed");
                  console.error("loginWithGoogle: Last error details:", e);
                  throw new Error(
                    "No se pudo obtener la sesión después de varios intentos. " +
                      "Verifica que:\n" +
                      "1. La plataforma Android esté configurada en Appwrite Console\n" +
                      "2. El Package Name sea: com.elianismedina05.luxurymarketplace\n" +
                      "3. Google OAuth esté habilitado en Auth → Settings"
                  );
                }
              }
            }

            console.log("loginWithGoogle: Session refreshed successfully");
          } else if (result.type === "cancel") {
            console.log("loginWithGoogle: User cancelled OAuth");
            throw new Error("Inicio de sesión cancelado");
          } else {
            console.log("loginWithGoogle: Unknown result type:", result.type);
            throw new Error("Resultado de autenticación desconocido");
          }
        } catch (webBrowserError) {
          console.error("loginWithGoogle: WebBrowser error:", webBrowserError);
          throw webBrowserError;
        }
      }

      // After OAuth completes, user will be redirected to callback
      // The callback page will handle the refresh
    } catch (error) {
      console.error("loginWithGoogle: Error during OAuth:", error);
      throw error;
    }
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      loading,
      isConfigured: isAppwriteConfigured,
      login,
      register,
      logout,
      refresh,
      recoverPassword,
      confirmPasswordReset,
      loginWithGoogle,
    }),
    [
      user,
      initializing,
      loading,
      login,
      register,
      logout,
      refresh,
      recoverPassword,
      confirmPasswordReset,
      loginWithGoogle,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

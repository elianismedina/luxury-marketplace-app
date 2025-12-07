import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ID, Models } from "react-native-appwrite";

import { account, getLoggedInUser, isAppwriteConfigured } from "@/lib/appwrite";

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

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      if (!isAppwriteConfigured) {
        throw new Error("Appwrite is not configured.");
      }

      setLoading(true);
      try {
        await account.create(ID.unique(), email.trim(), password, name.trim());
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

  const logout = useCallback(async () => {
    if (!isAppwriteConfigured) {
      setUser(null);
      return;
    }

    setLoading(true);
    try {
      await account.deleteSession("current");
      setUser(null);
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

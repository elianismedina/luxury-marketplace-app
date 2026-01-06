import {
  useAuth as useClerkAuth,
  useOAuth,
  useSignIn,
  useSignUp,
  useUser,
} from "@clerk/clerk-expo";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type User = any; // Will be adapted from Clerk user

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  loading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
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
  const { isLoaded: authLoaded, userId, signOut } = useClerkAuth();
  const { isLoaded: userLoaded, user: clerkUser } = useUser();
  const {
    signIn,
    setActive: setSignInActive,
    isLoaded: signInLoaded,
  } = useSignIn();
  const {
    signUp,
    setActive: setSignUpActive,
    isLoaded: signUpLoaded,
  } = useSignUp();
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({
    strategy: "oauth_google",
  });

  const [loading, setLoading] = useState(false);

  const initializing = !authLoaded || !userLoaded;

  const user = useMemo(() => {
    if (!clerkUser) return null;
    return {
      ...clerkUser,
      email: clerkUser.primaryEmailAddress?.emailAddress,
      name: clerkUser.fullName || clerkUser.firstName || "Usuario",
    };
  }, [clerkUser]);

  const refresh = useCallback(async () => {
    // Clerk handles refresh automatically via hooks
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!signInLoaded) return;

      setLoading(true);
      try {
        const completeSignIn = await signIn.create({
          identifier: email,
          password,
        });

        if (completeSignIn.status === "complete") {
          await setSignInActive({ session: completeSignIn.createdSessionId });
        } else {
          console.error(JSON.stringify(completeSignIn, null, 2));
        }
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [signInLoaded, signIn, setSignInActive]
  );

  const USERS_TEAM_ID = "6942bcb8001fdb95f907"; // Reemplaza por el ID real de tu team 'users'
  const register = useCallback(
    async (email: string, password: string, name: string) => {
      if (!signUpLoaded) return;

      setLoading(true);
      try {
        await signUp.create({
          emailAddress: email,
          password,
          firstName: name,
        });

        // For simplicity, we assume no email verification is required for now
        // or that it's handled via Clerk dashboard settings.
        // In a real app, you'd handle prepareEmailAddressVerification here.
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });

        console.log("Sign up pending verification");
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [signUpLoaded, signUp]
  );

  const verifyEmail = useCallback(
    async (code: string) => {
      if (!signUpLoaded) return;
      setLoading(true);
      try {
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code,
        });
        if (completeSignUp.status === "complete") {
          await setSignUpActive({ session: completeSignUp.createdSessionId });
        } else {
          console.error(JSON.stringify(completeSignUp, null, 2));
        }
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [signUpLoaded, signUp, setSignUpActive]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  const recoverPassword = useCallback(
    async (email: string, redirectUrl: string) => {
      // Clerk handles password recovery differently
    },
    []
  );

  const confirmPasswordReset = useCallback(
    async (userId: string, secret: string, newPassword: string) => {
      // Clerk handles password recovery differently
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startGoogleOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("OAuth error", err);
      throw err;
    }
  }, [startGoogleOAuthFlow]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      loading,
      isConfigured: !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,

      login,
      register,
      verifyEmail,
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
      verifyEmail,
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
    // Return default values if not within provider (e.g., during initialization)
    return {
      user: null,
      initializing: true,
      loading: false,
      isConfigured: false,
      login: async () => {},
      register: async () => {},
      verifyEmail: async () => {},
      logout: async () => {},
      refresh: async () => {},
      recoverPassword: async () => {},
      confirmPasswordReset: async () => {},
      loginWithGoogle: async () => {},
    };
  }
  return context;
}

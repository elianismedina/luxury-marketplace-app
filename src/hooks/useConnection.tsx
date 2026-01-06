import { SessionProvider, useSession } from "@livekit/components-react";
import { TokenSource } from "livekit-client";
import { createContext, useContext, useMemo, useState } from "react";
import { requestRecordingPermissionsAsync } from "expo-audio";

// TODO: Add your Sandbox ID here
const sandboxID = process.env.EXPO_PUBLIC_LIVEKIT_SANDBOX_ID || "";

// The name of the agent you wish to be dispatched.
const agentName = undefined;

// NOTE: If you prefer not to use LiveKit Sandboxes for testing, you can generate your
// tokens manually by visiting https://cloud.livekit.io/projects/p_/settings/keys
// and using one of your API Keys to generate a token with custom TTL and permissions.

// For use without a token server.
const hardcodedUrl = process.env.EXPO_PUBLIC_LIVEKIT_URL || "";
const hardcodedToken = process.env.EXPO_PUBLIC_LIVEKIT_TOKEN || "";
const tokenEndpoint = process.env.EXPO_PUBLIC_LIVEKIT_TOKEN_ENDPOINT || "";

interface ConnectionContextType {
  isConnectionActive: boolean;
  isConfigured: boolean;
  connect: () => void;
  disconnect: () => void;
}

const ConnectionContext = createContext<ConnectionContextType>({
  isConnectionActive: false,
  isConfigured: false,
  connect: () => {},
  disconnect: () => {},
});

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return ctx;
}

async function requestMicPermission() {
  try {
    const { granted } = await requestRecordingPermissionsAsync();
    return granted;
  } catch (error) {
    console.warn("Failed to request mic permission:", error);
    return false;
  }
}

export function isLiveKitConfigured(): boolean {
  return !!(
    process.env.EXPO_PUBLIC_LIVEKIT_SANDBOX_ID ||
    (process.env.EXPO_PUBLIC_LIVEKIT_URL &&
      process.env.EXPO_PUBLIC_LIVEKIT_TOKEN) ||
    (process.env.EXPO_PUBLIC_LIVEKIT_URL &&
      process.env.EXPO_PUBLIC_LIVEKIT_TOKEN_ENDPOINT)
  );
}

interface ConnectionProviderProps {
  children: React.ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const [isConnectionActive, setIsConnectionActive] = useState(false);

  const isConfigured =
    !!sandboxID ||
    !!(hardcodedUrl && hardcodedToken) ||
    !!(hardcodedUrl && tokenEndpoint);

  const tokenSource = useMemo(() => {
    if (tokenEndpoint) {
      return {
        fetch: async () => {
          const res = await fetch(tokenEndpoint);
          const text = await res.text();
          console.log("Token endpoint response:", text);
          const data = JSON.parse(text);

          return {
            serverUrl: hardcodedUrl,
            participantToken: data.token,
          };
        },
      };
    }

    if (sandboxID) {
      return TokenSource.sandboxTokenServer(sandboxID);
    }

    return TokenSource.literal({
      serverUrl: hardcodedUrl,
      participantToken: hardcodedToken,
    });
  }, [sandboxID, hardcodedUrl, hardcodedToken, tokenEndpoint]);

  const session = useSession(
    tokenSource,
    agentName ? { agentName } : undefined
  );

  const { start: startSession, end: endSession } = session;

  const value = useMemo(() => {
    return {
      isConnectionActive,
      isConfigured,
      connect: async () => {
        if (!isConfigured) return;

        const granted = await requestMicPermission();
        if (!granted) {
          console.warn("Microphone permission denied");
          return;
        }

        setIsConnectionActive(true);
        startSession();
      },
      disconnect: () => {
        setIsConnectionActive(false);
        endSession();
      },
    };
  }, [startSession, endSession, isConnectionActive, isConfigured]);

  return (
    <SessionProvider session={session}>
      <ConnectionContext.Provider value={value}>
        {children}
      </ConnectionContext.Provider>
    </SessionProvider>
  );
}

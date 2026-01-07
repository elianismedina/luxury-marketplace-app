import { Room } from "livekit-client";
import { TokenSource } from "livekit-client";
import { SessionProvider } from "@livekit/components-react";
import { registerGlobals } from "@livekit/react-native-webrtc";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { requestRecordingPermissionsAsync } from "expo-audio";

// TODO: Add your Sandbox ID here
const sandboxID = process.env.EXPO_PUBLIC_LIVEKIT_SANDBOX_ID || "";

// The name of the agent you wish to be dispatched.
const agentName = process.env.EXPO_PUBLIC_AGENT_ID || undefined;
console.log("Agent name from env:", process.env.EXPO_PUBLIC_AGENT_ID, "agentName:", agentName);

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
  messages: Array<{from: string, message: string}>;
  sendMessage: (message: string) => void;
}

const ConnectionContext = createContext<ConnectionContextType>({
  isConnectionActive: false,
  isConfigured: false,
  connect: () => {},
  disconnect: () => {},
  messages: [],
  sendMessage: () => {},
});

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return ctx;
}

async function requestMicPermission() {
  if (Platform.OS === "web") {
    // On web, check if mediaDevices is available
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      try {
        const { granted } = await requestRecordingPermissionsAsync();
        return granted;
      } catch (error) {
        console.warn("Failed to request mic permission on web:", error);
        return false;
      }
    } else {
      console.warn("WebRTC not supported on this browser");
      return false;
    }
  }
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
  // Register WebRTC globals for React Native
  useEffect(() => {
    // Set userAgent for browser detection
    if (typeof global !== 'undefined' && global.navigator) {
      global.navigator.userAgent = 'React Native';
    }
    registerGlobals();
  }, []);

  const [isConnectionActive, setIsConnectionActive] = useState(false);
  const [messages, setMessages] = useState<Array<{from: string, message: string}>>([]);
  const room = useMemo(() => {
    const r = new Room();
    r.on('connected', () => {
      setIsConnectionActive(true);
      console.log("Successfully connected to LiveKit");
    });
    r.on('disconnected', () => {
      setIsConnectionActive(false);
      console.log("Disconnected from LiveKit");
    });
    r.on('dataReceived', (payload, participant, kind) => {
      const message = new TextDecoder().decode(payload);
      setMessages(prev => [...prev, { from: participant?.identity || 'Agent', message }]);
    });
    return r;
  }, []);

  const isConfigured =
    !!sandboxID ||
    !!(hardcodedUrl && hardcodedToken) ||
    !!(hardcodedUrl && tokenEndpoint);

  const tokenSource = useMemo(() => {
    if (tokenEndpoint) {
      return {
        fetch: async (options?: any) => {
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

  const connect = useCallback(async () => {
    console.log("Connect function called, isConfigured:", isConfigured);
    if (!isConfigured) return;

    const granted = await requestMicPermission();
    console.log("Microphone permission granted:", granted);
    if (!granted) {
      console.warn("Microphone permission denied");
      return;
    }

        try {
          console.log("Attempting to connect to LiveKit with sandbox ID:", sandboxID);
          let tokenData;
          if (sandboxID) {
            console.log("Using sandbox API with agent config");
            const response = await fetch('https://cloud-api.livekit.io/api/sandbox/connection-details', {
              method: 'POST',
              headers: {
                'X-Sandbox-ID': sandboxID,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                room_config: agentName ? { agents: [{ name: agentName }] } : {}
              }),
            });
            if (!response.ok) {
              const errorText = await response.text();
              console.error("Sandbox API error:", errorText);
              throw new Error(`Sandbox token request failed: ${response.status}`);
            }
            const data = await response.json();
            console.log("Sandbox API response data:", data);
            tokenData = {
              serverUrl: data.serverUrl,
              participantToken: data.participantToken,
            };
          } else {
            tokenData = await (tokenSource as any).fetch({});
          }
          console.log("Token data received:", tokenData);

          await room.connect(tokenData.serverUrl, tokenData.participantToken);
        } catch (error) {
          console.error("Failed to connect to LiveKit:", error);
          console.error("Sandbox ID used:", sandboxID);
        }
  }, [room, tokenSource, isConfigured]);

  const disconnect = useCallback(() => {
    room.disconnect();
    setIsConnectionActive(false);
  }, [room]);

  const mockSession = useMemo(() => ({
    room,
    connectionState: 'disconnected' as any,
    isConnected: false,
    local: {
      cameraTrack: null,
      microphoneTrack: null,
    },
    start: connect,
    end: disconnect,
    internal: {},
  }), [room, connect, disconnect]);

  const sendMessage = useCallback((message: string) => {
    room.localParticipant?.publishData(new TextEncoder().encode(message), { topic: 'chat' });
  }, [room]);

  const value = useMemo(() => ({
    isConnectionActive,
    isConfigured,
    connect,
    disconnect,
    messages,
    sendMessage,
  }), [isConnectionActive, isConfigured, connect, disconnect, messages, sendMessage]);

  return (
    <SessionProvider session={mockSession as any}>
      <ConnectionContext.Provider value={value}>
        {children}
      </ConnectionContext.Provider>
    </SessionProvider>
  );
}

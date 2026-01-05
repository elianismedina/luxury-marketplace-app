// 1. Polyfills must come first
import "@bacons/text-decoder/install";
import { registerGlobals } from "@livekit/react-native";

// 3. START EXPO ROUTER (The missing piece)
// This line replaces "registerRootComponent(App)" for Expo Router projects
import "expo-router/entry";

// 2. Initialize your globals
registerGlobals();

if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder } = require("text-encoding");
  global.TextEncoder = TextEncoder;
}

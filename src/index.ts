// 1️⃣ Core polyfills FIRST
import "@bacons/text-decoder/install";
import * as Crypto from "expo-crypto";
import "react-native-get-random-values";

// 4️⃣ NOW initialize LiveKit globals
import { registerGlobals } from "@livekit/react-native";

// 5️⃣ LAST: start Expo Router
import "expo-router/entry";

// 2️⃣ Polyfill crypto.randomUUID BEFORE LiveKit loads
if (!global.crypto) {
  // @ts-ignore
  global.crypto = {};
}

if (!global.crypto.randomUUID) {
  // @ts-ignore
  global.crypto.randomUUID = Crypto.randomUUID;
}

// 3️⃣ TextEncoder fallback (some Android builds still need this)
if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder } = require("text-encoding");
  global.TextEncoder = TextEncoder;
}
registerGlobals();

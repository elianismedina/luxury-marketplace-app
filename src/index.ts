import { registerGlobals } from "@livekit/react-native";

registerGlobals();
if (typeof global.TextDecoder === "undefined") {
  // @ts-ignore
  global.TextDecoder = require("text-encoding").TextDecoder;
}

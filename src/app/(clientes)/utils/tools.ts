// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import * as Battery from "expo-battery";
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import * as Brightness from "expo-brightness";

const getBatteryLevel = async () => {
  const batteryLevel = await Battery.getBatteryLevelAsync();
  console.log("batteryLevel", batteryLevel);
  if (batteryLevel === -1) {
    return "Error: Device does not support retrieving the battery level.";
  }
  return batteryLevel;
};

const changeBrightness = (params: any) => {
  const brightness = (params as any).brightness;
  console.log("changeBrightness", brightness);
  Brightness.setSystemBrightnessAsync(brightness);
  return brightness;
};

const flashScreen = () => {
  Brightness.setSystemBrightnessAsync(1);
  setTimeout(() => {
    Brightness.setSystemBrightnessAsync(0);
  }, 200);
  return "Successfully flashed the screen.";
};

export { getBatteryLevel, changeBrightness, flashScreen };

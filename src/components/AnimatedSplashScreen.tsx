import { useAudioPlayer } from "expo-audio";
import * as SplashScreen from "expo-splash-screen";
import LottieView from "lottie-react-native";
import React, { useEffect, useState } from "react";
import { Animated, StyleSheet } from "react-native";

interface AnimatedSplashScreenProps {
  onAnimationFinish: () => void;
  triggerAnimation?: boolean;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onAnimationFinish,
  triggerAnimation = true,
}) => {
  const [fadeAnim] = useState(new Animated.Value(1));
  const player = useAudioPlayer(
    require("../../assets/audio/LamborginiSound.mp4")
  );

  useEffect(() => {
    if (!triggerAnimation) return;

    const playSound = () => {
      try {
        player.play();
      } catch (error) {
        console.error("Failed to play splash sound:", error);
      }
    };

    SplashScreen.hideAsync().then(() => {
      playSound();

      // Wait for Lottie animation to complete (3 seconds) then fade out
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          onAnimationFinish();
        });
      }, 3000);
    });
  }, [triggerAnimation]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <LottieView
        source={require("../../assets/lotties/ZonaPitsLottie.json")}
        autoPlay
        loop={false}
        style={styles.lottie}
      />
    </Animated.View>
  );
};

// We need to initialize the Animated Values correctly.
// Also we need to match background color of native splash.
// Native splash bg is white (#ffffff) in app.json.
// If we want "Modern Dark", we have a mismatch.
// We should probably update this component to be dark, and hope the user updates app.json or accepts the flash.
// BETTER: Match app.json for now, creating a smooth transition.
// app.json says background #ffffff.

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#121212", // Dark background to match the app theme
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
  },
  lottie: {
    width: 300,
    height: 300,
  },
});

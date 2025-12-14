import { useAudioPlayer } from "expo-audio";
import * as SplashScreen from "expo-splash-screen";
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
  const [animation] = useState(new Animated.Value(1));
  const [scale] = useState(new Animated.Value(1));
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

    // 1. Start with opacity 1 (visible)
    // 2. Animate scale/opacity
    const runAnimation = async () => {
      // Hide native splash screen immediately when this component mounts
      // ensuring seamless transition if the image aligns.
      await SplashScreen.hideAsync();

      playSound();

      Animated.sequence([
        // Optional: "Theme" pause
        Animated.delay(500),
        // Scale up effect
        Animated.timing(scale, {
          toValue: 20, // Explode effect
          duration: 900,
          // easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        // Fade out the container concurrently?
        // Let's just rely on the scaling revealing the app or fade out
      ]).start(() => {
        onAnimationFinish();
      });

      // Alternative: Fade out
      Animated.timing(animation, {
        toValue: 0, // goes to 0 opacity
        duration: 800,
        useNativeDriver: true,
      }).start(() => onAnimationFinish());
    };

    // We can't actually do two separate start() calls like that easily without race conditions.
    // Let's do a composed animation.

    // Modern "Zoom Out" into the app effect trying to be achieved.
    // Usually: Logo scales DOWN and fades out, or scales UP and fades out (through the "hole").

    // Let's go with a simple Fade Out for reliability, with a slight scale up of logo.

    SplashScreen.hideAsync().then(() => {
      playSound();

      Animated.sequence([
        Animated.delay(3000),
        Animated.parallel([
          Animated.timing(animation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onAnimationFinish();
      });
    });
  }, [triggerAnimation]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1], // We want to start at 1 and go to 0? No, wait.
            // If we use 'animation' for opacity, and we want to fade OUT.
            // Initial state should be visible (1).
            // But usually Animated.Value starts at 0.
            // Let's initialize Value to 1.
          }),
        },
      ]}
    >
      <Animated.Image
        source={require("../../assets/images/splash-icon.png")}
        style={[
          styles.image,
          {
            transform: [{ scale: scale }],
          },
        ]}
        resizeMode="contain"
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
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
  },
  image: {
    width: "70%", // Adjust based on splash-icon actual size relative to screen
    height: "70%",
  },
});

import { TrackReference, useLocalParticipant } from "@livekit/components-react";
import { BarVisualizer } from "@livekit/react-native";
import { useEffect, useState } from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ControlBarProps = {
  style?: StyleProp<ViewStyle>;
  options: ControlBarOptions;
};

type ControlBarOptions = {
  isMicEnabled: boolean;
  onMicClick: () => void;
  isCameraEnabled: boolean;
  onCameraClick: () => void;
  isScreenShareEnabled: boolean;
  onScreenShareClick: () => void;
  isChatEnabled: boolean;
  onChatClick: () => void;
  onExitClick: () => void;
};

export default function ControlBar({ style = {}, options }: ControlBarProps) {
  const { microphoneTrack, localParticipant } = useLocalParticipant();
  const [trackRef, setTrackRef] = useState<TrackReference | undefined>(
    undefined
  );

  useEffect(() => {
    if (microphoneTrack) {
      setTrackRef({
        participant: localParticipant,
        publication: microphoneTrack,
        source: microphoneTrack.source,
      });
    } else {
      setTrackRef(undefined);
    }
  }, [microphoneTrack, localParticipant]);

  // Icons
  const micIcon = options.isMicEnabled ? "mic" : "mic-off";
  const cameraIcon = options.isCameraEnabled ? "camera" : "camera-outline";
  const screenShareIcon = options.isScreenShareEnabled ? "desktop" : "desktop-outline";
  const chatIcon = options.isChatEnabled ? "chatbox" : "chatbox-outline";
  const exitIcon = "call";

  return (
    <View style={[style, styles.container]}>
      <TouchableOpacity
        style={[
          styles.button,
          options.isMicEnabled ? styles.enabledButton : undefined,
        ]}
        activeOpacity={0.7}
        onPress={() => options.onMicClick()}
      >
        <Ionicons name={micIcon} size={20} color="#CCCCCC" style={styles.icon} />
        <BarVisualizer
          barCount={3}
          trackRef={trackRef}
          style={styles.micVisualizer}
          options={{
            minHeight: 0.1,
            barColor: "#CCCCCC",
            barWidth: 2,
          }}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          options.isCameraEnabled ? styles.enabledButton : undefined,
        ]}
        activeOpacity={0.7}
        onPress={() => options.onCameraClick()}
      >
        <Ionicons name={cameraIcon} size={20} color="#CCCCCC" style={styles.icon} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          options.isScreenShareEnabled ? styles.enabledButton : undefined,
        ]}
        activeOpacity={0.7}
        onPress={() => options.onScreenShareClick()}
      >
        <Ionicons name={screenShareIcon} size={20} color="#CCCCCC" style={styles.icon} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          options.isChatEnabled ? styles.enabledButton : undefined,
        ]}
        activeOpacity={0.7}
        onPress={() => options.onChatClick()}
      >
        <Ionicons name={chatIcon} size={20} color="#CCCCCC" style={styles.icon} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={() => options.onExitClick()}
      >
        <Ionicons name={exitIcon} size={20} color="#CCCCCC" style={styles.icon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: 8,
    backgroundColor: "#070707",
    borderColor: "#202020",
    borderRadius: 53,
    borderWidth: 1,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    height: 44,
    padding: 10,
    marginHorizontal: 4,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  enabledButton: {
    backgroundColor: "#131313",
  },
  icon: {
    width: 20,
  },
  micVisualizer: {
    width: 20,
    height: 20,
  },
});

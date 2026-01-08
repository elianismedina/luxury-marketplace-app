import { Track } from "livekit-client";
import { VideoTrack, useParticipantTracks, useRoomContext } from "@livekit/react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

type AgentVisualizationProps = {
  style: StyleProp<ViewStyle>;
};

const useAgent = () => {
  const room = useRoomContext();
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Find the remote participant (agent)
  const remoteParticipant: any = useMemo(() => {
    const remotes = room.remoteParticipants;
    for (const p of remotes.values()) {
      return p; // Assuming only one remote participant
    }
    return null;
  }, [room.remoteParticipants]);

  useEffect(() => {
    const handleSpeaking = (speaking: boolean) => {
      console.log('agent isSpeaking:', speaking);
      setIsSpeaking(speaking);
    };
    if (remoteParticipant) {
      remoteParticipant.on('isSpeakingChanged', handleSpeaking);
      return () => remoteParticipant.off('isSpeakingChanged', handleSpeaking);
    } else {
      setIsSpeaking(false);
    }
  }, [remoteParticipant]);

  const agentIdentity = remoteParticipant?.identity || '';

  const microphoneTracks = useParticipantTracks([Track.Source.Microphone], agentIdentity);
  const cameraTracks = useParticipantTracks([Track.Source.Camera], agentIdentity);

  const microphoneTrack = microphoneTracks.length > 0 ? microphoneTracks[0] : undefined;
  const cameraTrack = cameraTracks.length > 0 ? cameraTracks[0] : undefined;

  return { microphoneTrack, cameraTrack, isSpeaking };
};

const barSize = 0.2;

export default function AgentVisualization({ style }: AgentVisualizationProps) {
  const room = useRoomContext();
  const { microphoneTrack, cameraTrack, isSpeaking } = useAgent();
  const [barHeights, setBarHeights] = useState([20, 20, 20, 20, 20, 20, 20]);

  useEffect(() => {
    console.log('microphoneTrack:', microphoneTrack, 'isSpeaking:', isSpeaking);
    if (microphoneTrack && isSpeaking) {
      const interval = setInterval(() => {
        setBarHeights(prev => prev.map(h => h === 20 ? 40 : 20));
      }, 400);
      return () => clearInterval(interval);
    } else {
      setBarHeights([20, 20, 20, 20, 20, 20, 20]);
    }
  }, [microphoneTrack, isSpeaking]);

  const connectionState = (room as any).connectionState;
  let statusColor = 'gray';
  if (connectionState === 'connected') statusColor = 'green';
  else if (connectionState === 'connecting' || connectionState === 'reconnecting') statusColor = 'yellow';
  else if (connectionState === 'disconnected') statusColor = 'red';
  else if (connectionState === 'disconnecting') statusColor = 'orange';

  const bars = barHeights.map((h, i) => (
    <View key={i} style={[styles.bar, { height: h }]} />
  ));

  let videoView = cameraTrack ? (
    <VideoTrack trackRef={cameraTrack} style={styles.videoTrack} />
  ) : null;

  return (
    <View style={[style, styles.container]}>
      <View style={styles.barVisualizerContainer}>
        <View style={styles.barsContainer}>
          {bars}
        </View>
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
      </View>
      {videoView}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  videoTrack: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  barVisualizerContainer: {
    width: "100%",
    height: 60,
    zIndex: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
  },
  barsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    height: "100%",
    paddingVertical: 10,
  },
  bar: {
    width: 4,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 3,
    borderRadius: 2,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  statusIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

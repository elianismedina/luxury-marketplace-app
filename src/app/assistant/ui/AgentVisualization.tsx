import { ConnectionState, Track } from "livekit-client";
import { VideoTrack, useParticipantTracks, useRoomContext } from "@livekit/react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

type AgentVisualizationProps = {
  style: StyleProp<ViewStyle>;
};

const useAgent = () => {
  const r = useRoomContext() as any;
  const room: any = r?.room;
  // Find the remote participant (agent)
  const agent: any = useMemo(() => {
    if (!room) return null;
    const remotes = room.remoteParticipants;
    for (const p of remotes.values()) {
      return p; // Assuming only one remote participant
    }
    return null;
  }, [room]);



  const agentIdentity = agent?.identity || '';

  const microphoneTracks = useParticipantTracks([Track.Source.Microphone], agentIdentity);
  const cameraTracks = useParticipantTracks([Track.Source.Camera], agentIdentity);

  const microphoneTrack = microphoneTracks.length > 0 ? microphoneTracks[0] : undefined;
  const cameraTrack = cameraTracks.length > 0 ? cameraTracks[0] : undefined;

  return { microphoneTrack, cameraTrack, agent };
};

const barSize = 0.2;

export default function AgentVisualization({ style }: AgentVisualizationProps) {
  const session = useRoomContext() as any;
  const room: any = session.room;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { microphoneTrack, cameraTrack, agent } = useAgent();
  const [barHeights, setBarHeights] = useState([20, 20, 20, 20, 20, 20, 20]);

  useEffect(() => {
    const handleSpeaking = (speaking: boolean) => {
      console.log('agent isSpeaking:', speaking);
      setIsSpeaking(speaking);
    };
    if (agent) {
      agent.on('isSpeakingChanged', handleSpeaking);
      return () => agent.off('isSpeakingChanged', handleSpeaking);
    } else {
      setIsSpeaking(false);
    }
  }, [agent]);

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

   let statusColor = 'red';
   let statusLabel = 'Disconnected';
   if (room) {
     const connectionState = room.state;
     console.log('connectionState:', connectionState, 'agent:', !!agent);
     statusLabel = connectionState ? connectionState.toString() : 'Unknown';
     if (agent) {
       statusColor = 'green';
       statusLabel = 'Agent Connected';
     } else if (connectionState === ConnectionState.Connected) {
       statusColor = 'yellow';
       statusLabel = 'Connected - Waiting for Agent';
     } else if (connectionState === ConnectionState.Connecting || connectionState === ConnectionState.Reconnecting) {
       statusColor = 'yellow';
       statusLabel = 'Connecting';
     } else if (connectionState === ConnectionState.Disconnected) {
       statusColor = 'red';
       statusLabel = 'Disconnected';
     }
   }

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
         <View style={styles.statusContainer}>
           <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
           <Text style={styles.statusText}>{statusLabel}</Text>
         </View>
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
   statusContainer: {
     position: 'absolute',
     top: 5,
     right: 5,
     flexDirection: 'row',
     alignItems: 'center',
   },
   statusIndicator: {
     width: 10,
     height: 10,
     borderRadius: 5,
     marginRight: 5,
   },
   statusText: {
     color: 'white',
     fontSize: 12,
   },
});

import { View, Text, Platform, TouchableOpacity, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { useConnection } from "@/hooks/useConnection";
import AgentVisualization from "@/app/assistant/ui/AgentVisualization";
import ChatBar from "@/app/assistant/ui/ChatBar";
import ChatLog from "@/app/assistant/ui/ChatLog";
import ControlBar from "@/app/assistant/ui/ControlBar";

export default function SearchScreen() {
  const { isConnectionActive, isConfigured, connect, disconnect, messages, sendMessage } = useConnection();
  const [chatValue, setChatValue] = useState("");

  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);
  const [isChatEnabled, setIsChatEnabled] = useState(true);



  const handleChatSend = async (text: string) => {
    if (text.trim() && isConnectionActive) {
      await sendMessage(text.trim());
    }
    setChatValue("");
  };

  const controlBarOptions = {
    isMicEnabled,
    onMicClick: () => setIsMicEnabled(!isMicEnabled),
    isCameraEnabled,
    onCameraClick: () => setIsCameraEnabled(!isCameraEnabled),
    isScreenShareEnabled,
    onScreenShareClick: () => setIsScreenShareEnabled(!isScreenShareEnabled),
    isChatEnabled,
    onChatClick: () => setIsChatEnabled(!isChatEnabled),
    isConnected: isConnectionActive,
    onExitClick: async () => {

      if (isConnectionActive) {

        disconnect();

      } else {

        connect();

      }

    },
  };

  
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <AgentVisualization style={{ flex: 1 }} />
      <ChatLog style={{ flex: 2 }} messages={messages} />
      <ChatBar
        style={{ marginBottom: 16 }}
        value={chatValue}
        onChangeText={setChatValue}
        onChatSend={handleChatSend}
      />
      <ControlBar style={{ marginBottom: 16 }} options={controlBarOptions} />
    </View>
  );
}

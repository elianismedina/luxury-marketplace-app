import { View, Text, Platform, TouchableOpacity } from "react-native";
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
    if (text.trim()) {
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
    onExitClick: () => disconnect(),
  };

  console.log("About to render, platform:", Platform.OS);
  return (
    <View style={{ flex: 1, padding: 16 }}>
      {!isConnectionActive ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, marginBottom: 20 }}>AI Voice Assistant</Text>
          <Text style={{ textAlign: 'center', marginBottom: 30 }}>
            Connect to start a voice conversation with the AI agent
          </Text>
          <TouchableOpacity
            onPress={() => {
              console.log("Connect button pressed");
              connect();
            }}
            disabled={!isConfigured}
            style={{
              backgroundColor: isConfigured ? '#007AFF' : '#CCC',
              paddingHorizontal: 30,
              paddingVertical: 15,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>
              {isConfigured ? "Connect to Assistant" : "Assistant Not Configured"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <AgentVisualization style={{ flex: 1 }} />
          <ChatLog style={{ flex: 2 }} messages={messages} />
          <ChatBar
            style={{ marginBottom: 16 }}
            value={chatValue}
            onChangeText={setChatValue}
            onChatSend={handleChatSend}
          />
          <ControlBar style={{ marginBottom: 16 }} options={controlBarOptions} />
        </>
      )}
    </View>
  );
}

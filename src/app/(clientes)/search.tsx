import { View } from "react-native";
import { useState } from "react";
import { ReceivedMessage } from "@livekit/components-react";
import { useConnection } from "@/hooks/useConnection";
import AgentVisualization from "@/app/assistant/ui/AgentVisualization";
import ChatBar from "@/app/assistant/ui/ChatBar";
import ChatLog from "@/app/assistant/ui/ChatLog";
import ControlBar from "@/app/assistant/ui/ControlBar";

export default function SearchScreen() {
  const { isConnectionActive, connect, disconnect } = useConnection();
  const [chatValue, setChatValue] = useState("");
  const [messages, setMessages] = useState<ReceivedMessage[]>([]);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);
  const [isChatEnabled, setIsChatEnabled] = useState(true);

  const handleChatSend = (text: string) => {
    // Add message logic here
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

import {
  BodyText,
  Column,
  Container,
  Input,
  PrimaryButton,
  Row,
  SecondaryButton,
} from "@/components/styled";
import type { ConversationStatus } from "@elevenlabs/react-native";
import { useConversation } from "@elevenlabs/react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";
import { useTheme } from "styled-components/native";
import { changeBrightness, flashScreen, getBatteryLevel } from "./utils/tools";

const ConversationScreen = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const conversation = useConversation({
    clientTools: {
      getBatteryLevel,
      changeBrightness,
      flashScreen,
    },
    onConnect: ({ conversationId }: { conversationId: string }) => {
      console.log("✅ Connected to conversation", conversationId);
    },
    onDisconnect: (details: any) => {
      console.log("❌ Disconnected from conversation", details);
    },
    onError: (message: string, context?: Record<string, unknown>) => {
      console.error("❌ Conversation error:", message, context);
    },
    onMessage: (payload: any) => {
      const { message, source } = payload;
      console.log(`💬 Message from ${source}:`, message);
    },
    onModeChange: ({ mode }: { mode: "speaking" | "listening" }) => {
      console.log(`🔊 Mode: ${mode}`);
    },
  });

  const [isStarting, setIsStarting] = useState(false);
  const [textInput, setTextInput] = useState("");

  const handleSubmitText = () => {
    if (textInput.trim()) {
      conversation.sendUserMessage(textInput.trim());
      setTextInput("");
      Keyboard.dismiss();
    }
  };

  const endConversation = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
  };

  const getStatusColor = (status: ConversationStatus): string => {
    switch (status) {
      case "connected":
        return "#10B981";
      case "connecting":
        return "#F59E0B";
      case "disconnected":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: ConversationStatus): string => {
    return status[0].toUpperCase() + status.slice(1);
  };

  const canStart = conversation.status === "disconnected" && !isStarting;
  const canEnd = conversation.status === "connected";

  return (
    <Container>
      <Column gap={8}>
        <Input
          value={textInput}
          onChangeText={(text: string) => {
            setTextInput(text);
            if (text.length > 0) {
              conversation.sendUserActivity();
            }
          }}
          placeholder={t(
            "search.input_placeholder",
            "Escribe tu mensaje o contexto... (Presiona Enter para enviar)"
          )}
          multiline
          onSubmitEditing={handleSubmitText}
          returnKeyType="send"
          blurOnSubmit={true}
        />
        <Row gap={16}>
          <PrimaryButton
            onPress={handleSubmitText}
            disabled={!textInput.trim()}
          >
            <BodyText color="#fff">
              💬 {t("search.send", "Enviar Mensaje")}
            </BodyText>
          </PrimaryButton>
          <SecondaryButton
            onPress={() => {
              if (textInput.trim()) {
                conversation.sendContextualUpdate(textInput.trim());
                setTextInput("");
                Keyboard.dismiss();
              }
            }}
            disabled={!textInput.trim()}
          >
            <BodyText color="#fff">
              📝 {t("search.send_context", "Enviar Contexto")}
            </BodyText>
          </SecondaryButton>
        </Row>
      </Column>
    </Container>
  );
};

export default ConversationScreen;

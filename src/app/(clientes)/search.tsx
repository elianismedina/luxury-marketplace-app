import {
  BodyText,
  Column,
  Container,
  PrimaryButton,
  Row,
  SecondaryButton,
} from "@/components/styled";
import type { ConversationStatus } from "@elevenlabs/react-native";
import { useConversation } from "@elevenlabs/react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { PermissionsAndroid, Platform } from "react-native";

import styled, { useTheme } from "styled-components/native";

import { changeBrightness, flashScreen, getBatteryLevel } from "./utils/tools";

import type { DefaultTheme } from "styled-components";

const ConversationScreen = () => {
  // Request microphone permission (Android)
  const requestMicPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message:
              "This app needs access to your microphone so you can talk to the AI.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("You can use the microphone");
          return true;
        } else {
          console.log("Microphone permission denied");
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };
  const theme = useTheme();
  const { t } = useTranslation();
  const conversation = useConversation({
    clientTools: {
      getBatteryLevel,
      changeBrightness,
      flashScreen,
    },
    onConnect: ({ conversationId }: { conversationId: string }) => {
      setAgentStatus("connected");
      setAgentMode(undefined);
      console.log("✅ Connected to conversation", conversationId);
    },
    onDisconnect: (details: any) => {
      setAgentStatus("disconnected");
      setAgentMode(undefined);
      console.log("❌ Disconnected from conversation", details);
    },
    onError: (message: string, context?: Record<string, unknown>) => {
      setAgentStatus("disconnected");
      setAgentMode(undefined);
      console.error("❌ Conversation error:", message, context);
    },
    onMessage: (payload: any) => {
      const { message, source } = payload;
      console.log(`💬 Message from ${source}:`, message);
    },
    onModeChange: ({ mode }: { mode: "speaking" | "listening" }) => {
      setAgentMode(mode);
      setAgentStatus("connected");
      console.log(`🔊 Mode: ${mode}`);
    },
  });

  // Estado local sincronizado con el agente
  const [agentStatus, setAgentStatus] = useState<ConversationStatus>(
    conversation.status
  );
  const [agentMode, setAgentMode] = useState<
    "speaking" | "listening" | undefined
  >(undefined);

  // Sincroniza el estado local con el status del hook
  React.useEffect(() => {
    setAgentStatus(conversation.status);
  }, [conversation.status]);

  const [isStarting, setIsStarting] = useState(false);

  const endConversation = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
  };

  const getStatusColor = (
    status: ConversationStatus | "speaking" | "listening"
  ): string => {
    switch (status) {
      case "connected":
        return "#10B981";
      case "connecting":
        return "#F59E0B";
      case "disconnected":
        return "#EF4444";
      case "speaking":
        return "#2563eb";
      case "listening":
        return "#f43f5e";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: ConversationStatus): string => {
    return status[0].toUpperCase() + status.slice(1);
  };

  const canStart = agentStatus === "disconnected" && !isStarting;
  const canEnd =
    ["connected", "speaking", "listening"].includes(agentStatus) ||
    Boolean(agentMode);
  const statusColor = getStatusColor(agentMode ? agentMode : agentStatus);
  const statusText = agentMode
    ? agentMode[0].toUpperCase() + agentMode.slice(1)
    : getStatusText(agentStatus);

  return (
    <Container>
      <Column gap={8}>
        <Row style={{ alignItems: "center", marginBottom: theme.spacing.sm }}>
          <StatusDot color={statusColor} />
          <BodyText
            style={{ marginLeft: 8 }}
            color={theme.colors.textSecondary}
          >
            {statusText}
          </BodyText>
        </Row>
        <Row gap={16}>
          <PrimaryButton
            onPress={async () => {
              setIsStarting(true);
              try {
                const hasPermission = await requestMicPermission();
                if (!hasPermission) {
                  setIsStarting(false);
                  return;
                }
                await conversation.startSession({
                  agentId: process.env.EXPO_PUBLIC_AGENT_ID,
                  dynamicVariables: { platform: Platform.OS },
                });
              } catch (error) {
                console.error("Failed to start conversation:", error);
              } finally {
                setIsStarting(false);
              }
            }}
            disabled={!canStart}
          >
            <BodyText color="#fff">
              {isStarting
                ? t("search.starting", "Iniciando...")
                : t("search.start", "Iniciar Conversación")}
            </BodyText>
          </PrimaryButton>
          <SecondaryButton onPress={endConversation} disabled={!canEnd}>
            <BodyText
              color={
                canEnd
                  ? theme.colors.textOnSecondary
                  : theme.colors.textDisabled
              }
            >
              {t("search.end", "Finalizar Conversación")}
            </BodyText>
          </SecondaryButton>
        </Row>
      </Column>
    </Container>
  );
};

interface StatusDotProps {
  color: string;
  theme: DefaultTheme;
}

const StatusDot = styled.View<StatusDotProps>`
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background-color: ${(props: StatusDotProps) => props.color};
  border: 2px solid ${(props: StatusDotProps) => props.theme.colors.background};
`;

export default ConversationScreen;

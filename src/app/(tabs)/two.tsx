import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { IconButton, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "styled-components/native";

type Message = {
  role: "user" | "assistant";
  content: string;
  imageUri?: string;
};

export default function TabTwoScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permisos necesarios",
        "Necesitamos acceso a tus fotos para adjuntar imágenes."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const handleSearch = () => {
    if (!searchQuery.trim() && !selectedImage) return;

    // Agregar mensaje del usuario
    const newMessages: Message[] = [
      ...messages,
      {
        role: "user" as const,
        content: searchQuery || "Imagen adjunta",
        imageUri: selectedImage || undefined,
      },
    ];
    setMessages(newMessages);
    setSearchQuery("");
    setSelectedImage(null);

    // TODO: Aquí se integrará la búsqueda real de productos/servicios
    // Por ahora, respuesta simulada
    setTimeout(() => {
      setMessages([
        ...newMessages,
        {
          role: "assistant" as const,
          content:
            "Estoy buscando en nuestro catálogo... (funcionalidad en desarrollo)",
        },
      ]);
    }, 500);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <View style={styles.content}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="headlineMedium" style={styles.emptyTitle}>
                ¿Qué estás buscando?
              </Text>
              <Text variant="bodyLarge" style={styles.emptySubtitle}>
                Pregunta por repuestos, servicios o accesorios para tu vehículo
              </Text>
              <View style={styles.suggestions}>
                <Text variant="labelSmall" style={styles.suggestionLabel}>
                  Ejemplos:
                </Text>
                <Text variant="bodyMedium" style={styles.suggestion}>
                  • "Necesito llantas para un BMW 2020"
                </Text>
                <Text variant="bodyMedium" style={styles.suggestion}>
                  • "Busco aceite sintético 5W-30"
                </Text>
                <Text variant="bodyMedium" style={styles.suggestion}>
                  • "¿Dónde puedo hacer mantenimiento?"
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.messagesContainer}>
              {messages.map((message, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageBubble,
                    message.role === "user"
                      ? styles.userBubble
                      : styles.assistantBubble,
                  ]}
                >
                  {message.imageUri && (
                    <Image
                      source={{ uri: message.imageUri }}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  )}
                  <Text
                    style={
                      message.role === "user"
                        ? styles.userText
                        : styles.assistantText
                    }
                  >
                    {message.content}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <IconButton icon="close" size={16} iconColor="#fff" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <IconButton
              icon="plus"
              size={24}
              onPress={pickImage}
              style={styles.attachButton}
              iconColor={theme.colors.primary}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Escribe tu búsqueda..."
              mode="outlined"
              style={styles.input}
              multiline
              maxLength={500}
              onSubmitEditing={handleSearch}
              outlineColor={theme.colors.border}
              activeOutlineColor={theme.colors.primary}
              right={
                <TextInput.Icon
                  icon="send"
                  onPress={handleSearch}
                  disabled={!searchQuery.trim() && !selectedImage}
                  forceTextInputFocus={false}
                  color={
                    searchQuery.trim() || selectedImage
                      ? theme.colors.primary
                      : theme.colors.textDisabled
                  }
                />
              }
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    color: "#0055D4",
  },
  emptySubtitle: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 32,
  },
  suggestions: {
    alignSelf: "stretch",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    gap: 8,
    borderWidth: 2,
    borderColor: "#0055D4",
  },
  suggestionLabel: {
    fontWeight: "600",
    color: "#0055D4",
    marginBottom: 4,
  },
  suggestion: {
    color: "#374151",
    lineHeight: 24,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#FF0000",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  userText: {
    color: "#fff",
    fontSize: 16,
  },
  assistantText: {
    color: "#1f2937",
    fontSize: 16,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  attachButton: {
    margin: 0,
    backgroundColor: "#f3f4f6",
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    maxHeight: 120,
  },
  imagePreviewContainer: {
    position: "relative",
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  messageImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
});

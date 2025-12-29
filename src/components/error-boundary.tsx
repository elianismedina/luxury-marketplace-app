import React from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import styled, { DefaultTheme } from "styled-components/native";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export function ErrorBoundary({ children }: React.PropsWithChildren<object>) {
  const [state, setState] = React.useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
  });

  const handleReload = () => {
    setState({ hasError: false, error: null });
  };

  // Error boundary logic using useEffect for demonstration (not as robust as class-based)
  React.useEffect(() => {
    const errorHandler = (error: Error) => {
      setState({ hasError: true, error });
      if (__DEV__) {
        console.error("ErrorBoundary caught an error:", error);
      }
    };
    // Listen for unhandled errors
    const onError = (event: ErrorEvent) => {
      errorHandler(event.error);
    };
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("error", onError);
    };
  }, []);

  if (state.hasError) {
    return (
      <Container>
        <Text variant="titleLarge" style={{ marginBottom: 12 }}>
          Oops! Something went wrong.
        </Text>
        <Text variant="bodyMedium" style={{ marginBottom: 24 }}>
          {state.error?.message ||
            "An unexpected error occurred. Please try again."}
        </Text>
        <Button mode="contained" onPress={handleReload}>
          Reload
        </Button>
      </Container>
    );
  }
  return <>{children}</>;
}

const Container = styled(View)<{ theme: DefaultTheme }>`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 32px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;

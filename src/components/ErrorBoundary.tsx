import React from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import styled, { DefaultTheme } from "styled-components/native";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<object>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<object>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // You can log error info here or send to a service
    if (__DEV__) {
      console.error("ErrorBoundary caught an error:", error, info);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    // Optionally reload the app or navigate to a safe screen
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <Text variant="titleLarge" style={{ marginBottom: 12 }}>
            Oops! Something went wrong.
          </Text>
          <Text variant="bodyMedium" style={{ marginBottom: 24 }}>
            {this.state.error?.message ||
              "An unexpected error occurred. Please try again."}
          </Text>
          <Button mode="contained" onPress={this.handleReload}>
            Reload
          </Button>
        </Container>
      );
    }
    return this.props.children;
  }
}
const Container = styled(View)<{ theme: DefaultTheme }>`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 32px;
  background-color: ${({ theme }: { theme: DefaultTheme }) =>
    theme.colors.background};
`;

export default ErrorBoundary;

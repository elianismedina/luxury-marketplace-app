import { AuthProvider } from "@/context/AuthContext";
import { paperDarkTheme } from "@/theme/paperTheme";
import { theme } from "@/theme/theme";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider as StyledThemeProvider } from "styled-components/native";
import SignInScreen from "../(auth)/sign-in";

jest.useFakeTimers();

// Mock native modules
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock")
);

const mockCreate = jest.fn();
const mockSetActive = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock("@clerk/clerk-expo", () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: {
      create: mockCreate,
    },
    setActive: mockSetActive,
  }),
  useAuth: () => ({
    isLoaded: true,
    userId: "test-user-id",
    signOut: jest.fn(),
  }),
  useUser: () => ({
    isLoaded: true,
    user: null,
  }),
  useSignUp: () => ({
    isLoaded: true,
    signUp: {},
    setActive: jest.fn(),
  }),
  useOAuth: () => ({
    startOAuthFlow: jest.fn(),
  }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
  Link: (props: any) => {
    const { View, Text } = require("react-native");
    return (
      <View onPress={props.onPress}>
        {props.children ?? <Text>{props.href}</Text>}
      </View>
    );
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("@/components/Logo", () => {
   
  const { View } = require("react-native");
  const MockLogo = () => <View testID="mock-logo" />;
  MockLogo.displayName = "MockLogo";
  return MockLogo;
});

jest.mock("@/components/DynamicSvgIcon", () => {
    
  const { View } = require("react-native");
  const MockSvgIcon = (props: any) => (
    <View {...props} testID="mock-svg-icon" />
  );
  MockSvgIcon.displayName = "MockSvgIcon";
  return MockSvgIcon;
});

jest.mock("@/components/GoogleSvgIcon", () => {
  const { View } = require("react-native");
  const MockGoogleSvgIcon = (props: any) => (
    <View {...props} testID="mock-google-svg-icon" />
  );
  MockGoogleSvgIcon.displayName = "MockGoogleSvgIcon";
  return MockGoogleSvgIcon;
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <AuthProvider>
        <StyledThemeProvider theme={theme}>
          <PaperProvider theme={paperDarkTheme}>{component}</PaperProvider>
        </StyledThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

describe("SignIn Screen", () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockSetActive.mockClear();
    mockRouterReplace.mockClear();
    // Mock successful sign-in by default
    mockCreate.mockResolvedValue({
      status: "complete",
      createdSessionId: "sess_12345",
    });
  });

  it("renders correctly", () => {
    const { getByPlaceholderText, getByTestId } = renderWithProviders(
      <SignInScreen />
    );

    expect(getByPlaceholderText("auth.email_placeholder")).toBeTruthy();
    expect(getByPlaceholderText("auth.password_placeholder")).toBeTruthy();
    expect(getByTestId("sign-in-button")).toBeTruthy();
  });

  it("handles successful sign-in", async () => {
    const { getByPlaceholderText, getByTestId } = renderWithProviders(
      <SignInScreen />
    );

    const emailInput = getByPlaceholderText("auth.email_placeholder");
    const passwordInput = getByPlaceholderText("auth.password_placeholder");
    const signInButton = getByTestId("sign-in-button");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        identifier: "test@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(mockSetActive).toHaveBeenCalledWith({ session: "sess_12345" });
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/");
    });
  });

  it("handles failed sign-in", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Invalid credentials"));
    const { getByPlaceholderText, getByTestId } = renderWithProviders(
      <SignInScreen />
    );

    const emailInput = getByPlaceholderText("auth.email_placeholder");
    const passwordInput = getByPlaceholderText("auth.password_placeholder");
    const signInButton = getByTestId("sign-in-button");

    fireEvent.changeText(emailInput, "wrong@example.com");
    fireEvent.changeText(passwordInput, "wrongpassword");
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        identifier: "wrong@example.com",
        password: "wrongpassword",
      });
    });

    await waitFor(() => {
      expect(mockSetActive).not.toHaveBeenCalled();
      expect(mockRouterReplace).not.toHaveBeenCalled();
    });
  });

  it("toggles remember me checkbox", () => {
    const { getByText } = renderWithProviders(<SignInScreen />);
    const checkboxLabel = getByText("auth.remember_me");

    fireEvent.press(checkboxLabel);

    // We can't easily check the internal state, but we ensure the press doesn't crash.
  });
});

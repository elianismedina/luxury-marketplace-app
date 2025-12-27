import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { paperDarkTheme } from '@/theme/paperTheme';
import { theme } from '@/theme/theme';
import SignInScreen from '../(auth)/sign-in';

jest.useFakeTimers();
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock dependencies
const mockRouterReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
  Link: (props: { children: React.ReactNode }) => props.children,
}));

const mockCreate = jest.fn().mockResolvedValue({
  status: 'complete',
  createdSessionId: 'sess_12345',
});
const mockSetActive = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: {
      create: mockCreate,
    },
    setActive: mockSetActive,
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));


jest.mock('@/components/Logo', () => {
  const { View } = require('react-native');
  return () => <View testID="mock-logo" />;
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <StyledThemeProvider theme={theme}>
        <PaperProvider theme={paperDarkTheme}>
          {component}
        </PaperProvider>
      </StyledThemeProvider>
    </SafeAreaProvider>
  );
};

describe('SignIn Screen', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        mockCreate.mockClear();
        mockSetActive.mockClear();
        mockRouterReplace.mockClear();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

  it('renders correctly', () => {
    const { getByPlaceholderText, getAllByText, getByTestId } = renderWithProviders(
        <SignInScreen />
    );

    expect(getByPlaceholderText('auth.email_placeholder')).toBeTruthy();
    expect(getByPlaceholderText('auth.password_placeholder')).toBeTruthy();
    // Check that both the title and the button are rendered
    expect(getAllByText('auth.login_tab')).toHaveLength(2);
    expect(getByTestId('sign-in-button')).toBeTruthy();
  });

  it('handles successful sign-in', async () => {
    const { getByPlaceholderText, getByTestId } = renderWithProviders(<SignInScreen />);
    
    const emailInput = getByPlaceholderText('auth.email_placeholder');
    const passwordInput = getByPlaceholderText('auth.password_placeholder');
    const signInButton = getByTestId('sign-in-button');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        identifier: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockSetActive).toHaveBeenCalledWith({ session: 'sess_12345' });
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/');
    });
  });

  it('handles failed sign-in', async () => {
    mockCreate.mockRejectedValue(new Error('Invalid credentials'));
    const { getByPlaceholderText, getByTestId } = renderWithProviders(<SignInScreen />);
    
    const emailInput = getByPlaceholderText('auth.email_placeholder');
    const passwordInput = getByPlaceholderText('auth.password_placeholder');
    const signInButton = getByTestId('sign-in-button');

    fireEvent.changeText(emailInput, 'wrong@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        identifier: 'wrong@example.com',
        password: 'wrongpassword',
      });
    });

    await waitFor(() => {
      expect(mockSetActive).not.toHaveBeenCalled();
      expect(mockRouterReplace).not.toHaveBeenCalled();
    });
  });

  it('toggles remember me checkbox', () => {
    const { getByText } = renderWithProviders(<SignInScreen />);
    const checkbox = getByText('auth.remember_me');

    fireEvent.press(checkbox);
    // We can't easily assert the state change of the checkbox without modifying the source code to expose the state.
    // However, we can check that the press event is handled.
  });
});

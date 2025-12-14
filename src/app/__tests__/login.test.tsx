import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AuthScreen from '../login';

jest.mock('@/components/Logo', () => jest.fn());
jest.mock('@/lib/appwrite', () => jest.fn());
jest.mock('@expo/vector-icons');

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    initializing: false,
    loading: false,
    isConfigured: true,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    recoverPassword: jest.fn(),
    loginWithGoogle: jest.fn(),
  }),
}));

import { SafeAreaProvider } from 'react-native-safe-area-context';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      {ui}
    </SafeAreaProvider>
  );
};

describe('AuthScreen', () => {
  it('renders correctly', () => {
    const { getByTestId, getByPlaceholderText } = renderWithProviders(<AuthScreen />);

    expect(getByTestId('login-button')).toBeTruthy();
    expect(getByPlaceholderText('tu@correo.com')).toBeTruthy();
    expect(getByPlaceholderText('Mínimo 8 caracteres')).toBeTruthy();
  });

  it('allows entering email and password', () => {
    const { getByPlaceholderText } = renderWithProviders(<AuthScreen />);

    const emailInput = getByPlaceholderText('tu@correo.com');
    const passwordInput = getByPlaceholderText('Mínimo 8 caracteres');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    expect(emailInput.props.value).toBe('test@example.com');
    expect(passwordInput.props.value).toBe('password123');
  });
});

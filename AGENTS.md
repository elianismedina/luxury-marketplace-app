# AGENTS Instructions

## 1. Build & Development

- Install dependencies:
  ```bash
  npm install
  ```
- Start Metro/Expo dev server:
  ```bash
  npm start
  ```
- Run on Android emulator:
  ```bash
  npm run android
  ```
- Run on iOS simulator (macOS only):
  ```bash
  npm run ios
  ```
- Run in web browser:
  ```bash
  npm run web
  ```

## 2. Linting & Formatting

- Run ESLint via Expo config:
  ```bash
  npm run lint
  ```
- Auto-fix lint issues:
  ```bash
  npm run lint -- --fix
  ```
- ESLint config at `eslint.config.js`, extends `eslint-config-expo/flat`

## 3. Type Checking

- TypeScript strict mode is enabled (see `tsconfig.json`)
- Run compiler without emit:
  ```bash
  npx tsc --noEmit
  ```

## 4. Testing

- Run all tests:
  ```bash
  npm test
  ```
- Run a single test file:
  ```bash
  npm test -- src/path/to/testfile.test.tsx
  ```
- Run tests matching name pattern:
  ```bash
  npm test -- -t "YourTestName"
  ```
- Run tests in watch mode:
  ```bash
  npm test -- --watch
  ```
- Jest config at `jest.config.js`, preset `jest-expo`

## 5. Import Aliases

- Use `@/*` alias for imports from `src/` (configured in `tsconfig.json`)
- Avoid deep relative paths (e.g. `../../components/...`)

## 6. Code Style Guidelines

### 6.1 File-Based Routing

- All routes live under `src/app/`
- Use grouping folders with parentheses: `(tabs)`, `(auth)`, `(registro-aliado)` etc.
- `_layout.tsx` files define navigation structure and providers

### 6.2 Styling & Theming

- **Never use inline styles or `StyleSheet.create`.**
- All UI uses styled-components from `src/components/styled.ts`
- Triple theme system:
  1. React Navigation theme
  2. React Native Paper theme
  3. styled-components theme
- Access themes via:
  ```tsx
  import { useTheme as useStyledTheme } from 'styled-components/native';
  import { useTheme as usePaperTheme } from 'react-native-paper';
  ```

### 6.3 Components & Hooks

- React components: PascalCase, filename matches component name
- Screen files (routes): kebab-case (`reset-password.tsx`, `sign-up.tsx`)
- Hooks: prefix with `use`, camelCase (e.g. `useAuthForm`)
- Context providers: suffix `Context` (e.g. `AuthContext.tsx`), expose `useAuth()` hook

### 6.4 Naming Conventions

- Types & interfaces: PascalCase (e.g. `UserProfile`, `AuthTokens`)
- Variables & functions: camelCase
- Constants: UPPER_CASE or camelCase for config data (e.g. `EXPO_PUBLIC_APPWRITE_ENDPOINT`, `brands`)

### 6.5 Error Handling

- Use `ErrorBoundary` component (`src/components/error-boundary.tsx`) for UI-level errors
- Wrap async operations in `try/catch`, handle or rethrow with contextual message
- Log unexpected errors via `console.error` or a telemetry service
- Never leave uncaught promise rejections

### 6.6 State & Context

- Centralize auth logic in `src/context/AuthContext.tsx`
- Access via `const { user, login, logout } = useAuth();`
- Avoid prop-drilling; use Context or hooks for shared state

### 6.7 Testing Patterns

- Place tests in `__tests__` folders adjacent to code
- Use `@testing-library/react-native` for component tests
- Mock external modules under `__mocks__`
- Import modules via aliases (`@/components/MyComponent`)

## 7. Copilot Instructions

```markdown
# Copilot Instructions for Luxury Marketplace

## Essential Project Overview

This is a cross-platform (iOS/Android/Web) marketplace app using **Expo Router** (file-based routing), **React Native Paper** (Material Design 3), **styled-components** (strictly no inline styles), and **Appwrite** (backend). React Native's new architecture is enabled. All navigation, theming, and data flows are tightly integrated with these technologies.

## Architecture & Key Patterns

### File-Based Routing (Expo Router)

- All routes are in `src/app/`.
- Authenticated screens: in `(tabs)/` group. Public screens: `welcome.tsx`, `login.tsx`.
- `_layout.tsx` files define navigation structure and providers.
- `unstable_settings.initialRouteName` in `src/app/_layout.tsx` sets the default route.

### Triple Theme System (Critical)

**Never use inline styles.** All custom UI must use styled-components from `src/components/styled.ts`.

Three theme systems are always active:

1. **React Navigation Theme**: Navigation bars/headers
2. **React Native Paper Theme**: Paper components (Button, TextInput, etc.)
3. **styled-components Theme**: All custom UI (see `src/theme/theme.ts`)

**Access patterns:**

- Use `useTheme` from `styled-components/native` for custom components
- Use `useTheme` from `react-native-paper` for Paper components
- Providers are nested in `src/app/_layout.tsx`: `StyledThemeProvider` → `PaperProvider` → `AuthProvider` → `ThemeProvider`

### Styled Components Pattern

- **All custom UI uses styled-components** (see `src/components/styled.ts`).
- Never use inline styles or StyleSheet.create.
- Example:
  ```tsx
  import { Card, Title } from "@/components/styled";
  import { useTheme } from "styled-components/native";
  const theme = useTheme();
  <Card elevated>
    <Title color={theme.colors.primary}>Heading</Title>
  </Card>;
  ```
- Key components: `Container`, `Card`, `Title`, `BodyText`, `PrimaryButton`, `Input`, etc.

### Authentication & AuthContext

- Centralized in `src/context/AuthContext.tsx` (see methods: `login`, `register`, `logout`, `refresh`, `loginWithGoogle`, etc.)
- `initializing` prevents UI flicker on load
- Authenticated routes: in `(tabs)/` (redirect to `/login` if not authenticated)
- Public routes: `welcome.tsx`, `login.tsx` (redirect to `/(tabs)` if already authenticated)

### OAuth & Appwrite Integration (Platform-Specific)

- **OAuth flow is different for web and native.**
  - Web: `account.createOAuth2Session()` (full-page redirect)
  - Native: Uses `expo-web-browser` and custom app scheme
- Callback handled in `src/app/auth/callback.tsx` (waits, refreshes user, then navigates)
- See `MOBILE_OAUTH_SETUP.md`, `GOOGLE_OAUTH_SETUP.md`, `OAUTH_TROUBLESHOOTING.md` for troubleshooting and setup
- Appwrite SDK is platform-aware (see `src/lib/appwrite.ts`):
  ```tsx
  const isWeb = Platform.OS === "web";
  if (isWeb) require("appwrite");
  else require("react-native-appwrite");
  ```

**Environment variables:** Always check `isAppwriteConfigured` before any Appwrite operation. Key env vars: `EXPO_PUBLIC_APPWRITE_ENDPOINT`, `EXPO_PUBLIC_APPWRITE_PROJECT_ID`, etc.

### Clerk Authentication

This project uses Clerk for Authentication.

## 8. Cursor Rules

- No cursor rules detected (no `.cursor/rules/` or `.cursorrules` files)

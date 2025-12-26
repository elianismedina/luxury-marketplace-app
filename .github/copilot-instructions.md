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

### Data Management & Storage

- All CRUD uses Appwrite databases/storage (see `src/lib/appwrite.ts`).
- Image upload: use Expo ImagePicker, upload to Appwrite Storage, store file ID in DB (see `edit-vehicle.tsx`).

### Import Aliases

- Use `@/*` for all imports from `src/` (see `tsconfig.json` paths).

## Developer Workflow

### Running the App

```bash
npm start          # Expo dev server
npm run android    # Android emulator
npm run ios        # iOS simulator (macOS only)
npm run web        # Web browser
```

**Expo Go has OAuth limitations** – use EAS/dev builds for full OAuth testing.

### Project Structure

- Components: `src/components/` (all custom UI in `styled.ts`)
- Screens: `src/app/` (file-based routing)
- Context: `src/context/` (auth only)
- Theme: `src/theme/`
- Constants: `src/constants/`
- Assets: `assets/`
- Lib: `src/lib/` (Appwrite integration)

### TypeScript

- Strict mode is enabled
- Expo typed routes (`experiments.typedRoutes: true`)
- Use `expo-env.d.ts` for Expo types
- styled-components types extended in `src/theme/theme.ts`

## Key Files

- `src/app/_layout.tsx`: Root layout/providers
- `src/context/AuthContext.tsx`: Auth logic
- `src/lib/appwrite.ts`: Appwrite SDK/platform logic
- `src/theme/theme.ts`: Theme definition
- `src/components/styled.ts`: All styled-components
- `app.json`: Expo config
- `MOBILE_OAUTH_SETUP.md`, `GOOGLE_OAUTH_SETUP.md`, `OAUTH_TROUBLESHOOTING.md`: OAuth setup/troubleshooting

## Common Tasks

### Add Authenticated Screen

1. Create in `src/app/(tabs)/screenname.tsx`
2. Use styled-components from `@/components/styled`
3. Add `<Tabs.Screen>` in `src/app/(tabs)/_layout.tsx`
4. Access user: `const { user } = useAuth()`

### Add Public Screen

1. Create in `src/app/screenname.tsx`
2. Add `<Stack.Screen>` in `src/app/_layout.tsx`
3. Redirect if authenticated: `if (user) router.replace("/(tabs)")`

### Theming

- Only use styled-components or Paper components (never inline styles)
- Access theme: `const theme = useTheme()` from `styled-components/native`
- Use theme values: `theme.colors.primary`, `theme.spacing.md`, etc.

### OAuth Debugging

1. See `OAUTH_TROUBLESHOOTING.md` for 401 errors
2. Check Appwrite/Google Console platform configs
3. Enable logs in `AuthContext.tsx` if needed
4. Test web first, then mobile

### Mock Data

- `assets/data/products.ts` is legacy, not used in main features

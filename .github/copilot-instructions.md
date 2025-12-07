# Copilot Instructions for Luxury Marketplace

## Project Overview

Luxury marketplace mobile app built with **Expo Router** (file-based routing), **React Native Paper** (Material Design 3), and **Appwrite** (backend-as-a-service). Targets iOS, Android, and Web platforms.

## Architecture & Key Patterns

### File-Based Routing (Expo Router)

- Routes live in `src/app/` directory
- `(tabs)/` = tab navigator group (authenticated screens)
- `_layout.tsx` files define nested navigation layouts
- `welcome.tsx` and `login.tsx` are public routes; tabs require authentication
- `unstable_settings.initialRouteName` in `src/app/_layout.tsx` sets default route

### Authentication Flow

1. **Root Layout** (`src/app/_layout.tsx`): Wraps entire app with `AuthProvider` and `PaperProvider`
2. **AuthContext** (`src/context/AuthContext.tsx`): Central auth state management
   - `initializing`: true while checking auth status on app load
   - `user`: current Appwrite user object or null
   - `isConfigured`: checks if Appwrite env vars are set
3. **Protected Routes**: `(tabs)/_layout.tsx` redirects to `/login` if no user
4. **Auto-navigation**: `welcome.tsx` and `login.tsx` redirect authenticated users to `/(tabs)`

### Theming System

- **Dual themes**: React Navigation (`DarkTheme`, `DefaultTheme`) + React Native Paper (`paperLightTheme`, `paperDarkTheme`)
- Theme switching via `useColorScheme()` hook (respects system preferences)
- Custom Paper theme in `src/theme/paperTheme.ts` applies SpaceMono font globally
- Color constants in `src/constants/Colors.ts` define light/dark palettes

### Import Alias

Use `@/*` for all imports from `src/`:

```tsx
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/Colors";
```

## Appwrite Integration

### Configuration

Required environment variables (set in `.env` or Expo config):

- `EXPO_PUBLIC_APPWRITE_ENDPOINT`
- `EXPO_PUBLIC_APPWRITE_PROJECT_ID`
- `EXPO_PUBLIC_APPWRITE_PLATFORM`

Appwrite setup in `src/lib/appwrite.ts` gracefully handles missing config with warnings.

### Usage Pattern

```tsx
import { account, isAppwriteConfigured } from "@/lib/appwrite";

// Always check isConfigured before operations
if (isAppwriteConfigured) {
  await account.create(ID.unique(), email, password, name);
}
```

## Development Workflow

### Running the App

```bash
npm start          # Start Expo dev server
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
```

### Project Structure Conventions

- **Components**: Reusable UI in `src/components/`
- **Screens**: Route components in `src/app/`
- **Context**: Global state in `src/context/`
- **Constants**: Color schemes, config in `src/constants/`
- **Assets**: Images in `assets/images/`, fonts in `assets/fonts/`, mock data in `assets/data/`
- **Lib**: External service integrations in `src/lib/`

### TypeScript

- Strict mode enabled
- Expo typed routes experiment active (`experiments.typedRoutes: true`)
- Use `expo-env.d.ts` for Expo-specific type declarations

## Key Files to Know

- `src/app/_layout.tsx`: Root layout with providers and splash screen logic
- `src/context/AuthContext.tsx`: Authentication state and methods (login, register, logout, refresh)
- `src/lib/appwrite.ts`: Appwrite client configuration and helper functions
- `app.json`: Expo configuration (new architecture enabled, edge-to-edge Android)
- `src/theme/paperTheme.ts`: Material Design 3 theme customization

## Common Tasks

### Adding New Authenticated Screen

1. Create file in `src/app/(tabs)/screenname.tsx`
2. Add `<Tabs.Screen>` entry in `src/app/(tabs)/_layout.tsx`
3. Use `useAuth()` hook to access user data

### Adding New Public Screen

1. Create file in `src/app/screenname.tsx`
2. Add `<Stack.Screen>` entry in `src/app/_layout.tsx`
3. Handle navigation to authenticated routes after auth events

### Working with Themes

- Use Paper components (`Button`, `TextInput`, etc.) for auto-theming
- Access theme with `useTheme()` from react-native-paper
- Platform-specific styling via `Platform.select()`

### Mock Data

Sample products/orders exist in `assets/data/` for development without backend dependencies.

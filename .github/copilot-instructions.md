# Copilot Instructions for Luxury Marketplace

## Project Overview

Luxury marketplace mobile app built with **Expo Router** (file-based routing), **React Native Paper** (Material Design 3), **styled-components**, and **Appwrite** (backend-as-a-service). Targets iOS, Android, and Web platforms with React Native's new architecture enabled.

## Architecture & Key Patterns

### File-Based Routing (Expo Router)

- Routes live in `src/app/` directory
- `(tabs)/` = tab navigator group (authenticated screens)
- `_layout.tsx` files define nested navigation layouts
- `welcome.tsx` and `login.tsx` are public routes; tabs require authentication
- `unstable_settings.initialRouteName` in `src/app/_layout.tsx` sets default route (`"welcome"`)

### Triple Theme System (Critical Pattern)

The app uses **three theme systems simultaneously** - understand this before styling:

1. **React Navigation Theme** (`DarkTheme`, `DefaultTheme`): Controls navigation bars and headers
2. **React Native Paper Theme** (`paperLightTheme`, `paperDarkTheme`): Controls Paper components (Button, TextInput, etc.)
3. **styled-components Theme** (`theme` from `src/theme/theme.ts`): Controls custom styled components

**Theming Implementation:**
- `src/app/_layout.tsx` wraps app in `StyledThemeProvider` → `PaperProvider` → `AuthProvider` → `ThemeProvider`
- Access styled-components theme: `import { useTheme } from "styled-components/native"`
- Access Paper theme: `import { useTheme } from "react-native-paper"`
- Theme defined in `src/theme/theme.ts` with TypeScript augmentation for `styled-components/native`

### Styled Components Pattern

**All custom UI components use styled-components** - never create inline styles. Reusable components in `src/components/styled.ts`:

```tsx
import { Card, Title, BodyText, PaddedContainer } from "@/components/styled";
import { useTheme } from "styled-components/native";

const theme = useTheme(); // Access colors, spacing, fontSize, etc.
<Card elevated>
  <Title color={theme.colors.primary}>Heading</Title>
</Card>
```

Key styled components: `Container`, `ScrollContainer`, `SafeContainer`, `CenterContainer`, `PaddedContainer`, `Card`, `Surface`, `Title`, `Subtitle`, `BodyText`, `PrimaryButton`, `SecondaryButton`, `OutlineButton`, `Input`, `Row`, `Column`, `Badge`, `Divider`, `Avatar`

### Authentication Flow

1. **Root Layout** (`src/app/_layout.tsx`): Shows loading spinner while `initializing` is true
2. **AuthContext** (`src/context/AuthContext.tsx`): Central auth state management
   - `initializing`: true while checking auth on app load (prevents flashing wrong screen)
   - `user`: current Appwrite user object or null
   - `isConfigured`: checks if Appwrite env vars are set
   - Methods: `login`, `register`, `logout`, `refresh`, `recoverPassword`, `confirmPasswordReset`, `loginWithGoogle`
3. **Protected Routes**: `(tabs)/_layout.tsx` renders `<Redirect href="/login" />` if no user after initialization
4. **Auto-navigation**: `welcome.tsx` and `login.tsx` redirect authenticated users to `/(tabs)` using `router.replace()`

### OAuth Implementation (Platform-Specific)

**Critical:** OAuth flow differs between web and native (see `MOBILE_OAUTH_SETUP.md`, `GOOGLE_OAUTH_SETUP.md`, `OAUTH_TROUBLESHOOTING.md`):

**Web:** `account.createOAuth2Session()` redirects full page to Google, returns to `/auth/callback`
**Native:** Uses `expo-web-browser` with `openAuthSessionAsync()` and app scheme `appwrite-callback-6910079a00217d16d0ed://`

**Callback Flow:**
1. OAuth redirects to `src/app/auth/callback.tsx`
2. Waits 1500ms for Appwrite session finalization
3. Calls `refresh()` to update user state
4. Navigates to `/(tabs)` via `router.replace()`

**Platform Configuration Required:**
- Appwrite Console: Add Web, Android (`host.exp.exponent`), and iOS (`host.exp.Exponent`) platforms
- Google Cloud Console: OAuth clients for Web, Android, iOS with correct redirect URIs
- `app.json`: scheme includes `luxurymarketplace` and `appwrite-callback-6910079a00217d16d0ed`

### Appwrite SDK Platform Detection

**Critical pattern** in `src/lib/appwrite.ts`:
```tsx
const isWeb = Platform.OS === "web";
if (isWeb) {
  const appwrite = require("appwrite"); // Web SDK
} else {
  const rnAppwrite = require("react-native-appwrite"); // Native SDK
}
```
- Web SDK doesn't support `client.setPlatform()` - only call for native
- Always check `isAppwriteConfigured` before operations
- Environment variables: `EXPO_PUBLIC_APPWRITE_ENDPOINT`, `EXPO_PUBLIC_APPWRITE_PROJECT_ID`, `EXPO_PUBLIC_APPWRITE_PLATFORM`, `EXPO_PUBLIC_APPWRITE_DATABASE_ID`, `EXPO_PUBLIC_APPWRITE_BUCKET_VEHICULOS_ID`

### Data Management & Storage

**Pattern:** CRUD operations use Appwrite databases and storage:
```tsx
import { databases, storage, databaseId, bucketId, ID } from "@/lib/appwrite";

// Create document
await databases.createDocument(databaseId, collectionId, ID.unique(), data);

// Upload image
const file = { name: "image.jpg", type: "image/jpeg", uri: imageUri, size };
await storage.createFile(bucketId, ID.unique(), file);

// Get image URL
const url = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
```

**Image Picker Pattern** (see `edit-vehicle.tsx`, `(tabs)/three.tsx`):
1. Request permissions: `ImagePicker.requestMediaLibraryPermissionsAsync()`
2. Launch picker: `ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: true, quality: 0.8 })`
3. Upload to Appwrite Storage, get file ID
4. Store file ID in database document

### Import Alias

Use `@/*` for all imports from `src/`:

```tsx
import { useAuth } from "@/context/AuthContext";
import { theme } from "@/theme/theme";
import { Card, Title } from "@/components/styled";
```

Configured in `tsconfig.json`: `"paths": { "@/*": ["./src/*"] }`

## Development Workflow

### Running the App

```bash
npm start          # Start Expo dev server
npm run android    # Android emulator (requires Android Studio)
npm run ios        # iOS simulator (requires Xcode, macOS only)
npm run web        # Web browser (http://localhost:8081)
```

**Note:** Expo Go has OAuth limitations - use EAS Build or development builds for full OAuth testing on mobile.

### Project Structure Conventions

- **Components**: Reusable UI in `src/components/` (styled.ts, useColorScheme, etc.)
- **Screens**: Route components in `src/app/` (follow Expo Router conventions)
- **Context**: Global state in `src/context/` (currently only AuthContext)
- **Theme**: All theme definitions in `src/theme/` (theme.ts, paperTheme.ts)
- **Constants**: Colors and config in `src/constants/`
- **Assets**: Images in `assets/images/`, fonts in `assets/fonts/`, mock data in `assets/data/`
- **Lib**: External service integrations in `src/lib/` (currently only appwrite.ts)

### TypeScript

- Strict mode enabled
- Expo typed routes experiment active (`experiments.typedRoutes: true`)
- Use `expo-env.d.ts` for Expo-specific type declarations
- styled-components types extended via declaration merging in `src/theme/theme.ts`

## Key Files to Know

- `src/app/_layout.tsx`: Root layout with providers, splash screen, font loading
- `src/context/AuthContext.tsx`: Auth state, login/register/logout/OAuth methods
- `src/lib/appwrite.ts`: Platform-aware Appwrite SDK initialization
- `src/theme/theme.ts`: Master theme definition (colors, spacing, typography, shadows)
- `src/components/styled.ts`: All reusable styled-components
- `app.json`: Expo config (new architecture, schemes, Android edge-to-edge)
- `MOBILE_OAUTH_SETUP.md`, `GOOGLE_OAUTH_SETUP.md`, `OAUTH_TROUBLESHOOTING.md`: OAuth setup guides

## Common Tasks

### Adding New Authenticated Screen

1. Create file in `src/app/(tabs)/screenname.tsx`
2. Use styled-components from `@/components/styled` for UI
3. Add `<Tabs.Screen>` entry in `src/app/(tabs)/_layout.tsx` with icon and title
4. Access user via `const { user } = useAuth()`

### Adding New Public Screen

1. Create file in `src/app/screenname.tsx`
2. Add `<Stack.Screen>` entry in `src/app/_layout.tsx` with header options
3. Redirect authenticated users: `if (user) { router.replace("/(tabs)"); }`

### Working with Themes

- **Never use inline styles** - always use styled-components or Paper components
- Access theme: `const theme = useTheme()` (import from `styled-components/native`)
- Use theme properties: `theme.colors.primary`, `theme.spacing.md`, `theme.fontSize.lg`
- For Paper components: `<Button mode="contained">` auto-applies theme

### Debugging OAuth Issues

1. Check `OAUTH_TROUBLESHOOTING.md` for common 401 errors
2. Verify platforms configured in Appwrite Console (Web + Android + iOS)
3. Check redirect URIs match Google Cloud Console configuration
4. Enable console logs in `AuthContext.tsx` `loginWithGoogle()` method
5. Test web first (simpler flow), then mobile

### Mock Data

Sample products in `assets/data/products.ts` - legacy from template, not actively used in vehicle marketplace features.

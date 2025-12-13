# Google OAuth Setup Guide

## What's Been Implemented

✅ Google OAuth authentication added to the app
✅ "Continue with Google" button on login screen
✅ OAuth callback handlers for success and failure
✅ Deep linking configured with `luxurymarketplace://` scheme

## Configuration Steps

### 1. Configure Google OAuth in Appwrite Console

1. Go to your Appwrite Console
2. Navigate to **Auth** → **Settings**
3. Find **Google** in the OAuth2 Providers section
4. Click **Enable**
5. You'll need to provide:
   - **App ID** (Google Client ID)
   - **App Secret** (Google Client Secret)

### 2. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if not done
6. For **Application type**, choose:
   - **Web application** for web/expo development
   - **iOS** for iOS app
   - **Android** for Android app

### 3. Configure Redirect URIs in Google Console

Add these redirect URIs in Google OAuth settings:

**For Web/Expo Go:**
```
https://[YOUR_PROJECT_ID].appwrite.io/v1/account/sessions/oauth2/callback/google/web
```

**For iOS:**
```
luxurymarketplace://auth/callback
```

**For Android:**
```
luxurymarketplace://auth/callback
```

### 4. Configure Redirect URLs in Appwrite

In Appwrite Console → Auth → Settings → OAuth2:

**Success URL:**
```
luxurymarketplace://auth/callback
```

**Failure URL:**
```
luxurymarketplace://auth/failure
```

### 5. Testing

**Web/Expo Go:**
- Run `npm start`
- Press `w` for web
- Click "Continuar con Google" button
- You'll be redirected to Google's OAuth page
- After authentication, you'll be redirected back to the app

**iOS/Android:**
- Deep linking will handle the OAuth callback
- Make sure the app scheme `luxurymarketplace://` is properly configured

## Files Modified

1. **src/context/AuthContext.tsx**
   - Added `loginWithGoogle()` method
   - Handles OAuth2 session creation with Appwrite

2. **src/app/login.tsx**
   - Added "Continuar con Google" button
   - Added OAuth divider styling
   - Added `handleGoogleLogin()` handler

3. **src/app/auth/callback.tsx** (NEW)
   - Handles successful OAuth callback
   - Refreshes user session and redirects to main app

4. **src/app/auth/failure.tsx** (NEW)
   - Handles failed OAuth attempts
   - Shows error message and returns to login

5. **app.json**
   - Already has `scheme: "luxurymarketplace"` configured
   - Already has `expo-web-browser` plugin enabled

## Troubleshooting

**OAuth popup doesn't open:**
- Make sure `expo-web-browser` is installed
- Check that the Google credentials are correct in Appwrite

**Callback doesn't work:**
- Verify redirect URLs in both Google Console and Appwrite match
- Check that the app scheme is properly configured
- For mobile, ensure deep linking is working

**"OAuth provider not enabled" error:**
- Verify Google OAuth is enabled in Appwrite Console
- Check that App ID and Secret are correctly configured

**Session not created:**
- Clear browser cache
- Check Appwrite logs for errors
- Verify user is authorized in Google OAuth consent screen

## Security Notes

- Never commit Google Client Secret to version control
- Use environment variables for sensitive credentials
- Configure OAuth consent screen properly
- Limit OAuth scopes to only what's needed (email, profile)

## Next Steps

1. Get Google OAuth credentials
2. Configure in Appwrite Console
3. Test on web first
4. Test on iOS/Android with deep linking
5. Handle edge cases (user cancels, network errors, etc.)

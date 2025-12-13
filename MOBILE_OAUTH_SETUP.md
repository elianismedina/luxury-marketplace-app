# Configuración de OAuth para Mobile (iOS/Android)

## Problema Común

Si el OAuth con Google funciona en **Web** pero no en **Expo Go** o apps nativas, probablemente falte configurar las plataformas móviles en Appwrite.

## Solución: Configurar Plataformas en Appwrite Console

### 1. Plataforma Android

1. Ve a **Appwrite Console** → Tu Proyecto → **Overview** → **Platforms**
2. Click en **"+ Add Platform"**
3. Selecciona **"Android App"**
4. Configura:
   - **Name**: `Luxury Marketplace Android`
   - **Package Name**: `host.exp.exponent` (para Expo Go) o tu package name real
   - **SHA-256 Certificate Fingerprints**: (opcional para desarrollo)
5. Click **"Next"** o **"Save"**

### 2. Plataforma iOS

1. En la misma sección **Platforms**, click **"+ Add Platform"**
2. Selecciona **"Apple App"**
3. Configura:
   - **Name**: `Luxury Marketplace iOS`
   - **Bundle ID**: `host.exp.Exponent` (para Expo Go) o tu bundle ID real
4. Click **"Next"** o **"Save"**

## Package Names para Diferentes Entornos

### Expo Go (Desarrollo)

```
Android: host.exp.exponent
iOS: host.exp.Exponent
```

### Build de Desarrollo (EAS Build)

```
Android: com.tuempresa.luxurymarketplace.dev
iOS: com.tuempresa.luxurymarketplace.dev
```

### Build de Producción

```
Android: com.tuempresa.luxurymarketplace
iOS: com.tuempresa.luxurymarketplace
```

## Verificar Configuración

### En Appwrite Console

Deberías ver al menos 3 plataformas:

- ✅ **Web App** - `localhost` (para desarrollo web)
- ✅ **Android App** - `host.exp.exponent` (para Expo Go)
- ✅ **Apple App** - `host.exp.Exponent` (para Expo Go)

### Deep Link Scheme

Verifica en `app.json` que el scheme esté configurado:

```json
{
  "expo": {
    "scheme": "luxurymarketplace"
  }
}
```

## Configurar Google OAuth para Mobile

### En Google Cloud Console

1. Ve a **APIs & Services** → **Credentials**
2. Selecciona o crea un **OAuth 2.0 Client ID** para cada plataforma:

#### Android OAuth Client

- **Application type**: Android
- **Package name**: `host.exp.exponent` (Expo Go) o tu package name
- **SHA-1 certificate fingerprint**: Obtén con:

  ```bash
  # Para Expo Go (desarrollo)
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
  ```

#### iOS OAuth Client

- **Application type**: iOS
- **Bundle ID**: `host.exp.Exponent` (Expo Go) o tu bundle ID

#### Web OAuth Client (ya configurado)

- **Application type**: Web application
- **Authorized redirect URIs**:

  ```
  https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/[PROJECT_ID]
  ```

### En Appwrite Console

1. Ve a **Auth** → **Settings** → **OAuth2 Providers** → **Google**
2. Habilita el toggle
3. Agrega **Client ID** del Web OAuth Client de Google
4. Agrega **Client Secret** del Web OAuth Client de Google
5. Guarda

**Nota**: Para OAuth en mobile, Appwrite usa el Web OAuth Client ID/Secret, pero necesita que las plataformas móviles estén registradas en Appwrite.

## Probar en Expo Go

1. Asegúrate que las plataformas estén configuradas en Appwrite
2. Reinicia Expo:

   ```bash
   npm start -- --clear
   ```

3. Escanea el QR con Expo Go
4. Ve a Login
5. Click en "Continuar con Google"
6. Debería abrir el navegador para autenticar
7. Después de autenticar, debería volver a la app

## Logs de Depuración

Si aún hay errores, verifica los logs en la terminal de Expo:

```bash
npm start
```

Busca mensajes como:

```
loginWithGoogle: Native platform detected, using WebBrowser
loginWithGoogle: Creating OAuth session for mobile...
loginWithGoogle: OAuth URL: https://fra.cloud.appwrite.io/...
loginWithGoogle: WebBrowser result: { type: 'success', url: '...' }
```

## Errores Comunes

### Error: "Invalid platform"

**Causa**: Falta configurar la plataforma Android/iOS en Appwrite Console  
**Solución**: Agrega las plataformas como se describe arriba

### Error: "Sign in failed"

**Causa**: Google OAuth Client no configurado correctamente  
**Solución**: Verifica que el package name/bundle ID en Google Cloud Console coincida con el de Appwrite

### Error: "Invalid redirect URI"

**Causa**: El redirect URI no está en la lista de Google Cloud Console  
**Solución**: Agrega `https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/[PROJECT_ID]`

### WebBrowser se cierra inmediatamente

**Causa**: El scheme no está configurado correctamente  
**Solución**: Verifica que `scheme: "luxurymarketplace"` esté en `app.json`

## Recursos

- [Appwrite OAuth Documentation](https://appwrite.io/docs/products/auth/oauth2)
- [Expo WebBrowser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)
- [Google OAuth Setup](https://console.cloud.google.com/apis/credentials)

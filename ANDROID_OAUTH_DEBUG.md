# Debug: Google OAuth "Something went wrong" en Android

## Verificación Paso a Paso

### 1. Verificar OAuth Clients en Google Cloud Console

Ve a [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)

Debes tener **3 OAuth Client IDs**:

#### A. Web OAuth Client

- **Type**: Web application
- **Authorized redirect URIs** debe incluir:

  ```
  https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/6910079a00217d16d0ed
  ```

#### B. Android OAuth Client (Expo Go)

- **Type**: Android
- **Package name**: `host.exp.exponent` ⚠️ (TODO MINÚSCULAS, sin espacios)
- **SHA-1**: `1F:1D:BE:17:86:4F:2C:72:84:EA:51:8F:C9:10:74:65:02:7F:8A:9D`

#### C. iOS OAuth Client (Expo Go) - OPCIONAL

- **Type**: iOS
- **Bundle ID**: `host.exp.Exponent`

### 2. Verificar en Appwrite Console

Ve a [Appwrite Console](https://cloud.appwrite.io) → Tu proyecto

#### Auth Settings

- **Auth** → **Settings** → **OAuth2 Providers** → **Google**
- ✅ Toggle habilitado (ON)
- **Client ID**: Copia el Client ID del **Web OAuth Client** (NO el Android)
- **Client Secret**: Copia el Secret del **Web OAuth Client**

#### Platforms

- **Overview** → **Platforms**

Debe tener:

1. **Web App**
   - Hostname: `localhost`

2. **Android App**
   - Name: `Luxury Marketplace Android` (o cualquier nombre)
   - Package Name: `host.exp.exponent` ⚠️ (exactamente así)

3. **Apple App** (opcional)
   - Name: `Luxury Marketplace iOS`
   - Bundle ID: `host.exp.Exponent`

### 3. Verificar APIs Habilitadas

Ve a [Google Cloud Console - APIs](https://console.cloud.google.com/apis/library)

Busca y verifica que estén **HABILITADAS**:

- ✅ **Google+ API** (o **People API**)
- ✅ **Google Identity Toolkit API**

### 4. Verificar OAuth Consent Screen

Ve a [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)

- **User Type**: External (o Internal si es workspace)
- **Publishing status**: "Testing" está bien para desarrollo
- **Test users**: Agrega tu email de Google que usarás para probar

### 5. Limpiar y Reintentar

#### En Google Cloud Console

1. Ve a tu **Android OAuth Client**
2. Verifica que el SHA-1 sea EXACTAMENTE:

   ```
   1F:1D:BE:17:86:4F:2C:72:84:EA:51:8F:C9:10:74:65:02:7F:8A:9D
   ```

3. Verifica que el Package name sea EXACTAMENTE:

   ```
   host.exp.exponent
   ```

#### En tu terminal

```bash
# Detén Expo
Ctrl+C

# Limpia caché
npm start -- --clear
```

#### En tu dispositivo Android

1. Cierra completamente Expo Go (fuerza el cierre)
2. Abre Expo Go de nuevo
3. Escanea el QR
4. Intenta login con Google

### 6. Solución Alternativa: Crear Nuevo Android Client

Si sigue sin funcionar, intenta recrear el Android OAuth Client:

1. En Google Cloud Console, **ELIMINA** el Android OAuth Client actual
2. Crea uno nuevo:
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type: **Android**
   - Name: `Luxury Marketplace (Expo Go)`
   - Package name: `host.exp.exponent`
   - SHA-1 certificate fingerprint: `1F:1D:BE:17:86:4F:2C:72:84:EA:51:8F:C9:10:74:65:02:7F:8A:9D`
   - Click **CREATE**

3. **IMPORTANTE**: Espera 5-10 minutos después de crear/modificar el OAuth Client

4. Intenta de nuevo

## Errores Comunes

### "Something went wrong"

**Causa**: SHA-1 o Package name incorrecto
**Solución**: Verifica que sean EXACTOS (copia/pega)

### "Sign in failed"

**Causa**: APIs no habilitadas
**Solución**: Habilita Google+ API y Google Identity Toolkit API

### "Invalid client"

**Causa**: Client ID incorrecto en Appwrite
**Solución**: Usa el Client ID del **Web OAuth Client** en Appwrite

### Error de redirect

**Causa**: Redirect URI no configurado
**Solución**: Agrega la URL de Appwrite en Web OAuth Client

## Comando de Verificación

Para verificar que estás usando el package name correcto en Expo Go:

```bash
# Android
adb shell pm list packages | grep exponent
# Debería mostrar: package:host.exp.exponent
```

## Logs de Debug

Agrega estos logs temporales en `src/context/AuthContext.tsx`:

```typescript
console.log("Package being used:", Platform.OS === "android" ? "host.exp.exponent" : "host.exp.Exponent");
console.log("OAuth URL:", oauthUrl);
```

Esto te ayudará a verificar qué se está enviando exactamente.

## Última Verificación: OAuth Consent Screen

Asegúrate de que tu cuenta de Google esté en la lista de test users:

1. Ve a [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Scroll down a **Test users**
3. Click **+ ADD USERS**
4. Agrega tu email de Google
5. Guarda

## Tiempo de Propagación

Después de hacer cambios en Google Cloud Console:

- **Crear/editar OAuth Client**: 5-10 minutos
- **Habilitar APIs**: 2-5 minutos
- **Cambiar Consent Screen**: Inmediato

Si modificaste algo, **espera 10 minutos** antes de probar de nuevo.

## Si Nada Funciona

Como última opción, prueba con un **standalone build** en lugar de Expo Go:

```bash
# Crear development build
npx eas build --profile development --platform android
```

Esto creará un APK con tu propio package name, y necesitarás:

1. Cambiar el package name en `app.json`
2. Generar tu propio SHA-1
3. Crear un nuevo Android OAuth Client con tu package name y SHA-1

Pero esto es solo si Expo Go definitivamente no funciona.

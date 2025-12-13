# Google OAuth 401 Error - Troubleshooting Guide

## Error Actual

```
Failed to load resource: the server responded with a status of 401
fra.cloud.appwrite.io/v1/account
```

## Posibles Causas y Soluciones

### 1. OAuth Provider No Configurado en Appwrite Console

**Verificar:**

1. Ve a [Appwrite Console](https://cloud.appwrite.io)
2. Selecciona tu proyecto
3. Ve a **Auth** → **Settings**
4. Busca **OAuth2 Providers**
5. Asegúrate que **Google** esté:
   - ✅ **Habilitado** (toggle en ON)
   - ✅ Tenga **Client ID** configurado
   - ✅ Tenga **Client Secret** configurado

**Si falta configuración:**

```
1. Ve a Google Cloud Console (console.cloud.google.com)
2. Selecciona tu proyecto o crea uno nuevo
3. Ve a "APIs & Services" > "Credentials"
4. Crea OAuth 2.0 Client ID (tipo Web Application)
5. Agrega estos Authorized redirect URIs:
   - https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/[PROJECT_ID]
6. Copia Client ID y Client Secret a Appwrite Console
```

### 2. URLs de Redirect No Coinciden

**El error 401 puede ocurrir si:**

- La URL de callback que estás enviando NO está en Authorized redirect URIs de Google
- Estás usando `localhost:8081` pero Google espera `localhost`

**Verificar en Google Cloud Console:**

```
Authorized redirect URIs debe incluir:
✅ https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/[TU_PROJECT_ID]

NO necesitas agregar:
❌ http://localhost:8081/auth/callback
❌ luxurymarketplace://
```

### 3. Platform No Configurado en Appwrite

**Verificar en Appwrite Console:**

1. Ve a tu proyecto
2. **Overview** → **Platforms**
3. Asegúrate que tengas una plataforma **Web** con:
   - Name: `localhost` o `Luxury Marketplace Web`
   - Hostname: `localhost` (SIN puerto, SIN http://)

**Si no existe, agrégala:**

```
1. Click "+ Add Platform"
2. Selecciona "Web App"
3. Name: localhost
4. Hostname: localhost
5. Guarda
```

### 4. Project ID Incorrecto

**Verificar:**

```bash
# En tu .env o .env.local
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=[TU_PROJECT_ID_CORRECTO]
```

**Encontrar tu Project ID:**

1. Ve a Appwrite Console
2. Selecciona tu proyecto
3. El ID está en **Settings** → **Project ID**

### 5. Variables de Entorno No Cargadas

**Verificar que las variables están disponibles:**

Agrega esto temporalmente en `src/context/AuthContext.tsx` dentro de `loginWithGoogle`:

```typescript
// Debug: verificar configuración
console.log("Appwrite Config:", {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  isConfigured: isAppwriteConfigured,
});
```

**Si ves valores vacíos:**

```bash
# Reinicia el servidor Expo
npm start -- --clear
```

## Pasos de Diagnóstico

### Paso 1: Verificar Logs del Navegador

Cuando hagas click en "Continuar con Google", busca en la consola:

```
loginWithGoogle: Starting OAuth flow...
loginWithGoogle: Web platform detected...
loginWithGoogle: Base URL: http://localhost:8081
```

### Paso 2: Ver la URL de Redirect

Antes del error 401, deberías ver una redirección a una URL como:

```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=...
  redirect_uri=https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/[PROJECT_ID]
  ...
```

**Si `redirect_uri` es diferente, hay un problema de configuración.**

### Paso 3: Verificar Network Tab

1. Abre DevTools → Network
2. Haz click en "Continuar con Google"
3. Busca la petición que da 401
4. Ve a **Headers** → **Response Headers**
5. Busca mensajes de error en el cuerpo de la respuesta

### Paso 4: Probar OAuth Directamente

Prueba crear una sesión OAuth directamente desde la consola del navegador:

```javascript
// Abre DevTools Console en http://localhost:8081
const { account } = await import('@/lib/appwrite');
account.createOAuth2Session(
  'google',
  'http://localhost:8081/auth/callback',
  'http://localhost:8081/auth/failure'
).then(console.log).catch(console.error);
```

## Solución Más Probable

El error 401 generalmente indica que:

**❌ Google OAuth NO está configurado en Appwrite Console**

**Solución:**

1. Ve a Appwrite Console → Auth → Settings
2. Busca Google en OAuth2 Providers
3. Habilita el toggle
4. Agrega Client ID y Client Secret desde Google Cloud Console
5. Guarda los cambios
6. Intenta de nuevo

## Recursos

- [Appwrite OAuth2 Guide](https://appwrite.io/docs/products/auth/oauth2)
- [Google OAuth Setup](https://console.cloud.google.com/apis/credentials)
- [Appwrite Console](https://cloud.appwrite.io)

## Comando de Depuración Rápida

Ejecuta esto en la terminal de VS Code para ver tus variables de entorno:

```powershell
Get-Content .env | Select-String "APPWRITE"
```

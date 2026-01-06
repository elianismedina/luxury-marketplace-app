import { AccessToken } from 'livekit-server-sdk';

interface TokenOptions {
  identity: string;
  roomName: string;
  canPublish?: boolean;
  canSubscribe?: boolean;
  canPublishData?: boolean;
  name?: string;
  metadata?: string;
}

export async function generateLiveKitToken(options: TokenOptions): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_LIVEKIT_API_KEY;
  const apiSecret = process.env.EXPO_PUBLIC_LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit API key and secret must be configured');
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: options.identity,
    name: options.name,
    metadata: options.metadata,
  });

  token.addGrant({
    roomJoin: true,
    room: options.roomName,
    canPublish: options.canPublish ?? true,
    canSubscribe: options.canSubscribe ?? true,
    canPublishData: options.canPublishData ?? true,
  });

  return token.toJwt();
}
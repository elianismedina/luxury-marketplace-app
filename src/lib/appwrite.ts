import Constants from "expo-constants";
import {
  Account,
  Avatars,
  Client,
  Databases,
  Storage,
} from "react-native-appwrite";

const endpoint =
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ??
  Constants.expoConfig?.extra?.appwriteEndpoint ??
  "";
const projectId =
  process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ??
  Constants.expoConfig?.extra?.appwriteProjectId ??
  "";
const platform =
  process.env.EXPO_PUBLIC_APPWRITE_PLATFORM ??
  Constants.expoConfig?.extra?.appwritePlatform ??
  "";
const databaseId =
  process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ??
  Constants.expoConfig?.extra?.appwriteDatabaseId ??
  "";
const bucketId =
  process.env.EXPO_PUBLIC_APPWRITE_BUCKET_VEHICULOS_ID ??
  Constants.expoConfig?.extra?.appwriteBucketVehiculosId ??
  "";

export const isAppwriteConfigured = Boolean(endpoint && projectId && platform);

if (!isAppwriteConfigured) {
  console.warn(
    [
      "[Appwrite] Missing configuration.",
      "Set EXPO_PUBLIC_APPWRITE_ENDPOINT, EXPO_PUBLIC_APPWRITE_PROJECT_ID and EXPO_PUBLIC_APPWRITE_PLATFORM.",
    ].join(" ")
  );
}

export const client = new Client();

if (endpoint) {
  client.setEndpoint(endpoint);
}

if (projectId) {
  client.setProject(projectId);
}

if (platform) {
  client.setPlatform(platform);
}

export const account = new Account(client);
export const avatars = new Avatars(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { bucketId, databaseId, endpoint, projectId };

export async function getLoggedInUser() {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    return null;
  }
}

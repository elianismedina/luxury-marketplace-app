import Constants from "expo-constants";
import { Platform } from "react-native";

// Use web SDK for web platform, React Native SDK for mobile
const isWeb = Platform.OS === "web";

let Account: any, Avatars: any, Client: any, Databases: any, Storage: any;

if (isWeb) {
  // Web SDK
  const appwrite = require("appwrite");
  Account = appwrite.Account;
  Avatars = appwrite.Avatars;
  Client = appwrite.Client;
  Databases = appwrite.Databases;
  Storage = appwrite.Storage;
} else {
  // React Native SDK
  const rnAppwrite = require("react-native-appwrite");
  Account = rnAppwrite.Account;
  Avatars = rnAppwrite.Avatars;
  Client = rnAppwrite.Client;
  Databases = rnAppwrite.Databases;
  Storage = rnAppwrite.Storage;
}

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
const categoriesCollectionId =
  process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_CATEGORIES_ID ?? "categoria";

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

// setPlatform only exists in react-native-appwrite, not in web SDK
if (platform && !isWeb) {
  client.setPlatform(platform);
}

export const account = new Account(client);
export const avatars = new Avatars(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { bucketId, categoriesCollectionId, databaseId, endpoint, projectId };

export async function getLoggedInUser() {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    return null;
  }
}

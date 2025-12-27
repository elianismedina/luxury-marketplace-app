module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@clerk|react-native-url-polyfill))",
  ],
  moduleNameMapper: {
    "^@expo/vector-icons(.*)$": "<rootDir>/__mocks__/@expo/vector-icons.js",
    // Support for folders with parenthesis like (auth), (tabs), etc.
    "^@/(.*)": "<rootDir>/src/$1",
    "^src/(.*)": "<rootDir>/src/$1",
    "^components/(.*)": "<rootDir>/src/components/$1",
    "^app/(.*)": "<rootDir>/src/app/$1",
    "^constants/(.*)": "<rootDir>/src/constants/$1",
    "^context/(.*)": "<rootDir>/src/context/$1",
    "^lib/(.*)": "<rootDir>/src/lib/$1",
    "^theme/(.*)": "<rootDir>/src/theme/$1",
  },
};

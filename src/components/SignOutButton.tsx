import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { Button } from "react-native-paper";

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to welcome or sign-in page after logout
      router.replace("/welcome");
    } catch (err) {
      console.error("Logout error:", JSON.stringify(err, null, 2));
    }
  };

  return (
    <Button
      mode="outlined"
      onPress={handleSignOut}
      style={styles.button}
      textColor="#FF3333"
      icon="logout"
    >
      {t("common.cerrar_sesion")}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    borderColor: "#FF3333",
    borderRadius: 8,
  },
});

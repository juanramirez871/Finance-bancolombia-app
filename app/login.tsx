import { BCO } from "@/constants/income";
import { Colors } from "@/constants/theme";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Image } from "expo-image";
import { useCallback, useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "./_layout";

export default function LoginScreen() {
  const auth = useContext(AuthContext);

  const onGoogleSignIn = useCallback(() => {
    auth?.signIn();
  }, [auth]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image
          source={require("@/assets/images/security.svg")}
          style={styles.hero}
          contentFit="contain"
          pointerEvents="none"
        />

        <Text style={styles.title}>Inicia sesión</Text>
        <Text style={styles.subtitle}>
          Accede solo con tu cuenta de Google para ver tus finanzas
        </Text>

        <TouchableOpacity onPress={onGoogleSignIn} style={styles.googleButton}>
          <View style={styles.googleIconWrap}>
            <AntDesign name="google" size={18} color={Colors.white} />
          </View>
          <Text style={styles.googleButtonText}>Continuar con Google</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BCO.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  hero: {
    width: 220,
    height: 220,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: BCO.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: BCO.muted,
    textAlign: "center",
    maxWidth: 280,
  },
  googleButton: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: Colors.purple,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  googleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.white,
  },
});

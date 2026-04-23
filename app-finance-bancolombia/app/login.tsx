import { BCO } from "@/constants/income";
import { Colors } from "@/constants/theme";
import { api } from "@/utils/api";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Image } from "expo-image";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useCallback, useContext, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "./_layout";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId ?? "";
const SCOPE = "openid email profile https://www.googleapis.com/auth/gmail.readonly";
const REDIRECT_URI = AuthSession.makeRedirectUri({
  native: "com.juan098.Finance-bancolombia:/oauth2redirect",
});

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

export default function LoginScreen() {
  const auth = useContext(AuthContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    try {
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: SCOPE.split(" "),
        redirectUri: REDIRECT_URI,
        usePKCE: true,
        responseType: AuthSession.ResponseType.Code,
      });

      const result = await request.promptAsync(discovery);
      if (result.type !== "success") {
        return;
      }

      if (!("params" in result)) {
        Alert.alert("Error", "No se pudo completar el login.");
        return;
      }

      const code = result.params?.code;
      if (!code) {
        Alert.alert("Error", "No se recibió el código de autenticación.");
        return;
      }

      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: GOOGLE_CLIENT_ID,
          code,
          redirectUri: REDIRECT_URI,
          extraParams: { code_verifier: request.codeVerifier ?? "" },
        },
        discovery,
      );

      const idToken = tokenResponse.idToken;
      if (!idToken) {
        Alert.alert("Error", "No se recibió el id_token.");
        return;
      }

      const data = await api.post<{ token?: string }>("/api/auth/google", {
        id_token: idToken,
        access_token: tokenResponse.accessToken,
        refresh_token: tokenResponse.refreshToken,
        expires_in: tokenResponse.expiresIn,
      });

      if (!data.token) {
        Alert.alert("Error", "Authentication failed");
        return;
      }

      await auth?.signIn(data.token);
      AuthSession.dismiss();
      router.replace("/importing");
    }
    catch (error) {
      console.log("Caught error:", error);
      console.error("Google sign in error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
    finally {
      setLoading(false);
    }
  }, [auth, router]);

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

        <TouchableOpacity
          onPress={handleGoogleSignIn}
          style={styles.googleButton}
          disabled={loading}
        >
          <View style={styles.googleIconWrap}>
            <AntDesign name="google" size={18} color={Colors.white} />
          </View>
          <Text style={styles.googleButtonText}>Continuar con Google</Text>
        </TouchableOpacity>
        <Image
          source={require("@/assets/images/banner.svg")}
          style={styles.banner}
          contentFit="contain"
          pointerEvents="none"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BCO.bg,
  },
  banner: {
    width: "300%",
    height: 150,
    transform: [{ translateY: 50 }, { translateX: 65 }],
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

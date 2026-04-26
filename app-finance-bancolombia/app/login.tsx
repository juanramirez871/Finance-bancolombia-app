import { Colors } from "@/constants/theme";
import { loginStyles as styles } from "@/styles/login";
import { api } from "@/utils/api";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Image } from "expo-image";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useCallback, useContext, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
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
        extraParams: {
          access_type: "offline",
          prompt: "consent",
        },
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

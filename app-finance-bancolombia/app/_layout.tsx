import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import "react-native-reanimated";
import { Colors } from "@/constants/theme";

const BancolombiaTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.purple,
    background: Colors.white,
    text: Colors.black,
  },
};

export const AuthContext = createContext<{
  isAuthenticated: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
} | null>(null);

function AuthRedirect({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";

  if (!isAuthenticated && !isLoginRoute) return <Redirect href="/login" />;
  if (isAuthenticated && isLoginRoute) return <Redirect href="/" />;

  return null;
}

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        if (token) setIsAuthenticated(true);
      }
      catch (error) {
        console.error("Error checking auth token:", error);
      }
      finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  const signIn = useCallback(async (token: string) => {
    try {
      await SecureStore.setItemAsync("authToken", token);
      setIsAuthenticated(true);
    }
    catch (error) {
      console.error("Error saving auth token:", error);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync("authToken");
      setIsAuthenticated(false);
    }
    catch (error) {
      console.error("Error removing auth token:", error);
    }
  }, []);

  const authValue = useMemo(
    () => ({ isAuthenticated, signIn, signOut }),
    [isAuthenticated, signIn, signOut],
  );

  if (loading) return null;

  return (
    <ThemeProvider value={BancolombiaTheme}>
      <AuthContext.Provider value={authValue}>
        <AuthRedirect isAuthenticated={isAuthenticated} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthContext.Provider>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

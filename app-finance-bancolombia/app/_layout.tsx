import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import "react-native-reanimated";
import { Colors } from "@/constants/theme";
import type { AuthContextValue } from "@/interfaces/auth";

const BancolombiaTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.purple,
    background: Colors.black,
    card: Colors.black,
    text: Colors.white,
    border: Colors.black,
    notification: Colors.yellow,
  },
};

export const AuthContext = createContext<AuthContextValue | null>(null);

function AuthRedirect({ isAuthenticated }: { isAuthenticated: boolean }) {

  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";
  if (!isAuthenticated && !isLoginRoute) return <Redirect href="/login" />;
  if (isAuthenticated && isLoginRoute) return null;

  return null;
}

export default function RootLayout() {
  
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        if (pathname === "/login") {
          await SecureStore.deleteItemAsync("authToken");
          setIsAuthenticated(false);
          return;
        }

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
  }, [pathname]);

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
          <Stack.Screen name="importing" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthContext.Provider>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

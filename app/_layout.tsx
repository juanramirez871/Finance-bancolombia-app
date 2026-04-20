import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
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
  signIn: () => void;
  signOut: () => void;
} | null>(null);

function AuthRedirect({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";

  if (!isAuthenticated && !isLoginRoute) {
    return <Redirect href="/login" />;
  }

  if (isAuthenticated && isLoginRoute) {
    return <Redirect href="/" />;
  }

  return null;
}

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const appStateRef = useRef<string>(AppState.currentState);
  const signIn = useCallback(() => setIsAuthenticated(true), []);
  const signOut = useCallback(() => setIsAuthenticated(false), []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "inactive" || state === "background") {
        setIsAuthenticated(false);
      }
      appStateRef.current = state;
    });
    return () => subscription.remove();
  }, []);

  const authValue = useMemo(
    () => ({ isAuthenticated, signIn, signOut }),
    [isAuthenticated, signIn, signOut],
  );

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

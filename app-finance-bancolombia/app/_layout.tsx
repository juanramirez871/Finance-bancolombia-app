import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-reanimated";
import { Colors } from "@/constants/theme";
import type { AuthContextValue } from "@/interfaces/auth";

type TransactionFilterContextValue = {
  startDate: string;
  endDate: string;
  setRange: (startDate: string, endDate: string) => Promise<void>;
  resetToCurrentYear: () => Promise<void>;
};

const TX_FILTER_START_KEY = "txFilterStartDate";
const TX_FILTER_END_KEY = "txFilterEndDate";

const getCurrentYearRange = () => {
  const year = new Date().getFullYear();
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
};

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
export const TransactionFilterContext =
  createContext<TransactionFilterContextValue | null>(null);

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
  const defaultRange = useMemo(() => getCurrentYearRange(), []);
  const [transactionFilter, setTransactionFilter] = useState(defaultRange);

  useEffect(() => {
    const loadTransactionFilter = async () => {
      try {
        const [savedStartDate, savedEndDate] = await Promise.all([
          AsyncStorage.getItem(TX_FILTER_START_KEY),
          AsyncStorage.getItem(TX_FILTER_END_KEY),
        ]);

        if (savedStartDate && savedEndDate) {
          setTransactionFilter({
            startDate: savedStartDate,
            endDate: savedEndDate,
          });
        }
      }
      catch (error) {
        console.error("Error loading transaction filter:", error);
      }
    };

    loadTransactionFilter();
  }, []);

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

  const setTransactionRange = useCallback(async (startDate: string, endDate: string) => {
    setTransactionFilter({ startDate, endDate });

    try {
      await Promise.all([
        AsyncStorage.setItem(TX_FILTER_START_KEY, startDate),
        AsyncStorage.setItem(TX_FILTER_END_KEY, endDate),
      ]);
    }
    catch (error) {
      console.error("Error saving transaction filter:", error);
    }
  }, []);

  const resetTransactionRangeToCurrentYear = useCallback(async () => {
    const range = getCurrentYearRange();
    await setTransactionRange(range.startDate, range.endDate);
  }, [setTransactionRange]);

  const transactionFilterValue = useMemo(
    () => ({
      startDate: transactionFilter.startDate,
      endDate: transactionFilter.endDate,
      setRange: setTransactionRange,
      resetToCurrentYear: resetTransactionRangeToCurrentYear,
    }),
    [
      resetTransactionRangeToCurrentYear,
      setTransactionRange,
      transactionFilter.endDate,
      transactionFilter.startDate,
    ],
  );

  if (loading) return null;

  return (
    <ThemeProvider value={BancolombiaTheme}>
      <AuthContext.Provider value={authValue}>
        <TransactionFilterContext.Provider value={transactionFilterValue}>
          <AuthRedirect isAuthenticated={isAuthenticated} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="importing" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </TransactionFilterContext.Provider>
      </AuthContext.Provider>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

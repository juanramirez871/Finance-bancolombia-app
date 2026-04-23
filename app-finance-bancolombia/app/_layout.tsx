import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import "react-native-reanimated";
import { Colors } from "@/constants/theme";
import type { AuthContextValue } from "@/interfaces/auth";
import { Text, TouchableOpacity, View } from "react-native";

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

function BiometricLockScreen({
  authenticating,
  onUnlock,
  onSignOut,
}: {
  authenticating: boolean;
  onUnlock: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.black,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        gap: 14,
      }}
    >
      <Text style={{ color: Colors.white, fontSize: 26, fontWeight: "800" }}>
        Desbloquea tu app
      </Text>
      <Text style={{ color: "#B6BBC2", fontSize: 14, textAlign: "center" }}>
        Usa Face ID o huella para continuar.
      </Text>

      <TouchableOpacity
        style={{
          marginTop: 10,
          borderRadius: 12,
          backgroundColor: Colors.yellow,
          paddingHorizontal: 18,
          paddingVertical: 12,
          minWidth: 190,
          alignItems: "center",
        }}
        onPress={() => {
          void onUnlock();
        }}
        disabled={authenticating}
      >
        <Text style={{ color: Colors.black, fontWeight: "800" }}>
          {authenticating ? "Validando..." : "Desbloquear"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#4A4E57",
          paddingHorizontal: 18,
          paddingVertical: 10,
          minWidth: 190,
          alignItems: "center",
        }}
        onPress={() => {
          void onSignOut();
        }}
      >
        <Text style={{ color: Colors.white, fontWeight: "700" }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

function AuthRedirect({ isAuthenticated }: { isAuthenticated: boolean }) {

  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";
  if (!isAuthenticated && !isLoginRoute) return <Redirect href="/login" />;
  if (isAuthenticated && isLoginRoute) return <Redirect href="/importing" />;

  return null;
}

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBiometricUnlocked, setIsBiometricUnlocked] = useState(false);
  const [isAuthenticatingBiometric, setIsAuthenticatingBiometric] = useState(false);
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

  const requestBiometricUnlock = useCallback(async () => {
    try {
      setIsAuthenticatingBiometric(true);
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsBiometricUnlocked(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Desbloquear Finance Bancolombia",
        fallbackLabel: "Usar código",
        cancelLabel: "Cancelar",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsBiometricUnlocked(true);
      }
    } catch (error) {
      console.error("Error requesting biometric auth:", error);
    } finally {
      setIsAuthenticatingBiometric(false);
    }
  }, []);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        if (token) {
          setIsAuthenticated(true);
          setIsBiometricUnlocked(false);
          await requestBiometricUnlock();
        } else {
          setIsAuthenticated(false);
          setIsBiometricUnlocked(false);
        }
      }
      catch (error) {
        console.error("Error checking auth token:", error);
      }
      finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [requestBiometricUnlock]);

  const signIn = useCallback(async (token: string) => {
    try {
      await SecureStore.setItemAsync("authToken", token);
      setIsAuthenticated(true);
      setIsBiometricUnlocked(true);
    }
    catch (error) {
      console.error("Error saving auth token:", error);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync("authToken");
      setIsAuthenticated(false);
      setIsBiometricUnlocked(false);
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

  const showBiometricLock = isAuthenticated && !isBiometricUnlocked;

  if (loading) return null;

  return (
    <ThemeProvider value={BancolombiaTheme}>
      <AuthContext.Provider value={authValue}>
        <TransactionFilterContext.Provider value={transactionFilterValue}>
          <AuthRedirect isAuthenticated={isAuthenticated} />
          {showBiometricLock ? (
            <BiometricLockScreen
              authenticating={isAuthenticatingBiometric}
              onUnlock={requestBiometricUnlock}
              onSignOut={signOut}
            />
          ) : (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="login" />
              <Stack.Screen name="importing" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          )}
        </TransactionFilterContext.Provider>
      </AuthContext.Provider>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

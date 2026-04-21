import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "balanceVisible";

export function useBalanceVisible() {
  const [balanceVisible, setBalanceVisible] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((val) => {
      if (val !== null) setBalanceVisible(val === "true");
    });
  }, []);

  const toggle = useCallback(
    (val: boolean) => {
      setBalanceVisible(val);
      AsyncStorage.setItem(KEY, String(val));
    },
    [],
  );

  return { balanceVisible, toggle };
}
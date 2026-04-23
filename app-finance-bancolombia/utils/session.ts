import type { AuthContextValue } from "@/interfaces/auth";
import { Alert } from "react-native";

export const confirmSignOut = (auth: AuthContextValue | null): void => {
  Alert.alert("Cerrar sesión", "¿Estás seguro de que quieres cerrar sesión?", [
    { text: "Cancelar", style: "cancel" },
    {
      text: "Cerrar sesión",
      style: "destructive",
      onPress: () => {
        void auth?.signOut();
      },
    },
  ]);
};

import { BCO } from "@/constants/expense";
import { Colors } from "@/constants/theme";
import { confirmSignOut } from "@/utils/session";
import Octicons from "@expo/vector-icons/Octicons";
import { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../_layout";

export default function SettingsScreen() {
  const auth = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Configuración</Text>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => confirmSignOut(auth)}
          activeOpacity={0.9}
        >
          <Octicons name="sign-out" size={18} color={Colors.white} />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BCO.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    color: BCO.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: BCO.muted,
    marginTop: 6,
    fontSize: 14,
  },
  signOutButton: {
    marginTop: 24,
    backgroundColor: Colors.red,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: BCO.divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  signOutText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
});

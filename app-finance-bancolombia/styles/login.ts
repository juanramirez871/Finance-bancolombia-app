import { BCO } from "@/constants/income";
import { Colors } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const loginStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BCO.bg,
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
  banner: {
    width: "300%",
    height: 150,
    transform: [{ translateY: 50 }, { translateX: 65 }],
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

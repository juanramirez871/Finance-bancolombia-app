import { BCO } from "@/constants/income";
import { Colors } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const importingStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BCO.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: BCO.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: BCO.muted,
    marginTop: 10,
    marginBottom: 24,
    textAlign: "center",
  },
  track: {
    width: "100%",
    maxWidth: 360,
    height: 12,
    backgroundColor: "#232325",
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BCO.divider,
  },
  bar: {
    height: "100%",
    backgroundColor: Colors.yellow,
  },
  percent: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.white,
    fontWeight: "700",
  },
  meta: {
    marginTop: 16,
    fontSize: 13,
    color: BCO.muted,
    textAlign: "center",
  },
  error: {
    marginTop: 8,
    fontSize: 12,
    color: "#F59E0B",
    textAlign: "center",
  },
  hero: {
    width: 220,
    height: 220,
    marginBottom: 6,
  },
});

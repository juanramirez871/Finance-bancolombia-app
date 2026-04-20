import { BCO } from "@/constants/income";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BCO.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  totalSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    position: "relative",
  },
  totalHeaderLines: {
    position: "absolute",
    top: -24,
    left: -140,
    width: 520,
    height: 180,
    opacity: 0.95,
    zIndex: -1,
  },
  totalLabel: {
    fontSize: 20,
    color: BCO.muted,
    marginBottom: 6,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: BCO.text,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 15,
    fontWeight: "600",
    color: BCO.text,
  },
});

import { BCO } from "@/constants/income";
import { Colors } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BCO.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
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
  seeAll: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.yellow,
  },
  transactionList: {
    backgroundColor: BCO.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BCO.border,
    overflow: "hidden",
  },
  transactionScroll: {
    maxHeight: 420,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: BCO.divider,
    gap: 12,
  },
  transactionItemLast: {
    borderBottomWidth: 0,
  },
  transactionMain: {
    padding: 10,
    flex: 1,
    gap: 4,
  },
  transactionLabel: {
    fontSize: 14,
    color: BCO.text,
  },
  transactionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  transactionMetaText: {
    fontSize: 12,
    color: BCO.muted,
  },
  transactionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.green,
  },
  chartCard: {
    backgroundColor: BCO.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BCO.border,
    padding: 16,
    overflow: "hidden",
  },
  chartHint: {
    fontSize: 12,
    fontWeight: "500",
    color: BCO.muted,
  },
  chartSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },
  chartSummaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: BCO.text,
  },
  chartSummaryValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.yellow,
  },
  chartLabel: {
    fontSize: 10,
    color: BCO.muted,
  },
  chartYLabel: {
    fontSize: 11,
    color: BCO.muted,
  },
  pointLabelContainer: {
    backgroundColor: Colors.yellow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pointLabelText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  tooltipContainer: {
    width: 140,
    height: 64,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: Colors.white,
  },
  tooltipTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  tooltipValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: BCO.bg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BCO.divider,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: BCO.text,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: BCO.divider,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BCO.border,
    backgroundColor: BCO.card,
  },
  filterChipActive: {
    backgroundColor: Colors.purple,
    borderColor: Colors.purple,
  },
  filterChipText: {
    fontSize: 13,
    color: BCO.text,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  filterSep: {
    fontSize: 14,
    color: BCO.muted,
  },
  clearBtn: {
    marginLeft: 4,
  },
  clearText: {
    fontSize: 13,
    color: BCO.muted,
  },
  pickerDone: {
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BCO.divider,
  },
  pickerDoneText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.yellow,
  },
  modalList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: BCO.muted,
    textTransform: "capitalize",
    marginBottom: 8,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: BCO.muted,
  },
});

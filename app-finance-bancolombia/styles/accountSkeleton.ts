import { BCO } from "@/constants/income";
import { StyleSheet } from "react-native";

export const ACCOUNT_SKELETON_COLOR = "#454545";

export const accountSkeletonStyles = StyleSheet.create({
  block: {
    marginHorizontal: 20,
    marginBottom: 24,
    marginTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  titleLine: {
    height: 20,
    width: 160,
    backgroundColor: ACCOUNT_SKELETON_COLOR,
    borderRadius: 4,
  },
  actionLine: {
    height: 14,
    width: 55,
    backgroundColor: ACCOUNT_SKELETON_COLOR,
    borderRadius: 4,
  },
  card: {
    backgroundColor: BCO.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BCO.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomColor: BCO.divider,
    gap: 12,
  },
  rowContent: {
    padding: 10,
    flex: 1,
    gap: 4,
  },
  mainLine: {
    height: 16,
    width: 150,
    backgroundColor: ACCOUNT_SKELETON_COLOR,
    borderRadius: 3,
  },
  subLine: {
    height: 12,
    width: 90,
    backgroundColor: ACCOUNT_SKELETON_COLOR,
    borderRadius: 2,
  },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amountLine: {
    height: 16,
    width: 75,
    backgroundColor: ACCOUNT_SKELETON_COLOR,
    borderRadius: 3,
  },
});

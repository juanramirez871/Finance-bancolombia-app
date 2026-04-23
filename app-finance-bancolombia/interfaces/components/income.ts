import type { Account, Transaction } from "@/interfaces/income";
import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from "react-native";

export type AccountCardStyles = {
  section: StyleProp<ViewStyle>;
  sectionHeader: StyleProp<ViewStyle>;
  sectionTitle: StyleProp<TextStyle>;
  seeAll: StyleProp<TextStyle>;
  transactionList: StyleProp<ViewStyle>;
  transactionScroll: StyleProp<ViewStyle>;
};

export type AccountCardProps = {
  account: Account;
  styles?: AccountCardStyles & Record<string, unknown>;
  onPressAccount?: () => void;
  getTxAmountColor?: (tx: Transaction) => string | undefined;
};

export type AccountModalStyles = {
  modalSafe: StyleProp<ViewStyle>;
  modalHeader: StyleProp<ViewStyle>;
  modalTitle: StyleProp<TextStyle>;
  filterRow: StyleProp<ViewStyle>;
  filterChipsGroup: StyleProp<ViewStyle>;
  filterChip: StyleProp<ViewStyle>;
  filterChipEqual: StyleProp<ViewStyle>;
  filterChipActive: StyleProp<ViewStyle>;
  filterChipText: StyleProp<TextStyle>;
  filterChipTextActive: StyleProp<TextStyle>;
  filterSep: StyleProp<TextStyle>;
  clearBtn: StyleProp<ViewStyle>;
  clearBtnHidden: StyleProp<ViewStyle>;
  clearText: StyleProp<TextStyle>;
  pickerOverlay: StyleProp<ViewStyle>;
  pickerSheet: StyleProp<ViewStyle>;
  pickerSheetHeader: StyleProp<ViewStyle>;
  pickerSheetCancel: StyleProp<TextStyle>;
  pickerSheetTitle: StyleProp<TextStyle>;
  pickerSheetAction: StyleProp<TextStyle>;
  emptyState: StyleProp<ViewStyle>;
  emptyText: StyleProp<TextStyle>;
  modalList: StyleProp<ViewStyle>;
  dateHeader: StyleProp<TextStyle>;
  transactionList: StyleProp<ViewStyle>;
  failedImage: StyleProp<ImageStyle>;
};

export type AccountFullScreenModalProps = {
  visible: boolean;
  account: Account;
  onClose: () => void;
  styles?: AccountModalStyles & Record<string, unknown>;
  getTxAmountColor?: (tx: Transaction) => string | undefined;
};

export type TransactionRowStyles = {
  transactionItem: StyleProp<ViewStyle>;
  transactionItemLast: StyleProp<ViewStyle>;
  transactionMain: StyleProp<ViewStyle>;
  transactionLabel: StyleProp<TextStyle>;
  transactionMetaRow: StyleProp<ViewStyle>;
  transactionMetaText: StyleProp<TextStyle>;
  transactionRight: StyleProp<ViewStyle>;
  transactionAmount: StyleProp<TextStyle>;
};

export type TransactionRowProps = {
  tx: Transaction;
  isLast: boolean;
  styles?: TransactionRowStyles;
  amountColor?: string;
};

export type AccountSkeletonProps = {
  count?: number;
};

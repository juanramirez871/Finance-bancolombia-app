import { formatTxDate } from "@/utils/income";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Text, View } from "react-native";
import type { Transaction } from "../../interfaces/income";
import { styles as incomeStyles } from "../../styles/income";

type TransactionRowStyles = {
  transactionItem: StyleProp<ViewStyle>;
  transactionItemLast: StyleProp<ViewStyle>;
  transactionMain: StyleProp<ViewStyle>;
  transactionLabel: StyleProp<TextStyle>;
  transactionMetaRow: StyleProp<ViewStyle>;
  transactionMetaText: StyleProp<TextStyle>;
  transactionRight: StyleProp<ViewStyle>;
  transactionAmount: StyleProp<TextStyle>;
};

export function TransactionRow({
  tx,
  isLast,
  styles,
}: {
  tx: Transaction;
  isLast: boolean;
  styles?: TransactionRowStyles;
}) {
  const s = (styles ?? incomeStyles) as unknown as TransactionRowStyles;
  return (
    <View style={[s.transactionItem, isLast && s.transactionItemLast]}>
      <View style={s.transactionMain}>
        <Text style={s.transactionLabel} numberOfLines={1}>
          {tx.label}
        </Text>
        <View style={s.transactionMetaRow}>
          <Text style={s.transactionMetaText}>
            {formatTxDate(tx.date)} · {tx.time}
          </Text>
        </View>
      </View>

      <View style={s.transactionRight}>
        <Text style={s.transactionAmount}>{tx.amount}</Text>
      </View>
    </View>
  );
}

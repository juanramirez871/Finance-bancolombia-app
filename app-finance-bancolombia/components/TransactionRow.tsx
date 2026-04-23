import { formatTxDate } from "@/utils/income";
import type { TransactionRowProps, TransactionRowStyles } from "@/interfaces/components/income";
import { Text, View } from "react-native";
import { styles as incomeStyles } from "../styles/income";

export function TransactionRow({
  tx,
  isLast,
  styles,
  amountColor,
}: TransactionRowProps) {
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
        <Text
          style={[s.transactionAmount, amountColor ? { color: amountColor } : null]}
        >
          {tx.amount}
        </Text>
      </View>
    </View>
  );
}

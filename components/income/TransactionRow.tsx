import { formatTxDate } from "@/utils/income";
import { Text, View } from "react-native";
import type { Transaction } from "../../interfaces/income";
import { styles } from "../../styles/income";

export function TransactionRow({
  tx,
  isLast,
}: {
  tx: Transaction;
  isLast: boolean;
}) {
  return (
    <View
      style={[styles.transactionItem, isLast && styles.transactionItemLast]}
    >
      <View style={styles.transactionMain}>
        <Text style={styles.transactionLabel} numberOfLines={1}>
          {tx.label}
        </Text>
        <View style={styles.transactionMetaRow}>
          <Text style={styles.transactionMetaText}>
            {formatTxDate(tx.date)} · {tx.time}
          </Text>
        </View>
      </View>

      <View style={styles.transactionRight}>
        <Text style={styles.transactionAmount}>{tx.amount}</Text>
      </View>
    </View>
  );
}

import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { Account } from "../../interfaces/income";
import { styles } from "../../styles/income";
import { AccountFullScreenModal } from "./AccountFullScreenModal";
import { TransactionRow } from "./TransactionRow";

export function AccountCard({ account }: { account: Account }) {
  const [expanded, setExpanded] = useState(false);
  const preview = account.transactions;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{account.label}</Text>
        <TouchableOpacity onPress={() => setExpanded(true)}>
          <Text style={styles.seeAll}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionList}>
        <ScrollView
          nestedScrollEnabled
          scrollEnabled={account.transactions.length > 4}
          style={styles.transactionScroll}
          showsVerticalScrollIndicator={false}
        >
          {preview.map((tx, index) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              isLast={index === preview.length - 1}
            />
          ))}
        </ScrollView>
      </View>

      <AccountFullScreenModal
        visible={expanded}
        account={account}
        onClose={() => setExpanded(false)}
      />
    </View>
  );
}

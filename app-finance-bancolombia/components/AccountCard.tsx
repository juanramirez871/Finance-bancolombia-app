import { useState } from "react";
import type { AccountCardProps, AccountCardStyles } from "@/interfaces/components/income";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { styles as incomeStyles } from "../styles/income";
import { AccountFullScreenModal } from "./AccountFullScreenModal";
import { TransactionRow } from "./TransactionRow";

export function AccountCard({
  account,
  styles,
  onPressAccount,
  getTxAmountColor,
}: AccountCardProps) {

  const [expanded, setExpanded] = useState(false);
  const preview = account.transactions;
  const s = (styles ?? incomeStyles) as AccountCardStyles;
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        {onPressAccount ? (
          <TouchableOpacity
            onPress={onPressAccount}
            style={{ flex: 1 }}
            hitSlop={6}
          >
            <Text style={s.sectionTitle}>{account.label}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={s.sectionTitle}>{account.label}</Text>
        )}
        <TouchableOpacity onPress={() => setExpanded(true)}>
          <Text style={s.seeAll}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      <View style={s.transactionList}>
        <ScrollView
          nestedScrollEnabled
          scrollEnabled={account.transactions.length > 4}
          style={s.transactionScroll}
          showsVerticalScrollIndicator={false}
        >
          {preview.map((tx, index) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              isLast={index === preview.length - 1}
              styles={styles as any}
              amountColor={getTxAmountColor?.(tx)}
            />
          ))}
        </ScrollView>
      </View>

      <AccountFullScreenModal
        visible={expanded}
        account={account}
        onClose={() => setExpanded(false)}
        styles={styles as any}
        getTxAmountColor={getTxAmountColor}
      />
    </View>
  );
}

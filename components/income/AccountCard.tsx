import { useState } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { Account } from "../../interfaces/income";
import { styles as incomeStyles } from "../../styles/income";
import { AccountFullScreenModal } from "./AccountFullScreenModal";
import { TransactionRow } from "./TransactionRow";

type AccountCardStyles = {
  section: StyleProp<ViewStyle>;
  sectionHeader: StyleProp<ViewStyle>;
  sectionTitle: StyleProp<TextStyle>;
  seeAll: StyleProp<TextStyle>;
  transactionList: StyleProp<ViewStyle>;
  transactionScroll: StyleProp<ViewStyle>;
};

export function AccountCard({
  account,
  styles,
}: {
  account: Account;
  styles?: AccountCardStyles & Record<string, unknown>;
}) {
  const [expanded, setExpanded] = useState(false);
  const preview = account.transactions;
  const s = (styles ?? incomeStyles) as AccountCardStyles;

  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{account.label}</Text>
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
            />
          ))}
        </ScrollView>
      </View>

      <AccountFullScreenModal
        visible={expanded}
        account={account}
        onClose={() => setExpanded(false)}
        styles={styles as any}
      />
    </View>
  );
}

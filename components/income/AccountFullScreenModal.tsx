import { Colors } from "@/constants/theme";
import { groupTransactionsByDate, toDate } from "@/utils/income";
import Octicons from "@expo/vector-icons/Octicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Account } from "../../interfaces/income";
import { styles } from "../../styles/income";
import { TransactionRow } from "./TransactionRow";

export function AccountFullScreenModal({
  visible,
  account,
  onClose,
}: {
  visible: boolean;
  account: Account;
  onClose: () => void;
}) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [picker, setPicker] = useState<"from" | "to" | null>(null);
  const filteredTx = useMemo(() => {
    return account.transactions.filter((tx) => {
      const txDate = toDate(tx.date);
      if (startDate) {
        const from = new Date(startDate);
        from.setHours(0, 0, 0, 0);
        if (txDate < from) return false;
      }

      if (endDate) {
        const to = new Date(endDate);
        to.setHours(23, 59, 59, 999);
        if (txDate > to) return false;
      }

      return true;
    });
  }, [account.transactions, endDate, startDate]);

  const sections = useMemo(
    () => groupTransactionsByDate(filteredTx),
    [filteredTx],
  );

  const fmt = (d: Date) =>
    d.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{account.label}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Octicons name="x" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, startDate && styles.filterChipActive]}
            onPress={() => setPicker("from")}
          >
            <Octicons
              name="calendar"
              size={13}
              color={startDate ? Colors.white : Colors.purple}
            />
            <Text
              style={[
                styles.filterChipText,
                startDate && styles.filterChipTextActive,
              ]}
            >
              {startDate ? fmt(startDate) : "Desde"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.filterSep}>→</Text>

          <TouchableOpacity
            style={[styles.filterChip, endDate && styles.filterChipActive]}
            onPress={() => setPicker("to")}
          >
            <Octicons
              name="calendar"
              size={13}
              color={endDate ? Colors.white : Colors.purple}
            />
            <Text
              style={[
                styles.filterChipText,
                endDate && styles.filterChipTextActive,
              ]}
            >
              {endDate ? fmt(endDate) : "Hasta"}
            </Text>
          </TouchableOpacity>

          {(startDate || endDate) && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
              <Text style={styles.clearText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>

        {picker !== null && (
          <DateTimePicker
            value={
              picker === "from"
                ? (startDate ?? new Date())
                : (endDate ?? new Date())
            }
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(_, selected) => {
              if (picker === "from") setStartDate(selected ?? null);
              else setEndDate(selected ?? null);
              if (Platform.OS === "android") setPicker(null);
            }}
            maximumDate={new Date()}
          />
        )}

        {picker !== null && Platform.OS === "ios" && (
          <TouchableOpacity
            style={styles.pickerDone}
            onPress={() => setPicker(null)}
          >
            <Text style={styles.pickerDoneText}>Listo</Text>
          </TouchableOpacity>
        )}

        {filteredTx.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Sin transacciones en este rango
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(tx) => tx.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalList}
            renderSectionHeader={({ section }) => (
              <Text style={styles.dateHeader}>{section.title}</Text>
            )}
            renderItem={({ item, index, section }) => (
              <View style={styles.transactionList}>
                <TransactionRow
                  tx={item}
                  isLast={index === section.data.length - 1}
                />
              </View>
            )}
            SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
            stickySectionHeadersEnabled={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

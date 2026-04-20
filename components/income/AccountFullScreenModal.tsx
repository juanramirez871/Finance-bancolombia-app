import { Colors } from "@/constants/theme";
import { groupTransactionsByDate, toDate } from "@/utils/income";
import Octicons from "@expo/vector-icons/Octicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
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

  const handleSelectDate = (selected: Date | null) => {
    if (!selected) return;

    if (picker === "from") {
      setStartDate(selected);
      if (endDate && selected > endDate) setEndDate(selected);
      return;
    }

    if (picker === "to") {
      setEndDate(selected);
      if (startDate && selected < startDate) setStartDate(selected);
    }
  };

  const pickerValue =
    picker === "from"
      ? (startDate ?? new Date())
      : picker === "to"
        ? (endDate ?? new Date())
        : new Date();

  const maximumDate =
    picker === "from"
      ? endDate
        ? new Date(Math.min(endDate.getTime(), Date.now()))
        : new Date()
      : new Date();

  const minimumDate = picker === "to" ? (startDate ?? undefined) : undefined;
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

  const hasFilters = Boolean(startDate || endDate);

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
          <View style={styles.filterChipsGroup}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                styles.filterChipEqual,
                startDate && styles.filterChipActive,
              ]}
              onPress={() => setPicker("from")}
            >
              <Octicons
                name="calendar"
                size={13}
                color={startDate ? Colors.white : Colors.purple}
              />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
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
              style={[
                styles.filterChip,
                styles.filterChipEqual,
                endDate && styles.filterChipActive,
              ]}
              onPress={() => setPicker("to")}
            >
              <Octicons
                name="calendar"
                size={13}
                color={endDate ? Colors.white : Colors.purple}
              />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.filterChipText,
                  endDate && styles.filterChipTextActive,
                ]}
              >
                {endDate ? fmt(endDate) : "Hasta"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={clearFilters}
            style={[styles.clearBtn, !hasFilters && styles.clearBtnHidden]}
            disabled={!hasFilters}
          >
            <Text style={styles.clearText}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        {picker !== null && Platform.OS === "android" && (
          <DateTimePicker
            value={pickerValue}
            mode="date"
            display="default"
            onChange={(_, selected) => {
              handleSelectDate(selected ?? null);
              setPicker(null);
            }}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
          />
        )}

        {picker !== null && Platform.OS === "ios" && (
          <Modal
            transparent
            animationType="fade"
            visible
            presentationStyle="overFullScreen"
            onRequestClose={() => setPicker(null)}
          >
            <Pressable
              style={styles.pickerOverlay}
              onPress={() => setPicker(null)}
            >
              <Pressable style={styles.pickerSheet} onPress={() => {}}>
                <View style={styles.pickerSheetHeader}>
                  <TouchableOpacity
                    onPress={() => setPicker(null)}
                    hitSlop={12}
                  >
                    <Text style={styles.pickerSheetCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerSheetTitle}>
                    {picker === "from" ? "Desde" : "Hasta"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setPicker(null)}
                    hitSlop={12}
                  >
                    <Text style={styles.pickerSheetAction}>Listo</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={pickerValue}
                  mode="date"
                  display="spinner"
                  onChange={(_, selected) => handleSelectDate(selected ?? null)}
                  maximumDate={maximumDate}
                  minimumDate={minimumDate}
                />
              </Pressable>
            </Pressable>
          </Modal>
        )}

        {filteredTx.length === 0 ? (
          <View style={styles.emptyState}>
            <Image
              source={require("@/assets/images/failed.png")}
              style={styles.failedImage}
            />
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

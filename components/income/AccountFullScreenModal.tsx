import { Colors } from "@/constants/theme";
import { groupTransactionsByDate, toDate } from "@/utils/income";
import Octicons from "@expo/vector-icons/Octicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
  type ImageStyle,
  Modal,
  Platform,
  Pressable,
  SectionList,
  type StyleProp,
  Text,
  type TextStyle,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Account } from "../../interfaces/income";
import { styles as incomeStyles } from "../../styles/income";
import { TransactionRow } from "./TransactionRow";

type AccountModalStyles = {
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

export function AccountFullScreenModal({
  visible,
  account,
  onClose,
  styles,
}: {
  visible: boolean;
  account: Account;
  onClose: () => void;
  styles?: AccountModalStyles & Record<string, unknown>;
}) {
  const s = (styles ?? incomeStyles) as AccountModalStyles;
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
      <SafeAreaView style={s.modalSafe}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>{account.label}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Octicons name="x" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={s.filterRow}>
          <View style={s.filterChipsGroup}>
            <TouchableOpacity
              style={[
                s.filterChip,
                s.filterChipEqual,
                startDate && s.filterChipActive,
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
                style={[s.filterChipText, startDate && s.filterChipTextActive]}
              >
                {startDate ? fmt(startDate) : "Desde"}
              </Text>
            </TouchableOpacity>

            <Text style={s.filterSep}>→</Text>

            <TouchableOpacity
              style={[
                s.filterChip,
                s.filterChipEqual,
                endDate && s.filterChipActive,
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
                style={[s.filterChipText, endDate && s.filterChipTextActive]}
              >
                {endDate ? fmt(endDate) : "Hasta"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={clearFilters}
            style={[s.clearBtn, !hasFilters && s.clearBtnHidden]}
            disabled={!hasFilters}
          >
            <Text style={s.clearText}>Limpiar</Text>
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
            <Pressable style={s.pickerOverlay} onPress={() => setPicker(null)}>
              <Pressable style={s.pickerSheet} onPress={() => {}}>
                <View style={s.pickerSheetHeader}>
                  <TouchableOpacity
                    onPress={() => setPicker(null)}
                    hitSlop={12}
                  >
                    <Text style={s.pickerSheetCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={s.pickerSheetTitle}>
                    {picker === "from" ? "Desde" : "Hasta"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setPicker(null)}
                    hitSlop={12}
                  >
                    <Text style={s.pickerSheetAction}>Listo</Text>
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
          <View style={s.emptyState}>
            <Image
              source={require("@/assets/images/failed.png")}
              style={s.failedImage}
            />
            <Text style={s.emptyText}>Sin transacciones en este rango</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(tx) => tx.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.modalList}
            renderSectionHeader={({ section }) => (
              <Text style={s.dateHeader}>{section.title}</Text>
            )}
            renderItem={({ item, index, section }) => (
              <View style={s.transactionList}>
                <TransactionRow
                  tx={item}
                  isLast={index === section.data.length - 1}
                  styles={styles as any}
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

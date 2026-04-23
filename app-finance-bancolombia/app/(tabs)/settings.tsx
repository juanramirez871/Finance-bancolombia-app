import { BCO } from "@/constants/expense";
import { Colors } from "@/constants/theme";
import { api } from "@/utils/api";
import { confirmSignOut } from "@/utils/session";
import Octicons from "@expo/vector-icons/Octicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useContext, useMemo, useState } from "react";
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext, TransactionFilterContext } from "../_layout";

type PickerTarget = "from" | "to" | null;

const formatIso = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseIsoDate = (dateValue: string): Date => {
  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
};

const formatLabelDate = (dateValue: string): string =>
  parseIsoDate(dateValue).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function SettingsScreen() {
  const auth = useContext(AuthContext);
  const transactionFilter = useContext(TransactionFilterContext);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [syncing, setSyncing] = useState(false);

  const fromDate = useMemo(
    () => parseIsoDate(transactionFilter?.startDate ?? formatIso(new Date())),
    [transactionFilter?.startDate],
  );
  const toDate = useMemo(
    () => parseIsoDate(transactionFilter?.endDate ?? formatIso(new Date())),
    [transactionFilter?.endDate],
  );

  const pickerValue = pickerTarget === "to" ? toDate : fromDate;
  const maxDate = pickerTarget === "from" ? toDate : new Date();
  const minDate = pickerTarget === "to" ? fromDate : undefined;

  const applyDateSelection = async (selectedDate: Date | null) => {
    if (!selectedDate || !transactionFilter || !pickerTarget) {
      return;
    }

    const selectedIso = formatIso(selectedDate);
    if (pickerTarget === "from") {
      const end = transactionFilter.endDate;
      const normalizedEnd = selectedIso > end ? selectedIso : end;
      await transactionFilter.setRange(selectedIso, normalizedEnd);
      return;
    }

    const start = transactionFilter.startDate;
    const normalizedStart = selectedIso < start ? selectedIso : start;
    await transactionFilter.setRange(normalizedStart, selectedIso);
  };

  const resetToCurrentYear = async () => {
    if (!transactionFilter) {
      return;
    }

    await transactionFilter.resetToCurrentYear();
  };

  const handleSync = async () => {
    if (syncing) {
      return;
    }

    try {
      setSyncing(true);
      const result = await api.syncEmails();
      Alert.alert(
        "Sincronización completada",
        `Rango: ${result.start_date} a ${result.end_date}\nGuardadas: ${result.saved}\nOmitidas: ${result.skipped}`,
      );
    } catch (error) {
      Alert.alert(
        "Error de sincronización",
        error instanceof Error ? error.message : "No se pudo sincronizar.",
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Configuración</Text>

        <View style={styles.filterSection}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.cardTitle}>Filtro de transacciones</Text>
              <Text style={styles.cardHint}>Se aplica en Ingresos y Egresos.</Text>
            </View>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetToCurrentYear}
            >
              <Octicons name="sync" size={13} color={Colors.yellow} />
              <Text numberOfLines={1} style={styles.resetText}>Año actual</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rangeRow}>
            <TouchableOpacity style={styles.rangeItem} onPress={() => setPickerTarget("from")}>
              <Text style={styles.rangeLabel}>Desde</Text>
              <View style={styles.rangeValueRow}>
                <Octicons name="calendar" size={13} color={Colors.yellow} />
                <Text style={styles.rangeChipText}>
                  {formatLabelDate(transactionFilter?.startDate ?? formatIso(new Date()))}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.rangeItem} onPress={() => setPickerTarget("to")}>
              <Text style={styles.rangeLabel}>Hasta</Text>
              <View style={styles.rangeValueRow}>
                <Octicons name="calendar" size={13} color={Colors.yellow} />
                <Text style={styles.rangeChipText}>
                  {formatLabelDate(transactionFilter?.endDate ?? formatIso(new Date()))}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
          onPress={() => {
            void handleSync();
          }}
          activeOpacity={0.9}
          disabled={syncing}
        >
          <Octicons name="sync" size={18} color={Colors.black} />
          <Text style={styles.syncButtonText}>
            {syncing ? "Sincronizando..." : "Sincronizar correos"}
          </Text>
        </TouchableOpacity>

        {pickerTarget !== null && Platform.OS === "android" ? (
          <DateTimePicker
            value={pickerValue}
            mode="date"
            display="default"
            onChange={(_, selected) => {
              void applyDateSelection(selected ?? null);
              setPickerTarget(null);
            }}
            maximumDate={maxDate}
            minimumDate={minDate}
          />
        ) : null}

        {pickerTarget !== null && Platform.OS === "ios" ? (
          <Modal
            transparent
            animationType="fade"
            visible
            presentationStyle="overFullScreen"
            onRequestClose={() => setPickerTarget(null)}
          >
            <Pressable style={styles.pickerOverlay} onPress={() => setPickerTarget(null)}>
              <Pressable style={styles.pickerSheet} onPress={() => {}}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setPickerTarget(null)} hitSlop={12}>
                    <Text style={styles.pickerCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>{pickerTarget === "from" ? "Desde" : "Hasta"}</Text>
                  <TouchableOpacity
                    onPress={async () => {
                      await applyDateSelection(pickerValue);
                      setPickerTarget(null);
                    }}
                    hitSlop={12}
                  >
                    <Text style={styles.pickerDone}>Listo</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={pickerValue}
                  mode="date"
                  display="spinner"
                  onChange={(_, selected) => {
                    if (selected) {
                      void applyDateSelection(selected);
                    }
                  }}
                  maximumDate={maxDate}
                  minimumDate={minDate}
                  themeVariant="dark"
                />
              </Pressable>
            </Pressable>
          </Modal>
        ) : null}

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => confirmSignOut(auth)}
          activeOpacity={0.9}
        >
          <Octicons name="sign-out" size={18} color={Colors.white} />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BCO.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    color: BCO.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: BCO.muted,
    marginTop: 6,
    fontSize: 14,
  },
  filterSection: {
    marginTop: 20,
    paddingVertical: 6,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: BCO.text,
    fontSize: 16,
    fontWeight: "700",
  },
  cardHint: {
    color: BCO.muted,
    fontSize: 12,
    marginTop: 2,
  },
  rangeRow: {
    gap: 10,
  },
  rangeItem: {
    borderWidth: 1,
    borderColor: BCO.divider,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 4,
  },
  rangeLabel: {
    color: BCO.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  rangeValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rangeChipText: {
    color: BCO.text,
    fontSize: 13,
    fontWeight: "600",
  },
  resetButton: {
    alignSelf: "flex-start",
    flexShrink: 0,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BCO.divider,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BCO.bg,
  },
  resetText: {
    color: Colors.yellow,
    fontSize: 12,
    fontWeight: "700",
  },
  persistHint: {
    color: BCO.muted,
    fontSize: 11,
  },
  syncButton: {
    marginTop: 14,
    backgroundColor: Colors.yellow,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: BCO.divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  syncButtonDisabled: {
    opacity: 0.65,
  },
  syncButtonText: {
    color: Colors.black,
    fontSize: 15,
    fontWeight: "800",
  },
  signOutButton: {
    marginTop: 24,
    backgroundColor: Colors.red,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: BCO.divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  signOutText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  pickerSheet: {
    backgroundColor: BCO.bg,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: BCO.divider,
    paddingBottom: 16,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BCO.divider,
  },
  pickerTitle: {
    color: BCO.text,
    fontSize: 14,
    fontWeight: "600",
  },
  pickerCancel: {
    color: BCO.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  pickerDone: {
    color: Colors.yellow,
    fontSize: 14,
    fontWeight: "700",
  },
});

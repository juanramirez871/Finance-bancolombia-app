import { AccountCard } from "@/components/income/AccountCard";
import {
  ACCOUNTS,
  ASSETS_CHART_DATA,
  BCO,
  EXPENSES_CHART_DATA,
} from "@/constants/expense";
import { Colors } from "@/constants/theme";
import { styles } from "@/styles/expense";
import { useTransactions } from "@/hooks/useTransactions";
import Octicons from "@expo/vector-icons/Octicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useCallback, useContext, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../_layout";
import { useBalanceVisible } from "@/hooks/useBalanceVisible";
import type { Transaction } from "@/interfaces/income";

const STEP_CANDIDATES = [
  50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
  10_000_000,
];

function niceStep(stepRaw: number) {
  return (
    STEP_CANDIDATES.find((c) => c >= stepRaw) ??
    Math.ceil(stepRaw / 10_000_000) * 10_000_000
  );
}

function buildScale(values: number[]) {
  const noOfSections = 4;
  const max = Math.max(...values);
  const stepValue = niceStep(Math.ceil(max / noOfSections));
  return { maxValue: stepValue * noOfSections, noOfSections, stepValue };
}

function isFailedPayment(label: string) {
  return /fallid|rechaz|declinad|no\s*proces|error/i.test(label);
}

export default function ExpenseScreen() {
  const auth = useContext(AuthContext);
  const { balanceVisible, toggle: setBalanceVisible } = useBalanceVisible();
  const { expenseAccounts, loading } = useTransactions();

  const handleSignOut = useCallback(() => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: () => auth?.signOut(),
        },
      ],
    );
  }, [auth]);
  const [expensesSelectedIndex, setExpensesSelectedIndex] = useState(3);
  const [accountChartsVisible, setAccountChartsVisible] = useState(false);
  const [accountSelectedId, setAccountSelectedId] = useState<string | null>(
    null,
  );
  const [accountExpensesSelectedIndex, setAccountExpensesSelectedIndex] =
    useState(3);
  const [accountAssetsSelectedIndex, setAccountAssetsSelectedIndex] =
    useState(7);

  const formatCOP = useCallback(
    (value: number) =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(value),
    [],
  );

  const formatCompactCOP = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `$${Math.round(value / 1_000)}k`;
    return `$${value}`;
  };

  const expensesScale = useMemo(() => {
    return buildScale(EXPENSES_CHART_DATA.map((d) => d.value));
  }, []);

  const expensesSelected =
    EXPENSES_CHART_DATA[expensesSelectedIndex] ?? EXPENSES_CHART_DATA[0];

  const expensesLineData = useMemo(
    () =>
      EXPENSES_CHART_DATA.map((d) => ({
        value: d.value,
        label: d.label,
        dataPointColor: d.frontColor,
        dataPointRadius: 4,
        focusedDataPointColor: Colors.yellow,
        focusedDataPointRadius: 6,
        focusedDataPointLabelComponent: () => (
          <View style={styles.pointLabelContainer}>
            <Text style={styles.pointLabelText}>{formatCOP(d.value)}</Text>
          </View>
        ),
      })),
    [formatCOP],
  );

  const accountSelected = useMemo(() => {
    if (!accountSelectedId) return null;
    return ACCOUNTS.find((a) => a.id === accountSelectedId) ?? null;
  }, [accountSelectedId]);

  const accountFactor = useMemo(() => {
    if (!accountSelectedId) return 1;
    const id = Number(accountSelectedId);
    const base = Number.isFinite(id) ? id : accountSelectedId.length;
    return 0.82 + (base % 6) * 0.06;
  }, [accountSelectedId]);

  const accountExpensesData = useMemo(
    () =>
      EXPENSES_CHART_DATA.map((d) => ({
        ...d,
        value: Math.round((d.value * accountFactor) / 1_000) * 1_000,
      })),
    [accountFactor],
  );

  const accountAssetsData = useMemo(
    () =>
      ASSETS_CHART_DATA.map((d) => ({
        ...d,
        value: Math.round((d.value * (accountFactor + 0.08)) / 1_000) * 1_000,
      })),
    [accountFactor],
  );

  const accountExpensesScale = useMemo(
    () => buildScale(accountExpensesData.map((d) => d.value)),
    [accountExpensesData],
  );

  const accountAssetsScale = useMemo(
    () => buildScale(accountAssetsData.map((d) => d.value)),
    [accountAssetsData],
  );

  const accountExpensesSelected =
    accountExpensesData[accountExpensesSelectedIndex] ?? accountExpensesData[0];
  const accountAssetsSelected =
    accountAssetsData[accountAssetsSelectedIndex] ?? accountAssetsData[0];

  const accountExpensesLineData = useMemo(
    () =>
      accountExpensesData.map((d) => ({
        value: d.value,
        label: d.label,
        dataPointColor: d.frontColor,
        dataPointRadius: 4,
        focusedDataPointColor: Colors.yellow,
        focusedDataPointRadius: 6,
        focusedDataPointLabelComponent: () => (
          <View style={styles.pointLabelContainer}>
            <Text style={styles.pointLabelText}>{formatCOP(d.value)}</Text>
          </View>
        ),
      })),
    [accountExpensesData, formatCOP],
  );

  const accountAssetsLineData = useMemo(
    () =>
      accountAssetsData.map((d) => ({
        value: d.value,
        label: d.label,
        dataPointColor: d.frontColor,
        dataPointRadius: 4,
        focusedDataPointColor: Colors.yellow,
        focusedDataPointRadius: 6,
        focusedDataPointLabelComponent: () => (
          <View style={styles.pointLabelContainer}>
            <Text style={styles.pointLabelText}>{formatCOP(d.value)}</Text>
          </View>
        ),
      })),
    [accountAssetsData, formatCOP],
  );

  const openAccountCharts = useCallback((accountId: string) => {
    setAccountSelectedId(accountId);
    setAccountExpensesSelectedIndex(3);
    setAccountAssetsSelectedIndex(7);
    setAccountChartsVisible(true);
  }, []);

  const getTxAmountColor = useCallback((tx: Transaction) => {
    return isFailedPayment(tx.label) ? Colors.blue : undefined;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.totalSection}>
          <Image
            source={require("@/assets/images/cards.svg")}
            style={styles.totalHeaderLines}
            contentFit="contain"
            pointerEvents="none"
          />
          <View style={{ marginTop: 70 }}>
            <Text style={styles.totalLabel}>Total</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalAmount}>
                {balanceVisible ? "$2'441.000" : "••••••••"}
              </Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <TouchableOpacity onPress={handleSignOut}>
                  <Octicons name="sign-out" size={22} color={BCO.muted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
                  <Octicons
                    name={balanceVisible ? "eye" : "eye-closed"}
                    size={22}
                    color={BCO.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.red} />
        ) : (
          expenseAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              styles={styles}
              onPressAccount={() => openAccountCharts(account.id)}
              getTxAmountColor={getTxAmountColor}
            />
          ))
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
              Gastos anuales
            </Text>
            <Text style={styles.chartHint}>Toca un mes</Text>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chartSummaryRow}>
              <Text style={styles.chartSummaryLabel}>
                {expensesSelected?.label ?? "—"}
              </Text>
              <Text style={[styles.chartSummaryValue, { color: Colors.red }]}>
                {expensesSelected ? formatCOP(expensesSelected.value) : "—"}
              </Text>
            </View>
            <LineChart
              data={expensesLineData}
              maxValue={expensesScale.maxValue}
              noOfSections={expensesScale.noOfSections}
              stepValue={expensesScale.stepValue}
              adjustToWidth
              initialSpacing={8}
              endSpacing={8}
              spacing={26}
              height={180}
              thickness={3}
              color={Colors.red}
              areaChart
              startFillColor={Colors.red}
              endFillColor={Colors.red}
              startOpacity={0.22}
              endOpacity={0.04}
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              xAxisLabelTextStyle={styles.chartLabel}
              yAxisTextStyle={styles.chartYLabel}
              formatYLabel={(label: string) =>
                formatCompactCOP(Number(label || 0))
              }
              focusEnabled
              showDataPointLabelOnFocus
              unFocusOnPressOut={false}
              isAnimated
              animateOnDataChange
              onPress={async (_item: unknown, index: number) => {
                setExpensesSelectedIndex(index);
                await Haptics.selectionAsync();
              }}
            />
          </View>
        </View>

        <View>
          <Image
            source={require("@/assets/images/banner.svg")}
            pointerEvents="none"
            style={styles.banner}
          />
        </View>
      </ScrollView>

      <Modal
        visible={accountChartsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAccountChartsVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {accountSelected?.label ?? "Cuenta"}
            </Text>
            <TouchableOpacity
              onPress={() => setAccountChartsVisible(false)}
              hitSlop={12}
            >
              <Octicons name="x" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalList}
          >
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                  Gastos anuales
                </Text>
                <Text style={styles.chartHint}>Toca un mes</Text>
              </View>
              <View style={styles.chartCard}>
                <View style={styles.chartSummaryRow}>
                  <Text style={styles.chartSummaryLabel}>
                    {accountExpensesSelected?.label ?? "—"}
                  </Text>
                  <Text
                    style={[styles.chartSummaryValue, { color: Colors.red }]}
                  >
                    {accountExpensesSelected
                      ? formatCOP(accountExpensesSelected.value)
                      : "—"}
                  </Text>
                </View>
                <LineChart
                  data={accountExpensesLineData}
                  maxValue={accountExpensesScale.maxValue}
                  noOfSections={accountExpensesScale.noOfSections}
                  stepValue={accountExpensesScale.stepValue}
                  adjustToWidth
                  initialSpacing={8}
                  endSpacing={8}
                  spacing={26}
                  height={180}
                  thickness={3}
                  color={Colors.red}
                  areaChart
                  startFillColor={Colors.red}
                  endFillColor={Colors.red}
                  startOpacity={0.22}
                  endOpacity={0.04}
                  hideRules
                  xAxisThickness={0}
                  yAxisThickness={0}
                  xAxisLabelTextStyle={styles.chartLabel}
                  yAxisTextStyle={styles.chartYLabel}
                  formatYLabel={(label: string) =>
                    formatCompactCOP(Number(label || 0))
                  }
                  focusEnabled
                  showDataPointLabelOnFocus
                  unFocusOnPressOut={false}
                  isAnimated
                  animateOnDataChange
                  onPress={async (_item: unknown, index: number) => {
                    setAccountExpensesSelectedIndex(index);
                    await Haptics.selectionAsync();
                  }}
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                  Activos
                </Text>
                <Text style={styles.chartHint}>Toca un mes</Text>
              </View>
              <View style={styles.chartCard}>
                <View style={styles.chartSummaryRow}>
                  <Text style={styles.chartSummaryLabel}>
                    {accountAssetsSelected?.label ?? "—"}
                  </Text>
                  <Text style={styles.chartSummaryValue}>
                    {accountAssetsSelected
                      ? formatCOP(accountAssetsSelected.value)
                      : "—"}
                  </Text>
                </View>
                <LineChart
                  data={accountAssetsLineData}
                  maxValue={accountAssetsScale.maxValue}
                  noOfSections={accountAssetsScale.noOfSections}
                  stepValue={accountAssetsScale.stepValue}
                  adjustToWidth
                  initialSpacing={8}
                  endSpacing={8}
                  spacing={26}
                  height={180}
                  thickness={3}
                  color={Colors.green}
                  areaChart
                  startFillColor={Colors.green}
                  endFillColor={Colors.green}
                  startOpacity={0.18}
                  endOpacity={0.04}
                  hideRules
                  xAxisThickness={0}
                  yAxisThickness={0}
                  xAxisLabelTextStyle={styles.chartLabel}
                  yAxisTextStyle={styles.chartYLabel}
                  formatYLabel={(label: string) =>
                    formatCompactCOP(Number(label || 0))
                  }
                  focusEnabled
                  showDataPointLabelOnFocus
                  unFocusOnPressOut={false}
                  isAnimated
                  animateOnDataChange
                  onPress={async (_item: unknown, index: number) => {
                    setAccountAssetsSelectedIndex(index);
                    await Haptics.selectionAsync();
                  }}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

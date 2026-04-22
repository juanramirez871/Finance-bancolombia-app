import { AccountCard } from "@/components/income/AccountCard";
import { AccountSkeleton } from "@/components/income/AccountSkeleton";
import { AnnualLineChart } from "@/components/AnnualLineChart";
import { BCO } from "@/constants/expense";
import { Colors } from "@/constants/theme";
import { styles } from "@/styles/expense";
import { useTransactions } from "@/hooks/useTransactions";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { useCallback, useContext, useMemo, useState } from "react";
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../_layout";
import { useBalanceVisible } from "@/hooks/useBalanceVisible";
import { SkeletonLine } from "@/components/SkeletonLine";
import type { Transaction } from "@/interfaces/income";
import { toDate } from "@/utils/income";

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

function isFailedPayment(label: string) {
  return /fallid|rechaz|declinad|no\s*proces|error/i.test(label);
}

function buildAnnualSeries(transactions: Transaction[]) {
  const monthlyTotals: Record<string, number> = {};
  let latestTs: number | null = null;

  transactions.forEach((tx) => {
    if (!tx.date) return;
    const clean = tx.amount.replace(/[^0-9]/g, "");
    const numeric = parseInt(clean, 10);
    if (isNaN(numeric)) return;

    const date = toDate(tx.date);
    const ts = date.getTime();
    if (Number.isNaN(ts)) return;
    if (latestTs === null || ts > latestTs) latestTs = ts;

    const month = date.getMonth();
    const key = `${date.getFullYear()}-${String(month + 1).padStart(2, "0")}`;
    monthlyTotals[key] = (monthlyTotals[key] ?? 0) + numeric;
  });

  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const chartYear =
    latestTs !== null ? new Date(latestTs).getFullYear() : new Date().getFullYear();

  let yearTotal = 0;
  let cumulative = 0;

  const monthlyData = months.map((label, i) => {
    const key = `${chartYear}-${String(i + 1).padStart(2, "0")}`;
    const value = monthlyTotals[key] ?? 0;
    yearTotal += value;
    cumulative += value;
    return { label, value };
  });

  const assetData = months.map((label, i) => {
    const key = `${chartYear}-${String(i + 1).padStart(2, "0")}`;
    const value = monthlyTotals[key] ?? 0;
    return { label, value: monthlyData.slice(0, i + 1).reduce((sum, item) => sum + item.value, 0) };
  });

  return { chartYear, monthlyData, assetData, yearTotal };
}

export default function ExpenseScreen() {
  const auth = useContext(AuthContext);
  const { balanceVisible, toggle: setBalanceVisible } = useBalanceVisible();
  const { expenseAccounts, loading } = useTransactions();

  const expenseAnnual = useMemo(() => {
    const monthlyTotals: Record<string, number> = {};
    let latestTs: number | null = null;
    expenseAccounts.forEach((account) => {
      account.transactions.forEach((tx) => {
        if (!tx.date) return;
        const clean = tx.amount.replace(/[^0-9]/g, "");
        const numeric = parseInt(clean, 10);
        if (isNaN(numeric)) return;
        const date = toDate(tx.date);
        const ts = date.getTime();
        if (Number.isNaN(ts)) return;
        if (latestTs === null || ts > latestTs) latestTs = ts;
        const month = date.getMonth();
        const key = `${date.getFullYear()}-${String(month + 1).padStart(2, "0")}`;
        monthlyTotals[key] = (monthlyTotals[key] ?? 0) + numeric;
      });
    });

    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const chartYear =
      latestTs !== null
        ? new Date(latestTs).getFullYear()
        : new Date().getFullYear();
    let yearTotal = 0;
    const data = months.map((label, i) => {
      const key = `${chartYear}-${String(i + 1).padStart(2, "0")}`;
      const value = monthlyTotals[key] ?? 0;
      yearTotal += value;
      return {
        label,
        value,
        frontColor: Colors.red,
      };
    });

    return { chartYear, data, yearTotal };
  }, [expenseAccounts]);

  const expenseChartData = expenseAnnual.data;
  const totalExpense = expenseAnnual.yearTotal;

  const expenseScale = useMemo(() => {
    const noOfSections = 4;
    const max = Math.max(...expenseChartData.map((d) => d.value), 1);
    const stepValue = niceStep(Math.ceil(max / noOfSections));
    return { maxValue: stepValue * noOfSections, noOfSections, stepValue };
  }, [expenseChartData]);

  const assetsChartData = useMemo(() => {
    const monthlyTotals: Record<string, number> = {};
    let latestTs: number | null = null;
    expenseAccounts.forEach((account) => {
      account.transactions.forEach((tx) => {
        if (!tx.date) return;
        const clean = tx.amount.replace(/[^0-9]/g, "");
        const numeric = parseInt(clean, 10);
        if (isNaN(numeric)) return;
        const date = toDate(tx.date);
        const ts = date.getTime();
        if (Number.isNaN(ts)) return;
        if (latestTs === null || ts > latestTs) latestTs = ts;
        const month = date.getMonth();
        const key = `${date.getFullYear()}-${String(month + 1).padStart(2, "0")}`;
        monthlyTotals[key] = (monthlyTotals[key] ?? 0) + numeric;
      });
    });
    
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const chartYear =
      latestTs !== null ? new Date(latestTs).getFullYear() : new Date().getFullYear();
    let cumulative = 0;
    return months.map((label, i) => {
      const key = `${chartYear}-${String(i + 1).padStart(2, "0")}`;
      cumulative += monthlyTotals[key] ?? 0;
      return {
        label,
        value: cumulative,
        frontColor: Colors.green,
      };
    });
  }, [expenseAccounts]);

  const assetsScale = useMemo(() => {
    const noOfSections = 4;
    const max = Math.max(...assetsChartData.map((d) => d.value), 1);
    const stepValue = niceStep(Math.ceil(max / noOfSections));
    return { maxValue: stepValue * noOfSections, noOfSections, stepValue };
  }, [assetsChartData]);

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
  const [accountChartsVisible, setAccountChartsVisible] = useState(false);
  const [accountSelectedId, setAccountSelectedId] = useState<string | null>(
    null,
  );

  const accountSelected = useMemo(
    () => expenseAccounts.find((a) => a.id === accountSelectedId) ?? null,
    [accountSelectedId, expenseAccounts],
  );

  const accountAnnual = useMemo(() => {
    if (!accountSelected) return null;

    const annual = buildAnnualSeries(accountSelected.transactions);

    const buildScale = (values: number[]) => {
      const noOfSections = 4;
      const max = Math.max(...values, 1);
      const stepValue = niceStep(Math.ceil(max / noOfSections));
      return { maxValue: stepValue * noOfSections, noOfSections, stepValue };
    };

    return {
      expenseData: annual.monthlyData,
      assetData: annual.assetData,
      yearTotal: annual.yearTotal,
      expenseScale: buildScale(annual.monthlyData.map((d) => d.value)),
      assetScale: buildScale(annual.assetData.map((d) => d.value)),
    };
  }, [accountSelected]);

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

  const getTxAmountColor = useCallback((tx: Transaction) => {
    return isFailedPayment(tx.label) ? Colors.blue : undefined;
  }, []);

  const openAccountCharts = useCallback((accountId: string) => {
    setAccountSelectedId(accountId);
    setAccountChartsVisible(true);
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
              {loading ? (
                <SkeletonLine width={230} height={36} borderRadius={4} />
              ) : (
                <Text style={styles.totalAmount}>
                  {balanceVisible ? formatCOP(totalExpense) : "••••••••"}
                </Text>
              )}
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
          <AccountSkeleton count={1} />
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
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chartSummaryRow}>
              <Text style={styles.chartSummaryLabel}>Total año</Text>
              <Text style={[styles.chartSummaryValue, { color: Colors.red }]}>
                {balanceVisible ? formatCOP(totalExpense) : "••••••••"}
              </Text>
            </View>
            <AnnualLineChart
              data={expenseChartData}
              color={Colors.red}
              maxValue={expenseScale.maxValue}
              stepValue={expenseScale.stepValue}
              formatValue={formatCompactCOP}
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
                  {accountSelected?.label ?? "Cuenta"}
                </Text>
              </View>
              <View style={styles.chartCard}>
                <View style={styles.chartSummaryRow}>
                  <Text style={styles.chartSummaryLabel}>Gastos anuales</Text>
                  <Text style={[styles.chartSummaryValue, { color: Colors.red }]}>
                    {accountAnnual ? formatCOP(accountAnnual.yearTotal) : "—"}
                  </Text>
                </View>
                {accountAnnual ? (
                  <AnnualLineChart
                    data={accountAnnual.expenseData}
                    color={Colors.red}
                    maxValue={accountAnnual.expenseScale.maxValue}
                    stepValue={accountAnnual.expenseScale.stepValue}
                    formatValue={formatCompactCOP}
                  />
                ) : null}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Activos</Text>
              </View>
              <View style={styles.chartCard}>
                <View style={styles.chartSummaryRow}>
                  <Text style={styles.chartSummaryLabel}>Total acumulado</Text>
                  <Text style={styles.chartSummaryValue}>
                    {accountAnnual ? formatCOP(accountAnnual.assetData.at(-1)?.value ?? 0) : "—"}
                  </Text>
                </View>
                {accountAnnual ? (
                  <AnnualLineChart
                    data={accountAnnual.assetData}
                    color={Colors.green}
                    maxValue={accountAnnual.assetScale.maxValue}
                    stepValue={accountAnnual.assetScale.stepValue}
                    formatValue={formatCompactCOP}
                  />
                ) : null}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

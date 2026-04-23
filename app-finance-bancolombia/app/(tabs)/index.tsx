import { AccountCard } from "@/components/income/AccountCard";
import { AccountSkeleton } from "@/components/income/AccountSkeleton";
import { AnnualLineChart } from "@/components/AnnualLineChart";
import { BCO } from "@/constants/income";
import { Colors } from "@/constants/theme";
import { styles } from "@/styles/income";
import { useTransactions } from "@/hooks/useTransactions";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { useCallback, useContext, useMemo } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../_layout";
import { useBalanceVisible } from "@/hooks/useBalanceVisible";
import { SkeletonLine } from "@/components/SkeletonLine";
import { toDate } from "@/utils/income";

export default function IncomeScreen() {
  const auth = useContext(AuthContext);
  const { balanceVisible, toggle: setBalanceVisible } = useBalanceVisible();
  const { incomeAccounts, loading } = useTransactions(Boolean(auth?.isAuthenticated));

  const incomeAnnual = useMemo(() => {
    const monthlyTotals: Record<string, number> = {};
    let latestTs: number | null = null;
    incomeAccounts.forEach((account) => {
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
        frontColor: Colors.purple,
      };
    });

    return { chartYear, data, yearTotal };
  }, [incomeAccounts]);

  const incomeChartData = incomeAnnual.data;
  const totalIncome = incomeAnnual.yearTotal;

  const commerceAnnual = useMemo(() => {
    const totals: Record<string, number> = {};

    incomeAccounts.forEach((account) => {
      account.transactions.forEach((tx) => {
        const clean = tx.amount.replace(/[^0-9]/g, "");
        const numeric = parseInt(clean, 10);
        if (isNaN(numeric)) return;

        const key = tx.merchant?.trim() || tx.person?.trim() || tx.account_to?.trim() || tx.label;
        totals[key] = (totals[key] ?? 0) + numeric;
      });
    });

    const data = Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);

    const noOfSections = 4;
    const max = Math.max(...data.map((d) => d.value), 1);
    const stepValue = getScaleStep(Math.ceil(max / noOfSections));

    return {
      data,
      total: data[0]?.value ?? 0,
      scale: { maxValue: stepValue * noOfSections, noOfSections, stepValue },
    };
  }, [incomeAccounts]);

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

  function getScaleStep(stepRaw: number) {
    const candidates = [
      50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
      10_000_000,
    ];
    return (
      candidates.find((c) => c >= stepRaw) ??
      Math.ceil(stepRaw / 10_000_000) * 10_000_000
    );
  }

  const incomeScale = useMemo(() => {
    const noOfSections = 4;
    const max = Math.max(...incomeChartData.map((d) => d.value), 1);
    const stepValue = getScaleStep(Math.ceil(max / noOfSections));
    return { maxValue: stepValue * noOfSections, noOfSections, stepValue };
  }, [incomeChartData]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.totalSection}>
          <Image
            source={require("@/assets/images/banner.svg")}
            style={styles.totalHeaderLines}
            contentFit="contain"
            pointerEvents="none"
          />
          <View style={{ marginTop: 70 }}>
            <Text style={styles.totalLabel}>Total</Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              {loading ? (
                <SkeletonLine width={230} height={36} borderRadius={4} />
              ) : (
                <Text style={styles.totalAmount}>
                  {balanceVisible ? formatCOP(totalIncome) : "••••••••"}
                </Text>
              )}
              <View style={{ flexDirection: "row", gap: 16 }}>
                <TouchableOpacity onPress={handleSignOut}>
                  <Octicons name="sign-out" size={22} color={BCO.muted} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setBalanceVisible(!balanceVisible)}
                >
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
          incomeAccounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
              Ingresos anuales
            </Text>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chartSummaryRow}>
              <Text style={styles.chartSummaryLabel}>Total año</Text>
              <Text style={styles.chartSummaryValue}>
                {balanceVisible ? formatCOP(totalIncome) : "••••••••"}
              </Text>
            </View>
            <AnnualLineChart
              data={incomeChartData}
              color={Colors.purple}
              maxValue={incomeScale.maxValue}
              stepValue={incomeScale.stepValue}
              formatValue={formatCompactCOP}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}> 
              Por comercio/persona
            </Text>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chartSummaryRow}>
              <Text style={styles.chartSummaryLabel}>Top categoría</Text>
              <Text style={styles.chartSummaryValue}>
                {commerceAnnual.data[0] ? formatCOP(commerceAnnual.total) : "—"}
              </Text>
            </View>
            <AnnualLineChart
              data={commerceAnnual.data}
              color={Colors.green}
              maxValue={commerceAnnual.scale.maxValue}
              stepValue={commerceAnnual.scale.stepValue}
              formatValue={formatCompactCOP}
            />
          </View>
        </View>

        <View>
          <Image
            source={require("@/assets/images/banner2.png")}
            pointerEvents="none"
            style={styles.banner2}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { AccountCard } from "@/components/income/AccountCard";
import { AccountSkeleton } from "@/components/income/AccountSkeleton";
import { ASSETS_CHART_DATA, BCO, INCOME_CHART_DATA } from "@/constants/income";
import { Colors } from "@/constants/theme";
import { styles } from "@/styles/income";
import { useTransactions } from "@/hooks/useTransactions";
import Octicons from "@expo/vector-icons/Octicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useCallback, useContext, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../_layout";
import { useBalanceVisible } from "@/hooks/useBalanceVisible";
import { SkeletonLine } from "@/components/SkeletonLine";

export default function IncomeScreen() {
  const auth = useContext(AuthContext);
  const { balanceVisible, toggle: setBalanceVisible } = useBalanceVisible();
  const { incomeAccounts, loading, importing } = useTransactions();
  const [incomeSelectedIndex, setIncomeSelectedIndex] = useState(3);
  const [assetsSelectedIndex, setAssetsSelectedIndex] = useState(7);

  const totalIncome = useMemo(() => {
    return incomeAccounts.reduce((sum, account) => {
      return (
        sum +
        account.transactions.reduce((txSum, tx) => {
          const clean = tx.amount.replace(/[^0-9]/g, "");
          const numeric = parseInt(clean, 10);
          return txSum + (isNaN(numeric) ? 0 : numeric);
        }, 0)
      );
    }, 0);
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

  const niceStep = (stepRaw: number) => {
    const candidates = [
      50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
      10_000_000,
    ];
    return (
      candidates.find((c) => c >= stepRaw) ??
      Math.ceil(stepRaw / 10_000_000) * 10_000_000
    );
  };

  const incomeScale = useMemo(() => {
    const noOfSections = 4;
    const max = Math.max(...INCOME_CHART_DATA.map((d) => d.value));
    const stepValue = niceStep(Math.ceil(max / noOfSections));
    return { maxValue: stepValue * noOfSections, noOfSections, stepValue };
  }, []);

  const assetsScale = useMemo(() => {
    const noOfSections = 4;
    const max = Math.max(...ASSETS_CHART_DATA.map((d) => d.value));
    const stepValue = niceStep(Math.ceil(max / noOfSections));
    return { maxValue: stepValue * noOfSections, noOfSections, stepValue };
  }, []);

  const incomeSelected =
    INCOME_CHART_DATA[incomeSelectedIndex] ?? INCOME_CHART_DATA[0];
  const assetsSelected =
    ASSETS_CHART_DATA[assetsSelectedIndex] ?? ASSETS_CHART_DATA[0];

  const incomeLineData = useMemo(
    () =>
      INCOME_CHART_DATA.map((d) => ({
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

  const assetsLineData = useMemo(
    () =>
      ASSETS_CHART_DATA.map((d) => ({
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
            <Text style={styles.chartHint}>Toca un mes</Text>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chartSummaryRow}>
              <Text style={styles.chartSummaryLabel}>
                {incomeSelected?.label ?? "—"}
              </Text>
              <Text style={styles.chartSummaryValue}>
                {incomeSelected ? formatCOP(incomeSelected.value) : "—"}
              </Text>
            </View>
            <LineChart
              data={incomeLineData}
              maxValue={incomeScale.maxValue}
              noOfSections={incomeScale.noOfSections}
              stepValue={incomeScale.stepValue}
              adjustToWidth
              initialSpacing={8}
              endSpacing={8}
              spacing={26}
              height={180}
              thickness={3}
              color={Colors.purple}
              areaChart
              startFillColor={Colors.purple}
              endFillColor={Colors.purple}
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
                setIncomeSelectedIndex(index);
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
                {assetsSelected?.label ?? "—"}
              </Text>
              <Text style={styles.chartSummaryValue}>
                {assetsSelected ? formatCOP(assetsSelected.value) : "—"}
              </Text>
            </View>
            <LineChart
              data={assetsLineData}
              maxValue={assetsScale.maxValue}
              noOfSections={assetsScale.noOfSections}
              stepValue={assetsScale.stepValue}
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
                setAssetsSelectedIndex(index);
                await Haptics.selectionAsync();
              }}
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

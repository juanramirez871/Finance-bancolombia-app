import { AccountCard } from "@/components/income/AccountCard";
import {
  ACCOUNTS,
  ASSETS_CHART_DATA,
  BCO,
  INCOME_CHART_DATA,
} from "@/constants/income";
import { Colors } from "@/constants/theme";
import { styles } from "@/styles/income";
import Octicons from "@expo/vector-icons/Octicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IncomeScreen() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [incomeSelectedIndex, setIncomeSelectedIndex] = useState(3);
  const [assetsSelectedIndex, setAssetsSelectedIndex] = useState(7);

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
            <View style={styles.totalRow}>
              <Text style={styles.totalAmount}>
                {balanceVisible ? "$2'441.000" : "••••••••"}
              </Text>
              <TouchableOpacity onPress={() => setBalanceVisible((v) => !v)}>
                <Octicons
                  name={balanceVisible ? "eye" : "eye-closed"}
                  size={22}
                  color={BCO.muted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {ACCOUNTS.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}

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

import { AccountCard } from "@/components/AccountCard";
import { AccountSkeleton } from "@/components/AccountSkeleton";
import { AnnualLineChart } from "@/components/AnnualLineChart";
import { ManualTransactionModal } from "@/components/ManualTransactionModal";
import { BCO } from "@/constants/income";
import { Colors } from "@/constants/theme";
import { styles } from "@/styles/income";
import { useTransactions } from "@/hooks/useTransactions";
import {
  buildAnnualSeriesFromAccounts,
  buildScale,
  buildTopCategoriesFromAccounts,
  formatCompactCOP,
  formatCOP,
} from "@/utils/financeMetrics";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { useCallback, useContext, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../_layout";
import { useBalanceVisible } from "@/hooks/useBalanceVisible";
import { SkeletonLine } from "@/components/SkeletonLine";

export default function IncomeScreen() {

  const auth = useContext(AuthContext);
  const { balanceVisible, toggle: setBalanceVisible } = useBalanceVisible();
  const {
    incomeAccounts,
    loading,
    addManualTransaction,
    manualIncomeConceptOptions,
    manualIncomeAccountOptions,
  } = useTransactions(Boolean(auth?.isAuthenticated));
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const incomeAnnual = useMemo(
    () => buildAnnualSeriesFromAccounts(incomeAccounts),
    [incomeAccounts],
  );

  const incomeChartData = incomeAnnual.data;
  const totalIncome = incomeAnnual.yearTotal;
  const commerceAnnual = useMemo(() => {
    const categories = buildTopCategoriesFromAccounts(incomeAccounts);
    return {
      ...categories,
      scale: buildScale(categories.data.map((point) => point.value)),
    };
  }, [incomeAccounts]);

  const incomeScale = useMemo(() => {
    return buildScale(incomeChartData.map((point) => point.value));
  }, [incomeChartData]);

  const handleSaveManualIncome = useCallback(async (data: { amount: number; concept: string; account: string }) => {
    await addManualTransaction({
      kind: "income",
      amount: data.amount,
      concept: data.concept,
      account: data.account,
    });
  }, [addManualTransaction]);

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
                <TouchableOpacity
                  onPress={() => setBalanceVisible(!balanceVisible)}
                >
                  <Octicons
                    name={balanceVisible ? "eye" : "eye-closed"}
                    size={22}
                    color={BCO.muted}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setManualModalVisible(true)}>
                  <Octicons name="plus-circle" size={22} color={BCO.muted} />
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
                {commerceAnnual.data[0] ? formatCOP(commerceAnnual.topValue) : "—"}
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

      <ManualTransactionModal
        visible={manualModalVisible}
        title="Agregar ingreso manual"
        amountLabel="Monto del ingreso"
        ctaLabel="Guardar ingreso"
        accentColor={Colors.green}
        kind="income"
        conceptOptions={manualIncomeConceptOptions}
        accountOptions={manualIncomeAccountOptions}
        onClose={() => setManualModalVisible(false)}
        onSave={handleSaveManualIncome}
      />
    </SafeAreaView>
  );
}

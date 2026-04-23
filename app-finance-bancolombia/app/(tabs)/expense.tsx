import { AccountCard } from "@/components/AccountCard";
import { AccountSkeleton } from "@/components/AccountSkeleton";
import { AnnualLineChart } from "@/components/AnnualLineChart";
import { ManualTransactionModal } from "@/components/ManualTransactionModal";
import { BCO } from "@/constants/expense";
import { Colors } from "@/constants/theme";
import { styles } from "@/styles/expense";
import { useTransactions } from "@/hooks/useTransactions";
import {
  buildAnnualSeriesFromAccounts,
  buildAnnualSeriesFromTransactions,
  buildScale,
  buildTopCategoriesFromAccounts,
  buildTopCategoriesFromTransactions,
  formatCompactCOP,
  formatCOP,
} from "@/utils/financeMetrics";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { useCallback, useContext, useMemo, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../_layout";
import { useBalanceVisible } from "@/hooks/useBalanceVisible";
import { SkeletonLine } from "@/components/SkeletonLine";
import type { Transaction } from "@/interfaces/income";

function isFailedPayment(label: string) {
  return /fallid|rechaz|declinad|no\s*proces|error/i.test(label);
}

function isFailedPaymentType(tx: Transaction) {
  return tx.type === "pago_no_exitoso";
}

export default function ExpenseScreen() {

  const auth = useContext(AuthContext);
  const { balanceVisible, toggle: setBalanceVisible } = useBalanceVisible();
  const {
    expenseAccounts,
    loading,
    addManualTransaction,
    manualExpenseConceptOptions,
    manualExpenseAccountOptions,
  } = useTransactions(Boolean(auth?.isAuthenticated));
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const expenseAccountsForMetrics = useMemo(
    () => expenseAccounts.map((account) => ({
      ...account,
      transactions: account.transactions.filter((tx) => !isFailedPaymentType(tx)),
    })),
    [expenseAccounts],
  );
  const expenseAnnual = useMemo(
    () => buildAnnualSeriesFromAccounts(expenseAccountsForMetrics),
    [expenseAccountsForMetrics],
  );

  const expenseChartData = expenseAnnual.data;
  const totalExpense = expenseAnnual.yearTotal;
  const expenseScale = useMemo(() => {
    return buildScale(expenseChartData.map((point) => point.value));
  }, [expenseChartData]);

  const expenseCategoryAnnual = useMemo(() => {
    const categories = buildTopCategoriesFromAccounts(expenseAccountsForMetrics);
    return {
      ...categories,
      scale: buildScale(categories.data.map((point) => point.value)),
    };
  }, [expenseAccountsForMetrics]);

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
    const accountTransactionsForMetrics = accountSelected.transactions.filter(
      (tx) => !isFailedPaymentType(tx),
    );
    const annual = buildAnnualSeriesFromTransactions(accountTransactionsForMetrics);
    const categories = buildTopCategoriesFromTransactions(accountTransactionsForMetrics);

    return {
      expenseData: annual.data,
      categoryData: categories.data,
      yearTotal: annual.yearTotal,
      expenseScale: buildScale(annual.data.map((point) => point.value)),
      categoryScale: buildScale(categories.data.map((point) => point.value)),
    };
  }, [accountSelected]);

  const getTxAmountColor = useCallback((tx: Transaction) => {
    return isFailedPayment(tx.label) ? Colors.blue : undefined;
  }, []);

  const openAccountCharts = useCallback((accountId: string) => {
    setAccountSelectedId(accountId);
    setAccountChartsVisible(true);
  }, []);

  const handleSaveManualExpense = useCallback(async (data: { amount: number; concept: string; account: string }) => {
    await addManualTransaction({
      kind: "expense",
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
                <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Por comercio/persona</Text>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chartSummaryRow}>
              <Text style={styles.chartSummaryLabel}>Top categoría</Text>
              <Text style={styles.chartSummaryValue}>
                {expenseCategoryAnnual.data[0] ? formatCOP(expenseCategoryAnnual.topValue) : "—"}
              </Text>
            </View>
            {expenseCategoryAnnual.data.length ? (
              <AnnualLineChart
                data={expenseCategoryAnnual.data}
                color={Colors.purple}
                maxValue={expenseCategoryAnnual.scale.maxValue}
                stepValue={expenseCategoryAnnual.scale.stepValue}
                formatValue={formatCompactCOP}
              />
            ) : null}
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
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Por comercio/persona</Text>
              </View>
              <View style={styles.chartCard}>
                <View style={styles.chartSummaryRow}>
                  <Text style={styles.chartSummaryLabel}>Top categoría</Text>
                  <Text style={styles.chartSummaryValue}>
                    {accountAnnual ? formatCOP(accountAnnual.categoryData[0]?.value ?? 0) : "—"}
                  </Text>
                </View>
                {accountAnnual ? (
                  <AnnualLineChart
                    data={accountAnnual.categoryData}
                    color={Colors.purple}
                    maxValue={accountAnnual.categoryScale.maxValue}
                    stepValue={accountAnnual.categoryScale.stepValue}
                    formatValue={formatCompactCOP}
                  />
                ) : null}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <ManualTransactionModal
        visible={manualModalVisible}
        title="Agregar egreso manual"
        amountLabel="Monto del egreso"
        ctaLabel="Guardar egreso"
        accentColor={Colors.red}
        kind="expense"
        conceptOptions={manualExpenseConceptOptions}
        accountOptions={manualExpenseAccountOptions}
        onClose={() => setManualModalVisible(false)}
        onSave={handleSaveManualExpense}
      />
    </SafeAreaView>
  );
}

import { AccountCard } from "@/components/income/AccountCard";
import { ACCOUNTS, BCO, CHART_DATA } from "@/constants/income";
import { Colors } from "@/constants/theme";
import { styles } from "@/styles/income";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IncomeScreen() {
  const [balanceVisible, setBalanceVisible] = useState(true);
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
          <Text style={styles.sectionTitle}>Ingresos anuales</Text>
          <View style={styles.chartCard}>
            <BarChart
              data={CHART_DATA}
              barWidth={18}
              spacing={14}
              roundedTop
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              xAxisLabelTextStyle={styles.chartLabel}
              noOfSections={4}
              maxValue={200}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activos</Text>
          <View style={styles.chartCard}>
            <BarChart
              data={CHART_DATA.map((d) => ({ ...d, frontColor: Colors.green }))}
              barWidth={18}
              spacing={14}
              roundedTop
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              xAxisLabelTextStyle={styles.chartLabel}
              noOfSections={4}
              maxValue={200}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

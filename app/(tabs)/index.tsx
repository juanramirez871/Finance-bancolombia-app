import Octicons from "@expo/vector-icons/Octicons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IncomeScreen() {
  const data = [
    { value: 50, label: "Ene" },
    { value: 80, label: "Feb" },
    { value: 90, label: "Mar" },
    { value: 100, label: "Abr" },
    { value: 110, label: "Mayo" },
    { value: 120, label: "Jun" },
    { value: 130, label: "Jul" },
    { value: 140, label: "Ago" },
    { value: 150, label: "Sep" },
    { value: 160, label: "Oct" },
    { value: 170, label: "Nov" },
    { value: 180, label: "Dic" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.container}>
          <View>
            <View>
              <Text>Total</Text>
            </View>

            <View>
              <View>
                <Text>$0.00</Text>
                <Octicons name="eye" size={24} color="black" />
              </View>
            </View>

            <View>
              <View>
                <Text>Cuenta de Ahorro *999</Text>
              </View>
              <View>
                <Text>Empresa A tranfirio $323.000</Text>
                <Text>Empresa A tranfirio $323.000</Text>
                <Text>Empresa A tranfirio $323.000</Text>
                <Text>Empresa A tranfirio $323.000</Text>
                <Text>Empresa A tranfirio $323.000</Text>
                <Text>Empresa A tranfirio $323.000</Text>
                <Text>Empresa A tranfirio $323.000</Text>
                <Text>Empresa A tranfirio $323.000</Text>
              </View>
            </View>

            <View>
              <View>
                <BarChart
                  data={data}
                  barWidth={22}
                  spacing={24}
                  roundedTop
                  hideRules
                  xAxisThickness={0}
                  yAxisThickness={0}
                />
                <Text>Annual Incomes</Text>
              </View>
              <View>
                <BarChart
                  data={data}
                  barWidth={22}
                  spacing={24}
                  roundedTop
                  hideRules
                  xAxisThickness={0}
                  yAxisThickness={0}
                />
                <Text>Assets</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
});

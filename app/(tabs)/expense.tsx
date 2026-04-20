import { BCO } from "@/constants/expense";
import { styles } from "@/styles/expense";
import Octicons from "@expo/vector-icons/Octicons";
import { Image } from "expo-image";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExpenseScreen() {
  const [balanceVisible, setBalanceVisible] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

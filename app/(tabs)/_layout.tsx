import { Tabs } from "expo-router";
import React from "react";

import { Colors } from "@/constants/theme";
import { Image } from "expo-image";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Income",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/wallet.svg")}
              style={{ width: 40, height: 40 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="expense"
        options={{
          title: "Expense",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/invoice.svg")}
              style={{ width: 40, height: 40 }}
            />
          ),
        }}
      />
    </Tabs>
  );
}

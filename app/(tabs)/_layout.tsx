import { Tabs } from "expo-router";
import React from "react";

import { BCO } from "@/constants/income";
import { Colors } from "@/constants/theme";
import { Image } from "expo-image";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.yellow,
        tabBarInactiveTintColor: BCO.muted,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 16,
          height: 68,
          paddingTop: 12,
          paddingBottom: 12,
          backgroundColor: BCO.card,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: BCO.border,
        },
        tabBarItemStyle: {
          borderRadius: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Income",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/wallet.svg")}
              style={{ width: 28, height: 28, tintColor: color }}
              contentFit="contain"
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
              style={{ width: 28, height: 28, tintColor: color }}
              contentFit="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}

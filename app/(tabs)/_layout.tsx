import { Tabs } from "expo-router";
import React from "react";

import { Colors } from "@/constants/theme";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

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
            <MaterialCommunityIcons
              name="chart-timeline-variant-shimmer"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Expense",
          tabBarIcon: ({ color }) => (
            <Feather name="activity" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

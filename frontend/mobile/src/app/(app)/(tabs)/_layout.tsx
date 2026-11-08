import { Tabs } from "expo-router";
import { GuardianIcon } from "@/components/GuardianIcon";
import { colors } from "@/theme/colors";
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { minHeight: 64 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Tổng quan",
          tabBarIcon: ({ color }) => <GuardianIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Vị trí",
          tabBarIcon: ({ color }) => <GuardianIcon name="map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="control"
        options={{
          title: "Bảo vệ",
          tabBarIcon: ({ color }) => (
            <GuardianIcon name="shield" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Cảnh báo",
          tabBarIcon: ({ color }) => (
            <GuardianIcon name="alert" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: "Xe của tôi",
          tabBarIcon: ({ color }) => <GuardianIcon name="bike" color={color} />,
        }}
      />
    </Tabs>
  );
}

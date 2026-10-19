import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

import { colors } from '@/theme/colors';

function Icon({ value, color }: { value: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 18 }}>{value}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceDark },
        headerTintColor: '#F8FAFC',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Tổng quan', tabBarIcon: ({ color }) => <Icon value="◉" color={color} /> }} />
      <Tabs.Screen name="map" options={{ title: 'GPS', tabBarIcon: ({ color }) => <Icon value="⌖" color={color} /> }} />
      <Tabs.Screen name="control" options={{ title: 'Điều khiển', tabBarIcon: ({ color }) => <Icon value="◆" color={color} /> }} />
      <Tabs.Screen name="alerts" options={{ title: 'Cảnh báo', tabBarIcon: ({ color }) => <Icon value="!" color={color} /> }} />
      <Tabs.Screen name="devices" options={{ title: 'Thiết bị', tabBarIcon: ({ color }) => <Icon value="▣" color={color} /> }} />
    </Tabs>
  );
}

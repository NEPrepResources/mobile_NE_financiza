import { useColorScheme } from '@/hooks/useColorScheme';
import { Stack } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function Layout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="index" />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="expense-details"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
} 
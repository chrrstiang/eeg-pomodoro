import { Stack } from "expo-router";
import "../global.css";
import { WebSocketProvider } from "../contexts/WebSocketContext";
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <WebSocketProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="focus" options={{ headerShown: false }} />
        </Stack>
      </WebSocketProvider>
    </SafeAreaProvider>
  );
}

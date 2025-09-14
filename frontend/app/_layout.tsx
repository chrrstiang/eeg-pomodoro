import { Stack } from "expo-router";
import "../global.css";
import { WebSocketProvider } from "../contexts/WebSocketContext";

export default function RootLayout() {
  return (
    <WebSocketProvider>
      <Stack />
    </WebSocketProvider>
  );
}

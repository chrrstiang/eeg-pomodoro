import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
} from "react";
import { File } from "expo-file-system";
import { Alert } from "react-native";

// WebSocket connection status
export type WebSocketStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

// WebSocket context interface
interface WebSocketContextType {
  // State
  wsUrl: string;
  focusScore: number | null;
  status: WebSocketStatus;
  currentSecond: number;
  isUploading: boolean;

  // State setters
  setWsUrl: (url: string) => void;
  setFocusScore: (score: number | null) => void;
  setStatus: (status: WebSocketStatus) => void;
  setCurrentSecond: (second: number) => void;
  setIsUploading: (uploading: boolean) => void;

  // WebSocket methods
  connectAndSendFile: (fileUri: string) => Promise<void>;
  disconnect: () => void;

  // WebSocket instance (for advanced usage)
  ws: WebSocket | null;
}

// Create context
const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

// Provider props
interface WebSocketProviderProps {
  children: ReactNode;
  defaultUrl?: string;
}

// WebSocket Provider component
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  defaultUrl = "ws://10.110.12.41:8000/ws",
}) => {
  // State
  const [wsUrl, setWsUrl] = useState<string>(defaultUrl);
  const [focusScore, setFocusScore] = useState<number | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [currentSecond, setCurrentSecond] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);

  // Connect and send file method
  const connectAndSendFile = async (fileUri: string): Promise<void> => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    setIsUploading(true);
    setStatus("connecting");
    Alert.alert("Connecting", "Establishing WebSocket connection...", [
      { text: "OK" },
    ]);

    try {
      // Create new WebSocket connection
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log("WebSocket connection opened. Sending file...");
        setStatus("connected");
        Alert.alert("Connected", "Sending file to backend...");

        try {
          const file = new File(fileUri);

          // Read the file as base64
          const base64Content = await file.base64Sync();

          ws.send(base64Content);
          console.log("File sent. Waiting for scores...");

          // Navigate to focus screen immediately after successful file send
          const { router } = await import("expo-router");
          router.push("/focus");
        } catch (fileError) {
          console.error("Error reading file:", fileError);
          Alert.alert("Error", "Failed to read file");
          setStatus("error");
          setIsUploading(false);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle error messages
          if (data.error) {
            console.error("Server error:", data.error);
            Alert.alert("Error", data.error);
            return;
          }

          // Update focus score and current second range
          if (typeof data.focus_score === "number") {
            setFocusScore(data.focus_score);
          }

          // Handle the 3-second window
          if (
            typeof data.start_second === "number" &&
            typeof data.end_second === "number"
          ) {
            // Update to the end of the window to show progress
            setCurrentSecond(data.end_second);
            console.log(
              `Processing seconds ${data.start_second} to ${data.end_second}:`,
              data.focus_score
            );
          }

          console.log("Received data:", data);
        } catch (parseError) {
          console.error("Error parsing WebSocket message:", parseError);
        }
      };

      ws.onerror = (error: Event) => {
        console.error("WebSocket error:", error);
        Alert.alert("Error", "WebSocket connection failed");
        setStatus("error");
        setIsUploading(false);
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed.");
        setStatus("disconnected");
        setIsUploading(false);
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      Alert.alert("Error", "Failed to connect to server");
      setStatus("error");
      setIsUploading(false);
    }
  };

  // Disconnect method
  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
    setIsUploading(false);
    setFocusScore(null);
    setCurrentSecond(0);
  };

  // Context value
  const contextValue: WebSocketContextType = {
    // State
    wsUrl,
    focusScore,
    status,
    currentSecond,
    isUploading,

    // State setters
    setWsUrl,
    setFocusScore,
    setStatus,
    setCurrentSecond,
    setIsUploading,

    // Methods
    connectAndSendFile,
    disconnect,

    // WebSocket instance
    ws: wsRef.current,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket context
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

export default WebSocketContext;

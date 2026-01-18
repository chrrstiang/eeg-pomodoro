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

// Interface for spectrum data
export interface SpectrumData {
  frequencies: number[];
  power_density: number[];
}

// WebSocket context interface
interface WebSocketContextType {
  // State
  wsUrl: string;
  focusScore: number | null;
  thetaPower: number | null;
  betaPower: number | null;
  status: WebSocketStatus;
  currentSecond: number;
  isUploading: boolean;
  spectrumData: SpectrumData | null;

  // State setters
  setWsUrl: (url: string) => void;
  setFocusScore: (score: number | null) => void;
  setThetaPower: (power: number | null) => void;
  setBetaPower: (power: number | null) => void;
  setStatus: (status: WebSocketStatus) => void;
  setCurrentSecond: (second: number) => void;
  setIsUploading: (uploading: boolean) => void;
  setSpectrumData: (data: SpectrumData | null) => void;

  // WebSocket methods
  connectAndSendFile: (fileUri: string) => Promise<void>;
  disconnect: () => void;

  // WebSocket instance (for advanced usage)
  ws: WebSocket | null;
}

// Create context
const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined,
);

// Provider props
interface WebSocketProviderProps {
  children: ReactNode;
  defaultUrl?: string;
}

// WebSocket Provider component
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  defaultUrl = "ws://10.110.33.72:8000/ws",
}) => {
  // State
  const [wsUrl, setWsUrl] = useState<string>(defaultUrl);
  const [focusScore, setFocusScore] = useState<number | null>(null);
  const [thetaPower, setThetaPower] = useState<number | null>(null);
  const [betaPower, setBetaPower] = useState<number | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [currentSecond, setCurrentSecond] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [spectrumData, setSpectrumData] = useState<SpectrumData | null>(null);

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);

  // Connect and send file method
  const connectAndSendFile = async (fileUri: string): Promise<void> => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    setIsUploading(true);
    setStatus("connecting");
    try {
      // Create new WebSocket connection
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log("WebSocket connection opened. Sending file...");
        setStatus("connected");

        try {
          const file = new File(fileUri);

          // Read the file as base64
          const base64Content = await file.base64Sync();

          ws.send(base64Content);
          console.log("File sent. Waiting for scores...");
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
          if (typeof data.theta_power === "number") {
            setThetaPower(data.theta_power);
          }
          if (typeof data.beta_power === "number") {
            setBetaPower(data.beta_power);
          }
          // Update spectrum data if available
          if (
            data.spectrum &&
            data.spectrum.frequencies &&
            data.spectrum.power_density
          ) {
            setSpectrumData({
              frequencies: data.spectrum.frequencies,
              power_density: data.spectrum.power_density,
            });
          }

          // Handle the time window
          if (
            typeof data.start_second === "number" &&
            typeof data.end_second === "number"
          ) {
            // Update to the end of the window to show progress
            setCurrentSecond(data.end_second);
            console.log(
              `Processing seconds ${data.start_second} to ${data.end_second}:`,
              data.focus_score,
            );

            // Log spectrum data if available
            if (data.spectrum) {
              console.log("Spectrum data received:", {
                frequencies: data.spectrum.frequencies?.length || 0,
                power_density: data.spectrum.power_density?.length || 0,
              });
            }
          }
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
    setSpectrumData(null);
  };

  // Context value
  const contextValue: WebSocketContextType = {
    // State
    wsUrl,
    focusScore,
    thetaPower,
    betaPower,
    status,
    currentSecond,
    isUploading,
    spectrumData,

    // State setters
    setWsUrl,
    setFocusScore,
    setThetaPower,
    setBetaPower,
    setStatus,
    setCurrentSecond,
    setIsUploading,
    setSpectrumData,

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

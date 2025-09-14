import { View, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { useState, useEffect, useRef } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { AnimatedRollingNumber } from "react-native-animated-rolling-numbers";

export default function FocusPage() {
  const { focusScore, status, currentSecond, disconnect } = useWebSocket();
  const [isRunning, setIsRunning] = useState(true);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes in seconds
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            console.log("Break time!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const beginBreak = () => {
    setIsRunning(true);
    setTimeLeft(300);
  };

  return (
    <View className="flex-1 justify-center items-center px-8 bg-background">
      <View className="items-center w-full max-w-sm">
        {/* Title */}
        <Text
          variant="h1"
          className="text-center mb-3 text-foreground font-extrabold tracking-tight"
        >
          Focus Session
        </Text>

        {/* Custom Countdown Timer */}
        <View className="items-center mb-12">
          <Text className="text-6xl font-bold text-foreground mb-2">
            {formatTime(timeLeft)}
          </Text>
          <Text className="text-lg text-muted-foreground">
            {timeLeft === 0
              ? "Time's up!"
              : isRunning
                ? "Focus time"
                : "Ready to focus"}
          </Text>
        </View>

        {/* EEG Focus Score Display */}
        <View className="w-full mb-8 p-6 bg-gray-50 rounded-xl">
          <Text className="text-lg font-semibold text-center mb-2">
            Focus Score
          </Text>
          <AnimatedRollingNumber
            value={focusScore || 0}
            toFixed={2}
            numberStyle={{
              fontSize: 48,
              fontWeight: "bold",
              color: "black",
              textAlign: "center",
            }}
            dotStyle={{
              color: "black",
              fontSize: 60,
              paddingBottom: 10,
            }}
          />
          <Text className="text-sm text-center text-gray-600 mt-1">
            Current Second: {currentSecond}
          </Text>
        </View>

        {/* Timer Controls */}
        <View className="w-full space-y-4 gap-8">
          <TouchableOpacity
            className="w-full bg-blue-500 py-4 px-6 rounded-xl shadow-md items-center"
            onPress={() => setIsRunning(!isRunning)}
            disabled={timeLeft === 0}
          >
            <Text className="text-white text-xl font-bold">
              {timeLeft === 0 ? "Finished" : isRunning ? "Pause" : "Start"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full bg-red-500 py-4 px-6 rounded-xl shadow-md items-center"
            onPress={beginBreak}
          >
            <Text className="text-white text-xl font-bold">Take a break</Text>
          </TouchableOpacity>
        </View>

        {/* Status indicator */}
        <Text variant="muted" className="text-center px-6 leading-6 mt-6">
          EEG device status:{" "}
          {status === "connected"
            ? "Connected"
            : status === "connecting"
              ? "Connecting..."
              : status === "error"
                ? "Error"
                : "Disconnected"}
        </Text>
      </View>
    </View>
  );
}

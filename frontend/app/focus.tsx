import {
  View,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  StatusBar,
} from "react-native";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { Text } from "@/components/ui/text";
import { useState, useEffect, useRef, memo } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { AnimatedRollingNumber } from "react-native-animated-rolling-numbers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { SpectrumPlot } from "@/components/ui/SpectrumPlot";

export default function FocusPage() {
  const [activeTab, setActiveTab] = useState("timer");

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{
        backgroundColor: useColorScheme() === "dark" ? "#1e293b" : "#f8fafc",
      }}
    >
      <StatusBar
        barStyle={
          useColorScheme() === "dark" ? "light-content" : "dark-content"
        }
        backgroundColor={useColorScheme() === "dark" ? "#1e293b" : "#f8fafc"}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList
          className="px-4 h-14 w-full"
          style={{
            backgroundColor:
              useColorScheme() === "dark" ? "#1e293b" : "#f8fafc",
          }}
        >
          <TabsTrigger
            value="timer"
            className={`flex-row w-1/2 items-center gap-2 px-6 py-3 rounded-lg ${activeTab === "timer" ? "bg-blue-100 dark:bg-blue-900" : "bg-transparent"}`}
          >
            <Ionicons
              name="timer-outline"
              size={20}
              color={useColorScheme() === "dark" ? "white" : "black"}
            />
            <Text className="dark:text-white text-base font-medium">
              Focus Timer
            </Text>
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className={`flex-row w-1/2 items-center gap-2 px-6 py-3 rounded-lg ${activeTab === "details" ? "bg-blue-100 dark:bg-blue-900" : "bg-transparent"}`}
          >
            <Ionicons
              name="stats-chart"
              size={20}
              color={useColorScheme() === "dark" ? "white" : "black"}
            />
            <Text className="dark:text-white text-base font-medium">
              Metrics
            </Text>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="flex-1">
          <TimeScreen />
        </TabsContent>

        <TabsContent value="details" className="flex-1">
          <DetailScreen />
        </TabsContent>
      </Tabs>
    </SafeAreaView>
  );
}

function TimeScreen() {
  const { focusScore, status, currentSecond } = useWebSocket();
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
    <GradientBackground>
      <View className="flex-1 justify-center items-center px-8">
        <View className="items-center w-full max-w-sm">
          {/* Title */}
          <Text
            variant="h1"
            className="dark:text-white text-center mb-3 font-extrabold tracking-tight"
          >
            Focus Session
          </Text>

          {/* Custom Countdown Timer */}
          <View className="items-center mb-12">
            <Text className="dark:text-white text-6xl font-bold mb-2">
              {formatTime(timeLeft)}
            </Text>
            <Text className=" dark:text-white text-lg text-muted-foreground">
              {timeLeft === 0
                ? "Time's up!"
                : isRunning
                  ? "Focus time"
                  : "Ready to focus"}
            </Text>
          </View>

          {/* EEG Focus Score Display */}
          <View className="w-full mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <Text className="text-lg dark:text-gray-200 font-semibold text-center mb-2">
              Focus Score
            </Text>
            <AnimatedRollingNumber
              value={focusScore || 0}
              toFixed={2}
              numberStyle={{
                fontSize: 48,
                fontWeight: "bold",
                color: useColorScheme() === "dark" ? "white" : "black",
                textAlign: "center",
              }}
              dotStyle={{
                color: useColorScheme() === "dark" ? "white" : "black",
                fontSize: 60,
                paddingBottom: 10,
              }}
            />
            <Text className="text-sm dark:text-gray-200 text-center text-gray-600 mt-1">
              Current Second: {currentSecond}
            </Text>
          </View>

          {/* Timer Controls */}
          <View className="w-full space-y-4 gap-8">
            <TouchableOpacity
              className="w-full bg-blue-500 dark:bg-blue-900 py-4 px-6 rounded-xl shadow-md items-center"
              onPress={() => setIsRunning(!isRunning)}
              disabled={timeLeft === 0}
            >
              <Text className="text-white text-xl font-bold">
                {timeLeft === 0 ? "Finished" : isRunning ? "Pause" : "Start"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full bg-red-500 dark:bg-red-800 py-4 px-6 rounded-xl shadow-md items-center"
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
    </GradientBackground>
  );
}

function DetailScreen() {
  const { focusScore, thetaPower, betaPower, spectrumData } = useWebSocket();

  return (
    <GradientBackground>
      <View className="flex-1 p-4">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Brainwave Analysis
          </Text>
          <Text className="text-gray-500 dark:text-gray-400">
            Real-time EEG metrics and focus monitoring
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <StatCard
            title="Focus Score"
            value={focusScore !== null ? focusScore : 0}
            description="The closer to 0, the better your focus"
            emoji="🎯"
          />

          <StatCard
            title="Theta Power"
            value={thetaPower !== null ? thetaPower : 0}
            description="Associated with deep focus and meditation (4-8 Hz)"
            emoji="🌊"
          />

          <StatCard
            title="Beta Power"
            value={betaPower !== null ? betaPower : 0}
            description="Associated with active thinking and focus (12-30 Hz)"
            emoji="⚡"
          />

          <View className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6">
            <Text className="text-gray-600 dark:text-gray-300 text-base mb-4">
              Frequency Spectrum
            </Text>
            <View className="h-48 bg-gray-100 dark:bg-gray-700 rounded-lg items-center justify-center">
              <SpectrumPlot
                frequencies={spectrumData?.frequencies || []}
                powerDensity={spectrumData?.power_density || []}
              />
              <Text className="text-gray-400 text-sm mt-2">Coming soon</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const StatCard = memo(
  ({
    title,
    value,
    description,
    emoji,
  }: {
    title: string;
    value: number;
    description: string;
    emoji: string;
  }) => (
    <View className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-gray-600 dark:text-gray-300 text-base">
          {title}
        </Text>
        <Text className="text-2xl">{emoji}</Text>
      </View>
      <View className="items-start">
        <AnimatedRollingNumber
          value={value || 0}
          toFixed={2}
          numberStyle={{
            fontSize: 32,
            fontWeight: "bold",
            color: useColorScheme() === "dark" ? "white" : "black",
          }}
          dotStyle={{
            color: useColorScheme() === "dark" ? "white" : "black",
            fontSize: 40,
            paddingBottom: 10,
          }}
        />
      </View>
      <Text className="text-sm text-gray-500 dark:text-gray-400">
        {description}
      </Text>
    </View>
  ),
);

StatCard.displayName = "StatCard";

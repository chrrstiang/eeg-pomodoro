import { StatusBar } from "expo-status-bar";
import { View, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

export default function FocusScreen() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState("work"); // 'work' or 'break'
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Switch between work and break
      const newSessionType = sessionType === "work" ? "break" : "work";
      const newDuration =
        newSessionType === "work" ? workDuration : breakDuration;
      setSessionType(newSessionType);
      setTimeLeft(newDuration * 60);
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, sessionType, workDuration, breakDuration]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const totalDuration =
    sessionType === "work" ? workDuration * 60 : breakDuration * 60;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  const handleStart = () => setIsActive(!isActive);
  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(
      sessionType === "work" ? workDuration * 60 : breakDuration * 60
    );
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center p-6 min-h-screen">
        <Text className="text-3xl font-bold text-foreground mb-2">
          🧠 EEG Pomodoro Timer
        </Text>
        <Text className="text-muted-foreground mb-8 text-center">
          Focus with neurofeedback-enhanced productivity
        </Text>

        <Card className="w-full max-w-sm mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {sessionType === "work" ? "🍅 Work Session" : "☕ Break Time"}
            </CardTitle>
            <CardDescription>
              {sessionType === "work"
                ? "Stay focused and productive"
                : "Relax and recharge"}
            </CardDescription>
          </CardHeader>
          <CardContent className="items-center">
            <Text className="text-6xl font-mono font-bold text-center mb-4">
              {formatTime(timeLeft)}
            </Text>
            <Progress value={progress} className="w-full mb-6" />
            <View className="flex-row gap-3 w-full">
              <Button
                onPress={handleStart}
                className="flex-1"
                variant={isActive ? "secondary" : "default"}
              >
                <Text>{isActive ? "Pause" : "Start"}</Text>
              </Button>
              <Button
                onPress={handleReset}
                variant="outline"
                className="flex-1"
              >
                <Text>Reset</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Customize your session durations</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <View>
              <Text className="text-sm font-medium mb-2">
                Work Duration (minutes)
              </Text>
              <Input
                value={workDuration.toString()}
                onChangeText={(text) => setWorkDuration(parseInt(text) || 25)}
                keyboardType="numeric"
                placeholder="25"
              />
            </View>
            <View>
              <Text className="text-sm font-medium mb-2">
                Break Duration (minutes)
              </Text>
              <Input
                value={breakDuration.toString()}
                onChangeText={(text) => setBreakDuration(parseInt(text) || 5)}
                keyboardType="numeric"
                placeholder="5"
              />
            </View>
          </CardContent>
        </Card>

        <StatusBar style="auto" />
      </View>
    </ScrollView>
  );
}

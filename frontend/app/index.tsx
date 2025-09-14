import { View } from "react-native";
import { Link } from "expo-router";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center p-6">
      <Text className="text-3xl font-bold text-foreground mb-2">
        🧠 EEG Pomodoro Timer
      </Text>
      <Text className="text-muted-foreground mb-8 text-center">
        Focus with neurofeedback-enhanced productivity
      </Text>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>
            Ready to boost your productivity with EEG-enhanced focus sessions?
          </CardDescription>
        </CardHeader>
        <CardContent className="items-center">
          <Link href="/focus" asChild>
            <Button className="w-full">
              <Text>Start Focus Session</Text>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </View>
  );
}

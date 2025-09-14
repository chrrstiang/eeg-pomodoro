import { View, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import * as DocumentPicker from "expo-document-picker";
import { useState, useEffect } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";

export default function Index() {
  const { connectAndSendFile, isUploading, currentSecond } = useWebSocket();
  
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerResult | null>(null);

  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result);
        console.log("Selected file:", result.assets[0].name);
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Error", "Failed to select file");
    }
  };

  // Navigate to focus page when first score is received
  useEffect(() => {
    if (currentSecond === 1) {
      console.log("First score received. Navigating to display page.");
      router.push("../focus");
    }
  }, [currentSecond]);

  const handleSubmit = async () => {
    if (
      !selectedFile ||
      !selectedFile.assets ||
      selectedFile.assets.length === 0
    ) {
      Alert.alert("No File Selected", "Please select a CSV file first");
      return;
    }

    try {
      await connectAndSendFile(selectedFile.assets[0].uri);
    } catch (error) {
      console.error("Error connecting or sending file:", error);
      Alert.alert("Error", "Failed to connect or send file");
    }
  };

  return (
    <View className="flex-1 justify-center items-center px-8 bg-background">
      <View className="items-center w-full max-w-sm">
        {/* Brain/EEG Icon Area */}
        <View className="w-32 h-32 rounded-full bg-primary/15 items-center justify-center mb-8 shadow-lg">
          <Text className="text-6xl">🧠</Text>
        </View>

        {/* Headline */}
        <View className="items-center mb-8">
          <Text
            variant="h1"
            className="text-center mb-4 text-foreground font-extrabold tracking-tight"
          >
            EEG Pomodoro
          </Text>

          {/* Subtitle */}
          <Text
            variant="lead"
            className="text-center text-muted-foreground leading-7 px-4"
          >
            Enhance your focus with brain-powered productivity. Monitor your
            mental state while you work.
          </Text>
        </View>

        {/* CSV Upload Form */}
        <View className="w-full mb-6 space-y-4">
          {/* File Selection */}
          <TouchableOpacity
            onPress={handleFilePicker}
            className="w-full bg-gray-100 border-2 border-dashed border-gray-300 py-6 px-4 rounded-xl items-center mb-8"
          >
            <Text className="text-4xl mb-2">📁</Text>
            <Text className="text-lg font-semibold text-gray-700 text-center">
              {selectedFile &&
              selectedFile.assets &&
              selectedFile.assets.length > 0
                ? selectedFile.assets[0].name
                : "Select CSV File"}
            </Text>
            <Text className="text-sm text-gray-500 text-center mt-1">
              Tap to browse for EEG data file
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!selectedFile || isUploading}
            className={`w-full py-4 px-6 rounded-xl shadow-md items-center ${
              !selectedFile || isUploading ? "bg-gray-400" : "bg-blue-500"
            }`}
          >
            <Text className="text-white text-xl font-bold">
              {isUploading ? "Processing..." : "Start Focus Session"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Additional info */}
        <Text variant="muted" className="text-center px-6 leading-6">
          Connect your EEG device to begin monitoring your focus sessions
        </Text>
      </View>
    </View>
  );
}

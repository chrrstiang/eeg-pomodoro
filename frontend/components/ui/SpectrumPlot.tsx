import { View, Dimensions, Text, useColorScheme } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useMemo } from "react";

const screenWidth = Dimensions.get("window").width;

export function SpectrumPlot({
  frequencies,
  powerDensity,
}: {
  frequencies: number[];
  powerDensity: number[];
}) {
  const colorScheme = useColorScheme();

  const chartData = useMemo(() => {
    // Convert to dB scale: 10 * log10(power)
    const powerDB = powerDensity.map((p) => 10 * Math.log10(p + 1e-12));

    // Focus on EEG-relevant frequencies (0-50 Hz)
    const maxIndex = frequencies.findIndex((f) => f > 50);
    const relevantFreqs = frequencies.slice(0, maxIndex);
    const relevantPower = powerDB.slice(0, maxIndex);

    // Create labels for x-axis (every ~10 Hz)
    const labelStep = Math.floor(relevantFreqs.length / 5);
    const labels = relevantFreqs
      .filter((_, i) => i % labelStep === 0)
      .map((f) => f.toString());

    return { relevantPower, labels };
  }, [frequencies, powerDensity]);

  return (
    <View>
      <LineChart
        data={{
          labels: chartData.labels,
          datasets: [
            {
              data: chartData.relevantPower,
            },
            {
              data: [-50], // Fix minimum
              withDots: false,
              strokeWidth: 0,
            },
            {
              data: [50], // Fix maximum
              withDots: false,
              strokeWidth: 0,
            },
          ],
        }}
        width={screenWidth - 32}
        height={220}
        yAxisSuffix=" dB"
        chartConfig={{
          backgroundColor: colorScheme === "dark" ? "#1e293b" : "#ffffff",
          backgroundGradientFrom:
            colorScheme === "dark" ? "#1e293b" : "#ffffff",
          backgroundGradientTo: colorScheme === "dark" ? "#1e293b" : "#ffffff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          labelColor: (opacity = 1) =>
            colorScheme === "dark"
              ? `rgba(255, 255, 255, ${opacity})`
              : `rgba(0, 0, 0, ${opacity})`,
          propsForDots: {
            r: "0",
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
      <Text
        style={{
          textAlign: "center",
          fontSize: 12,
          color: colorScheme === "dark" ? "#94a3b8" : "#666",
        }}
      >
        Frequency (Hz)
      </Text>
    </View>
  );
}

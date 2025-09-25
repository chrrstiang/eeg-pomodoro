import { View, StyleSheet, ViewStyle, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'react-native';

type GradientBackgroundProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

type ColorTuple = readonly [ColorValue, ColorValue, ColorValue];

export function GradientBackground({ children, style }: GradientBackgroundProps) {
  const colorScheme = useColorScheme();
  
  // Define gradient colors as readonly tuples
  const lightColors: ColorTuple = ['#f8fafc', '#e2e8f0', '#cbd5e1'];
  const darkColors: ColorTuple = ['#1e293b', '#0f172a', '#020617'];
  
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={colors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
  },
});

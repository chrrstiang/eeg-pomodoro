const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Set the app root for Expo Router
process.env.EXPO_ROUTER_APP_ROOT = './app';

module.exports = withNativeWind(config, { input: './global.css' });

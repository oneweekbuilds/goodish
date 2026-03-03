module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Note: react-native-reanimated/plugin is now included automatically
    // by babel-preset-expo in Expo SDK 54+. Do NOT add it manually.
  };
};

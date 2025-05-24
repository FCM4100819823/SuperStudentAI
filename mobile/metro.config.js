const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
defaultConfig.resolver.sourceExts.push('cjs');
defaultConfig.resolver.assetExts = [...defaultConfig.resolver.assetExts, 'db'];
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;

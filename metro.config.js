const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add JSON to asset extensions
config.resolver.assetExts.push('json');

// Remove json from sourceExts to treat it as an asset
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'json');

module.exports = config;

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// JSON files are already in sourceExts by default, allowing them to be imported as modules
// This is necessary for i18n locale files and other JSON imports

module.exports = config;

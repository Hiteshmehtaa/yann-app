module.exports = function (api) {
  api.cache(true);

  // Plain env-var check (not api.env()) — api.env() tries to make the config
  // cache itself per-environment, which conflicts with the api.cache(true) above.
  const isProduction = (process.env.BABEL_ENV || process.env.NODE_ENV) === 'production';

  const plugins = [];
  if (isProduction) {
    // Strip console.* calls from production JS bundles only — dev/preview builds keep them.
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }
  plugins.push('react-native-reanimated/plugin'); // Must be last

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};

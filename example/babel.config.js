module.exports = function (api) {
  api.cache(true);

  // The library source is compiled by the app's preset too. The builder-bob
  // helper is not used here: its `include` override makes Expo SDK 56's Metro
  // transformer fail when it computes its cache key.
  return {
    presets: ['babel-preset-expo'],
  };
};

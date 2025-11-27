 module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Removemos o plugin do reanimated para evitar conflitos
    plugins: [], 
  };
};
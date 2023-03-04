/* config-overrides.js */
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = function override(config, env) {
  config.plugins = [
        ...config.plugins,
        new MonacoWebpackPlugin({
            languages: ["solidity", "sol"],
        })
    ]
    let loaders = config.resolve
    loaders.fallback = {
    "path": require.resolve("path-browserify"),
    "stream": require.resolve("stream-browserify"),
    "crypto": require.resolve("crypto-browserify"),
    "assert": require.resolve("assert") ,
    "buffer": require.resolve("buffer") ,
    "util": require.resolve("util"),
    "stream": require.resolve("stream-browserify"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "url": require.resolve("url"),
 }


return config;
}

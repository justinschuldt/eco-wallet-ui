/* config-overrides.js */
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const webpack = require('webpack');

module.exports = function override(config, env) {
    config.plugins = [
        ...config.plugins,
        new MonacoWebpackPlugin({
            languages: ["solidity", "sol"],
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })

    ]
    let loaders = config.resolve
    loaders.fallback = {
        fs: false,
        "path": require.resolve("path-browserify"),
        "stream": require.resolve("stream-browserify"),
        "crypto": false, // require.resolve("crypto-browserify"),
        "assert": require.resolve("assert") ,
        "buffer": require.resolve("buffer") ,
        "util": require.resolve("util"),
        "stream": require.resolve("stream-browserify"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "url": require.resolve("url"),
        "os": require.resolve("os-browserify/browser")
    }

    return config;
}

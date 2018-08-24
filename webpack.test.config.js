/* eslint-disable */
var nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: './tests/main.js',
    target: 'node',
    externals: [nodeExternals()],
    module: {
        rules: [
            {
                test: /\.css$/,
                loader: 'null-loader'
            },
            {
                test: /\.(gif|png|jpe?g|svg)$/i,
                loader: 'null-loader'
            }
        ]
    }
}

/* eslint-disable */
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: ['./tests/test-utils.js', './tests/test-ctlevent.js'],
    output: {
        filename: 'test.bundle.js',
        path: path.resolve(__dirname, 'tests'),
    },
    target: 'node',
    mode: 'development',
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

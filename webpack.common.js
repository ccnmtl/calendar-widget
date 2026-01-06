/* eslint-disable */
const path = require('path');

module.exports = {
    entry: {
        main: './src/js/main.js',
        homepage: './src/js/homepage.js',
        upcoming: './src/js/upcoming.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.(gif|png|jpe?g|svg)$/i,
                type: 'asset/inline'
            }
        ]
    },
};

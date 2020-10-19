/* eslint-disable */
const path = require('path');

module.exports = {
    entry: {
        main: './src/js/main.js',
        homepage: './src/js/homepage.js'
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
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            disable: true,
                            publicPath: 'dist/'
                        }
                    }
                ]
            }
        ]
    },
};

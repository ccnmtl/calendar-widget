/* eslint-disable */
const path = require('path');

module.exports = function (env) {
    return {
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
                                publicPath: (() => {
                                    if (typeof env === "undefined") return 'dist/'
                                    else if (env.production) return 'https://www1.columbia.edu/sec/ccnmtl/remote/edblogs_scripts/ctl-cal-prod/dist/'
                                    else if (env.stage) return 'https://www1.columbia.edu/sec/ccnmtl/remote/edblogs_scripts/ctl-cal-stage/dist/'
                                })()
                            }
                        }
                    ]
                }
            ]
        },
        devtool: 'inline-source-map',
        devServer: {
            publicPath: '/dist/',
            contentBase: './',
            clientLogLevel: 'error'
        }
    };
}

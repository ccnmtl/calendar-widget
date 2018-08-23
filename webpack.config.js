/* eslint-disable */
const path = require('path');

module.exports = function (env) {
    return {
        entry: './src/js/main.js',
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, 'dist')
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
                                    if (env.production) return 'https://www1.columbia.edu/sec/ccnmtl/remote/edblogs_scripts/ctl-cal-prod/dist/'
                                    else if (env.stage) return 'https://www1.columbia.edu/sec/ccnmtl/remote/edblogs_scripts/ctl-cal-stage/dist/'
                                    else return 'dist/'
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

/* eslint-disable */
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'production',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.(gif|png|jpe?g|svg)$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            disable: true,
                            publicPath: 'https://www1.columbia.edu/sec/ccnmtl/remote/edblogs_scripts/ctl-cal-stage/dist/'
                        }
                    }
                ]
            }
        ]
    },
});


const path = require('path');
const webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const DynamicCdnWebpackPlugin = require('dynamic-cdn-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const nodeExternals = require('webpack-node-externals');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    entry: './src/index.js',
    // target: 'node',
    // externals:[(context, request, callback) => {
    //     const nodeModulesPath = path.resolve(__dirname, '../node_modules');
    //     const fixedRequest = request.replace(`${nodeModulesPath}/`, '');
    //     return nodeExternals({whitelist: [/\.(?!(?:jsx?|json)$).{1,5}$/i],})(context, fixedRequest, callback);
    // }],
    externals:{'jquery':'jQuery','bootstrap':'jQuery','bootstrap-slider':'jQuery','d3':'d3'},
    plugins: [
        new HTMLWebpackPlugin({
            title: 'EPISTEME',
            logo: 'DKFZ_Logo-Research_en_Black-Blue_CMYK.eps.png',
            template: 'src/html/EPISTEME.ejs'
        }),
        // new DynamicCdnWebpackPlugin(),
        new CleanWebpackPlugin(['dist']),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            'window.$': 'jquery',
        }),
        new OptimizeCSSAssetsPlugin({}),
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css"
        }),
        new UglifyJSPlugin({
            cache: true,
            parallel: true,
            uglifyOptions: {
                output: {
                    comments: false
                }
            }
        }),
        new webpack.optimize.AggressiveMergingPlugin(),
        // new BundleAnalyzerPlugin()
    ],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    node: {
        fs: "empty"
    },
    module: {
        rules: [
            {test: /\.js/, exclude: /node_modules/ ,loader:'babel-loader',options: {presets: ['env']}},
            {test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader']},
            {test: /\.(png|svg|jpg|gif)$/, use: ['file-loader']},
            {test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader'},
            {test: /\.(woff|woff2)$/, loader: 'url-loader?prefix=font/&limit=5000'},
            {test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/octet-stream'},
            {test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=image/svg+xml'},
            {test: /bootstrap\/dist\/js\/umd\//, loader: 'imports-loader?jQuery=jquery'},
        ],
    },
    devServer: {
        contentBase: path.resolve(__dirname, './dist'),
        compress: true,
        port: '4800',
        stats: 'errors-only',
    },
};

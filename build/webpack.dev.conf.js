const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const autoprefixer = require('autoprefixer');
const jsonImporter = require('node-sass-json-importer');

const FriendlyErrors = require('friendly-errors-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const utils = require('./utils');
const config = require('../config');
const baseWebpackConfig = require('./webpack.base.conf');

const projectRoot = path.resolve(__dirname, '../');
const port = process.env.PORT || config.dev.port;


Object.keys(baseWebpackConfig.entry).forEach((name) => {
  baseWebpackConfig.entry[name] =
    [ `webpack-hot-middleware/client?reload=true&path=http://localhost:${port}/__webpack_hmr`
    ].concat(baseWebpackConfig.entry[name]);
});

module.exports = merge(baseWebpackConfig, {
  output: {
    path: config.dev.assetsRoot,
    publicPath: config.dev.assetsPublicPath,
    filename: '[name].js'
  },

  module: {
    rules:
    [
      { test: /\.(scss|css)$/
      , use:
          [ { loader: 'style-loader' }
          , { loader: 'css-loader' }
          , { loader: 'postcss-loader'
            , options:
              { plugins: [ autoprefixer() ]
              , sourceMap: config.dev.cssSourceMap
              , sourceMapContents: false
              }
            }
          , { loader: 'sass-loader'
            , options:
              { sourceMap: config.dev.cssSourceMap
              , importer: jsonImporter
              , includePaths: [ path.resolve(__dirname, '../app/config') ]
              }
            }
        ]
      , include: [ utils.srcPath('styles') ]
      }
    ]
  },

  //mode: 'development',
  // eval-source-map is faster for development
  devtool: '#eval-source-map',
  target: 'electron-renderer',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.LoaderOptionsPlugin({ debug: true }),
    new webpack.DefinePlugin({
      __DEV__: true,
      'process.env.NODE_ENV': JSON.stringify(config.dev.env.NODE_ENV),
      'process.env.PORT': JSON.stringify(config.dev.env.PORT)
    }),

    new FriendlyErrors(),
  ],
  node: {
    __dirname: false,
    __filename: false
  }
});

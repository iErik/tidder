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

Object.keys(baseWebpackConfig.entry).forEach(function(name) {
  baseWebpackConfig.entry[name] =
    [`webpack-hot-middleware/client?path=http://localhost:${port}/__webpack_hmr`
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
      { test: /\.ts$/
      , use:
          [ { loader: '@angularclass/hmr-loader' }
          , { loader: 'awesome-typescript-loader'
            , options: { configFileName: 'tsconfig.webpack.json' }
            }
          , { loader: 'angular2-template-loader' }
          ]
      , include: [ path.join(projectRoot, 'app') ]
      , exclude: [/\.(spec|e2e)\.ts$/]
      }
      ,
      { test: /\.(scss|css)$/
      , use:
          [ { loader: 'style-loader' }
          , { loader: 'css-loader' }
          , { loader: 'postcss-loader'
            , options:
              { plugins: [ autoprefixer({ browsers: ['electron 1.7'] }) ]
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

  // eval-source-map is faster for development
  devtool: '#eval-source-map',
  target: 'electron-renderer',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.LoaderOptionsPlugin({ debug: true }),
    new webpack.DefinePlugin({ 'process.env': config.dev.env }),

    new FriendlyErrors(),
  ]
});

const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const autoprefixer = require('autoprefixer');
const jsonImporter = require('node-sass-json-importer');

const CheckerPlugin = require('awesome-typescript-loader').CheckerPlugin;
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ngcWebpack = require('ngc-webpack');

const baseWebpackConfig = require('./webpack.base.conf');
const config = require('../config');
const utils = require('./utils');
const env = config.build.env;

module.exports = merge(baseWebpackConfig,
{ output:
    { path: config.build.assetsRoot
    , filename: utils.assetsPath('scripts/[name].[chunkhash].js')
    , chunkFilename: utils.assetsPath('scripts/[id].[chunkhash].js')
    , publicPath: config.build.assetsPublicPath
    , libraryTarget: 'commonjs2'
    }

, devtool: config.build.cssSourceMap ? '#source-map' : false
, target: 'electron-renderer'

, module:
  { rules:
    [
      { test: /\.(scss|css)$/
       , loader: ExtractTextPlugin.extract({
           fallback: 'style-loader',
           use:
           [ { loader: 'css-loader'
             , options: { sourceMap: config.build.cssSourceMap }
             }
           , { loader: 'postcss-loader'
             , options:
               { plugins: [autoprefixer({ browsers: ['electron 1.7'] })]
               , sourceMap: config.build.cssSourceMap
               }
             }
           , { loader: 'resolve-url-loader' }
           , { loader: 'sass-loader'
             , options:
              { sourceMap: config.build.cssSourceMap
              , importer: jsonImporter
              , includePaths: [ path.resolve(__dirname, '../app/config') ]
              }
             }
           ]
         })
       , include: [ utils.srcPath('styles') ]
      }
    ]
  }

, plugins:
  [ new webpack.DefinePlugin({
      'process.env': env
    })

    // Minimize all JavaScript output of chunks. Loaders are switched
    // into minimizing mode. You can pass an object containing UglifyJS
    // options.
  , new webpack.optimize.UglifyJsPlugin(
      { compress: { warnings: false }
      })

  , new webpack.optimize.CommonsChunkPlugin(
    { name: 'vendor'
    , minChunks: function(module, count) {
        // Any required modules inside node_modules are extracted to vendor
        return (
          module.resource &&
          /\.js$/.test(module.resource) &&
          module.resource.indexOf(
            path.join(__dirname, '../node_modules')
          ) === 0
        )
      }
    })

    // Extract webpack runtime and module manifest to it's own file
    // in order to prevent vendor hash from being updated whenever
    // app bundle is updated.
  , new webpack.optimize.CommonsChunkPlugin(
      { name: 'manifest'
      , chunks: ['vendor']
      })

    // It moves every require("style.css") in entry chunks into a
    // separate css output file. So your styles are no longer inlined
    // into the javascript, but separate in a css bundle file (styles.css)
  , new ExtractTextPlugin(
      { filename: utils.assetsPath('css/[name].[contenthash].css')
      , allChunks: true
      })

  , new CheckerPlugin()

    // Generates an HTML5 file for you that includes all your webpack
    // bundles in the body/head using script/link tags.
  , new HtmlWebpackPlugin(
      { filename: '../app.html'
      , template: 'app/app.dev.html'
      , inject: true
      , minify:
        { removeComments: true
        , collapseWhitespace: true
        , removeAttributeQuotes: true
        }

        // Necessary to consistently work with multiple chunks via CommonsChunkPlugin
      , chunksSortMode: 'dependency'
      })
  ]

, node:
  { __dirname: false
  , __filename: false
  }
});

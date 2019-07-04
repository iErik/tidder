const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const autoprefixer = require('autoprefixer');
const jsonImporter = require('node-sass-json-importer');

const FriendlyErrors = require('friendly-errors-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const utils = require('./utils');
const config = require('../config');
const baseConfig = require('./webpack.base.conf');

const projectRoot = path.resolve(__dirname, '../');
const port = process.env.PORT || config.dev.port;


Object.keys(baseConfig.entry).forEach((name) => {
  baseConfig.entry[name] =
    [ `webpack-hot-middleware/client?reload=true&path=http://localhost:${port}/__webpack_hmr`
    ].concat(baseConfig.entry[name]);
});

module.exports = merge.smart(baseConfig,
{ output:
    { path: config.dev.assetsRoot
    , publicPath: config.dev.assetsPublicPath
    , filename: '[name].js'
    }

/* react-hot-loader is not compatible with hooks yet
, resolve:
    { alias: { 'react-dom': '@hot-loader/react-dom' } }
*/

, module:
    { rules:
        [
          { test: /\.(sa|sc|c)ss$/
          , use:
              [ { loader: 'postcss-loader'
                , options:
                  { sourceMap: config.dev.cssSourceMap
                  , sourceMapContents: false
                  }
                }
              , { loader: 'sass-loader'
                , options: { sourceMap: config.dev.cssSourceMap }
                }
              ]
          }
        ]
    }

, mode: 'development'
, devtool: '#eval-source-map'
, target: 'electron-renderer'
, plugins:
    [ new FriendlyErrors()
    , new webpack.HotModuleReplacementPlugin()
    , new webpack.LoaderOptionsPlugin({ debug: true })
    , new webpack.DefinePlugin(
        { __DEV__: true
        , 'process.env.NODE_ENV': JSON.stringify(config.dev.env.NODE_ENV)
        , 'process.env.PORT': JSON.stringify(config.dev.env.PORT)
        })
  ]

, node:
    { __dirname: false
    , __filename: false
    }
});

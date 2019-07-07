const path = require('path');
const webpack = require('webpack');
const config = require('../config');
const utils = require('./utils');
const autoprefixer = require('autoprefixer');
const jsonImporter = require('node-sass-json-importer');

const projectRoot = path.resolve(__dirname, '../');
const env = process.env.NODE_ENV;

const externals = require('../app/package.json').dependencies;

const cssSourceMapDev = (env === 'development' && config.dev.cssSourceMap);
const cssSourceMapProd = (env === 'production' && config.build.cssSourceMap);
const useCssSourceMap = cssSourceMapDev || cssSourceMapProd;

module.exports =
{ entry: { app: ['./app/app.tsx'] }

, output:
  { path: config.build.assetsRoot
  , publicPath: process.env.NODE_ENV === 'production'
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath
  , filename: '[name].js'
  , libraryTarget: 'commonjs2'
  }

, resolve:
  { extensions: ['.js', '.jsx', '.ts', '.tsx', '.sass', '.scss', '.json']
  , alias:
    { '@app': path.resolve(__dirname, '../app')
    , '@containers': path.resolve(__dirname, '../app/containers')
    , '@components': path.resolve(__dirname, '../app/components')
    , '@layouts': path.resolve(__dirname, '../app/layouts')
    , '@pages': path.resolve(__dirname, '../app/pages')

    , '@collections': path.resolve(__dirname, '../app/database/collections')
    , '@database': path.resolve(__dirname, '../app/database')
    , '@seeds': path.resolve(__dirname, '../app/database/seeds')
    , '@storage': path.resolve(__dirname, '../app/storage')

    , '@store': path.resolve(__dirname, '../app/store')
    , '@services': path.resolve(__dirname, '../app/store/services')
    , '@reducers': path.resolve(__dirname, '../app/store/reducers')
    , '@actions': path.resolve(__dirname, '../app/store/actions')
    , '@sagas': path.resolve(__dirname, '../app/store/sagas')

    , '@styles': path.resolve(__dirname, '../app/styles')
    , '@config': path.resolve(__dirname, '../app/config')
    , '@utils': path.resolve(__dirname, '../app/utils')
    }
  }

//, externals: Object.keys(externals || {})

, module:
  { rules:
    [
      { test: /\.(j|t)sx?$/
      , include: [ path.join(projectRoot, 'app') ]
      , exclude: /node_modules/
      , use:
        { loader: 'babel-loader'
        , options:
          { cacheDirectory: true
          , babelrc: false
          , presets:
              [ [ '@babel/preset-env'
                , { targets: { browsers: 'electron 5.0' } } ]
              , '@babel/preset-typescript'
              , '@babel/preset-react',
              ],
            plugins:
              [ ['@babel/plugin-proposal-decorators', { legacy: true }]
              , ['@babel/plugin-proposal-class-properties', { loose: true }]
              //, 'react-hot-loader/babel'
              ]
          }
        }
      }
      ,
      { test: /\.(sa|sc|c)ss$/
      , use:
          [ { loader: 'style-loader' }
          , { loader: 'css-loader' }
          , { loader: 'postcss-loader'
            , options:
              { plugins: [ autoprefixer() ]
              }
            }
          , { loader: 'sass-loader'
            , options:
              { importer: jsonImporter()
              , includePaths: [ path.resolve(__dirname, '../app/config') ]
              }
            }
          ]
      }
      ,
      { test: /\.html$/
      , use: 'raw-loader'
      }
      ,
      { test: /\.(ico|webp|png|jpe?g|gif|svg)(\?.*)?$/
      , loader: 'url-loader'
      , options:
        { limit: 10000
        , name: utils.assetsPath('images/[name].[hash:7].[ext]')
        }
      }
      ,
      { test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/
      , loader: 'url-loader'
      , options:
        { limit: 8000000
        , name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
        }
      }
    ]
  }
};

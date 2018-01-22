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
{ entry:
    { polyfills: ['./app/polyfills.ts']
    , main: ['./app/main.ts']
    }

, output:
    { path: config.build.assetsRoot
    , publicPath: process.env.NODE_ENV === 'production'
        ? config.build.assetsPublicPath
        : config.dev.assetsPublicPath
    , filename: '[name].js'
    , libraryTarget: 'commonjs2'
    }

, resolve:
    { extensions: ['.js', '.ts', '.scss', '.json']
    , modules: [path.join(__dirname, '../app/node_modules')]
    , alias:
        { 'app': path.resolve(__dirname, '../app')
        , 'core': path.resolve(__dirname, '../app/core')
        , 'utils': path.resolve(__dirname, '../app/utils')
        , 'pages': path.resolve(__dirname, '../app/pages')
        , 'config': path.resolve(__dirname, '../app/config')
        , 'layouts': path.resolve(__dirname, '../app/layouts')
        , 'services': path.resolve(__dirname, '../app/services')
        , 'components': path.resolve(__dirname, '../app/components')

        , 'styles': path.resolve(__dirname, '../app/styles')
        , 'static': path.resolve(__dirname, '../app/static')
        }
    }

//, externals: Object.keys(externals || {})

, module:
    { rules:
      [
        { test: /\.(scss|css)$/
        , use:
            [ { loader: 'to-string-loader' }
            , { loader: 'css-loader' }
            , { loader: 'postcss-loader'
              , options:
                { plugins: [ autoprefixer({ browsers: ['electron 1.7'] }) ]
                }
              }
            , { loader: 'sass-loader'
              , options:
                { importer: jsonImporter
                , includePaths: [ path.resolve(__dirname, '../app/config') ]
                }
              }
            ]
        , exclude: [ utils.srcPath('styles') ]
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

, plugins:
    [ new webpack.optimize.CommonsChunkPlugin({
        name: 'polyfills',
        chunks: ['polyfills']
      })

    , new webpack.ContextReplacementPlugin(
        /angular(\\|\/)core(\\|\/)@angular/,
        utils.srcPath(''), { }
      )
    ]
};

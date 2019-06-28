const webpack = require('webpack');
const merge = require('webpack-merge');

const baseConfig = require('./webpack.base.conf');
const config = require('../config');

module.exports = merge(baseConfig,
{ entry: ['./app/main.dev.ts']
, output:
  { path: __dirname
  , filename: '../app/main.js'
  }

, target: 'electron-main'
, node:
  { __dirname: false
  , __filename: false
  }

, plugins:
  [ new webpack.DefinePlugin(
    { 'process.env': config.build.env
    })
  ]
});

var path = require('path');
var config = require('../config');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var ROOT = path.resolve(__dirname, '..');

exports.assetsPath = function(_path) {
  var assetsSubDirectory = process.env.NODE_ENV === 'production'
    ? config.build.assetsSubDirectory
    : config.dev.assetsSubDirectory
  return path.posix.join(assetsSubDirectory, _path);
}

exports.srcPath = function(_path) {
  var _srcPath = path.posix.join(ROOT, 'app');
  return path.posix.join(_srcPath, _path);
}

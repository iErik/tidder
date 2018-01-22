require('shelljs/global');
env.NODE_ENV = 'production';

const path = require('path');
const config = require('../config');
const ora = require('ora');
const webpack = require('webpack');

const webpackRendererConfig = require('./webpack.prod.conf');
const webpackMainConfig = require('./webpack.electron.conf');

var spinner = ora('building for production...');
spinner.start()

var assetsPath = config.build.assetsRoot
rm('-rf', assetsPath);
mkdir('-p', assetsPath);

webpack([webpackMainConfig, webpackRendererConfig], function(err, stats) {
  spinner.stop();
  if (err) throw err;

  process.stdout.write(stats.toString({
    colors: true,
    progress: true,
    modules: true,
    children: false,
    chunks: false,
    chunkModule: false,
    errors: true,
    errorDetails: true,
    moduleTrace: true,
    transpileOnly: false,
  }) + '\n');
});

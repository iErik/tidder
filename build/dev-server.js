const path = require('path');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const spawn = require('child_process').spawn;

const webpackConfig = require('./webpack.dev.conf');
const config = require('../config');

if (!process.env.NODE_ENV)
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV);

var app = express();
var compiler = webpack(webpackConfig);

var PORT = process.env.PORT || config.dev.port;
var URI = 'http://localhost:' + PORT

var hotMiddleware = webpackHotMiddleware(compiler, {
  log: () => { }
});

var devMiddleware = webpackDevMiddleware(compiler, {
  publicPath: webpackConfig.output.publicPath,
  logLevel: 'silent'
});

devMiddleware.waitUntilValid(function() {
  console.log('> Serving application assets at ' + URI + '\n');
});

app.use(devMiddleware);
app.use(hotMiddleware);

const server = app.listen(PORT, serverError => {
  if (serverError)
    return console.error(serverError);

  spawn('npm', ['run', 'start-dev'], { shell: true, env: process.env, stdio: 'inherit' })
    .on('close', code => process.exit(code))
    .on('error', spawnError => console.error(spawnError))
});

process.on('SIGTERM', () => {
  console.log('Stopping dev server');

  devMiddleware.close();
  server.close(() => process.exit(0));
});

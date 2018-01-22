const path = require('path');

const prodEnv = require('./prod.env');
const devEnv = require('./dev.env');

module.exports = {
  build: {
    env: prodEnv,
    assetsRoot: path.resolve(__dirname, '../app/assets'),
    assetsSubDirectory: '.',
    assetsPublicPath: './assets/',
    cssSourceMap: false
  },
  dev: {
    env: devEnv,
    port: devEnv['PORT'] || 3000,
    assetsRoot: path.resolve(__dirname, '../app/assets'),
    assetsSubDirectory: '.',
    assetsPublicPath: `http://localhost:${devEnv.PORT || 2000}/assets/`,
    cssSourceMap: true
  }
}

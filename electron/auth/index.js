// Reddit authentication for the main process: browser-login.js handles
// logging in through the system browser, and tokens.js the tokens it yields.

const { login, cancelLogin } = require('./browser-login');
const { refresh, logout, userAgent } = require('./tokens');

module.exports = { login, cancelLogin, refresh, logout, userAgent };

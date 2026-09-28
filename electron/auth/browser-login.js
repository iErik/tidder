// Reddit login using the authorization code flow in the system browser.
//
// A login starts a small HTTP server on the redirect URI's address (it must
// match the one registered for the app at reddit.com/prefs/apps), opens
// Reddit's authorize page in the default browser, and waits for Reddit to
// redirect back with a one-time code, which is exchanged for tokens.

const crypto = require('crypto');
const http = require('http');
const { shell } = require('electron');

const { exchangeCode } = require('./tokens');

const config = require('../../app/config/authConfig.json');

const REDIRECT = new URL(config.redirectUri);
const LOGIN_TIMEOUT = 5 * 60 * 1000;

// Shown in the browser tab after Reddit redirects back.
const PAGES = {
  loggedIn: 'You\'re logged in to Tidder. You can close this tab.',
  denied: 'Login cancelled. You can close this tab.',
  invalid: 'This login link is invalid or has expired. Please log in again from Tidder.',
  redditError: 'Reddit couldn\'t complete the login. Please try again from Tidder.',
  exchangeFailed: 'Tidder couldn\'t finish logging in. Please try again.'
};

function authorizeUrl(state) {
  return `${config.authorizeUrl}?` + new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    state,
    redirect_uri: config.redirectUri,
    duration: config.duration,
    scope: config.scope.join(',')
  });
}

// Works out what a request to the local server means. `expectedState` is
// the state of the login in progress, or null once its redirect was used.

function parseCallback(url, expectedState) {
  if (url.pathname !== REDIRECT.pathname)
    return { type: 'not-found' };

  if (!expectedState || url.searchParams.get('state') !== expectedState)
    return { type: 'invalid' };

  const error = url.searchParams.get('error');
  const code = url.searchParams.get('code');

  if (error === 'access_denied')
    return { type: 'denied' };

  if (error || !code)
    return { type: 'error', reason: error || 'no code' };

  return { type: 'code', code };
}

function respond(res, status, message) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Connection': 'close'
  });

  res.end(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Tidder</title></head>
<body style="display:flex;align-items:center;justify-content:center;height:90vh;margin:0;
  font-family:Lato,-apple-system,sans-serif;background:#F6F6F6;color:#515151">
  <p style="font-size:14px;letter-spacing:1px">${message}</p>
</body>
</html>`);
}

// One login in progress. Its promise resolves with { accessToken, expiresIn },
// or null if the user declined or cancelled, and rejects if the login
// couldn't be completed. finish() is the only way it ends.

class LoginAttempt {
  constructor() {
    this.state = crypto.randomBytes(16).toString('hex');
    this.authorizeUrl = authorizeUrl(this.state);
    this.settled = false;
    this.timer = null;

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    // Resolves once the server has let go of the port.
    this.closed = new Promise(resolve => { this.onClosed = resolve; });

    this.server = http.createServer((req, res) => this.handleRequest(req, res));
  }

  start() {
    // Cancelled while waiting for the previous login's server to close.
    if (this.settled)
      return this.promise;

    this.server.on('error', (err) => {
      this.finish(err.code === 'EADDRINUSE'
        ? new Error(`Port ${REDIRECT.port} is in use by another program. Close it and try again.`)
        : err);
    });

    this.server.listen(Number(REDIRECT.port), REDIRECT.hostname, () => this.reopen());
    this.timer = setTimeout(() => this.finish(new Error('Login timed out. Please try again.')), LOGIN_TIMEOUT);

    return this.promise;
  }

  reopen() {
    shell.openExternal(this.authorizeUrl);
  }

  cancel() {
    this.finish(null, null);
  }

  async handleRequest(req, res) {
    const callback = parseCallback(new URL(req.url, REDIRECT), this.state);

    if (callback.type === 'not-found') {
      res.writeHead(404, { 'Connection': 'close' }).end();
      return;
    }

    if (callback.type === 'invalid') {
      respond(res, 400, PAGES.invalid);
      return;
    }

    // Only the first redirect with this login's state is accepted.
    this.state = null;

    if (callback.type === 'denied') {
      respond(res, 200, PAGES.denied);
      this.finish(null, null);
    } else if (callback.type === 'error') {
      respond(res, 400, PAGES.redditError);
      this.finish(new Error(`Reddit couldn't complete the login (${callback.reason})`));
    } else {
      await this.exchange(res, callback.code);
    }
  }

  async exchange(res, code) {
    try {
      const tokens = await exchangeCode(code);
      respond(res, 200, PAGES.loggedIn);
      this.finish(null, tokens);
    } catch (err) {
      respond(res, 500, PAGES.exchangeFailed);
      this.finish(err);
    }
  }

  finish(err, result) {
    if (this.settled) return;
    this.settled = true;

    clearTimeout(this.timer);
    this.server.close(() => this.onClosed());

    if (err) this.reject(err);
    else this.resolve(result);
  }
}

let pendingLogin = null;
let lastClosed = Promise.resolve();

// Starts a login, or if one is already in progress, opens its page in the
// browser again and returns the same promise. A new login waits for the
// previous one's server to close, so logging in again right after a cancel
// doesn't find the port still in use.

function login() {
  if (pendingLogin) {
    pendingLogin.reopen();
    return pendingLogin.promise;
  }

  const attempt = new LoginAttempt();
  const clear = () => { if (pendingLogin === attempt) pendingLogin = null; };

  pendingLogin = attempt;
  attempt.promise.then(clear, clear);

  const previousClosed = lastClosed;
  lastClosed = attempt.closed;

  return previousClosed.then(() => attempt.start());
}

function cancelLogin() {
  if (pendingLogin)
    pendingLogin.cancel();
}

module.exports = { login, cancelLogin, parseCallback };

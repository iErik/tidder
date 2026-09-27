// Reddit login using the authorization code flow in the system browser.
//
// login() starts a small HTTP server on the redirect URI's address (it must
// match the one registered for the app at reddit.com/prefs/apps), opens
// Reddit's authorize page in the default browser, and waits for Reddit to
// redirect back with a one-time code, which is exchanged for tokens here.
// The long-lived refresh token never leaves the main process; it's stored
// encrypted with safeStorage. The renderer only gets short-lived access tokens.

const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { app, net, safeStorage, shell } = require('electron');

const config = require('../app/config/authConfig.json');

const LOGIN_TIMEOUT = 5 * 60 * 1000;

let pendingLogin = null;
let refreshToken = null;

function userAgent() {
  return `desktop:org.isidore.tidder:v${app.getVersion()} (by /u/${config.developer})`;
}

// Refresh token storage

function tokenFilePath() {
  return path.join(app.getPath('userData'), 'Auth');
}

function saveRefreshToken(token) {
  refreshToken = token;

  // Without OS-level encryption (e.g. Linux without a keyring) the token is
  // only kept for this session rather than written to disk in plain text.
  if (safeStorage.isEncryptionAvailable())
    fs.writeFileSync(tokenFilePath(), safeStorage.encryptString(token));
}

function loadRefreshToken() {
  if (refreshToken || !safeStorage.isEncryptionAvailable())
    return refreshToken;

  try {
    refreshToken = safeStorage.decryptString(fs.readFileSync(tokenFilePath()));
  } catch (err) {
    refreshToken = null;
  }

  return refreshToken;
}

function clearRefreshToken() {
  refreshToken = null;
  fs.rmSync(tokenFilePath(), { force: true });
}

// Requests to Reddit's token endpoints. Installed apps authenticate with
// their client ID and an empty secret.

async function tokenRequest(url, params) {
  const res = await net.fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${config.clientId}:`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent()
    },
    body: new URLSearchParams(params).toString()
  });

  const text = await res.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) { }

  if (!res.ok || data.error) {
    const err = new Error(`Reddit returned an error (${data.error || res.status})`);
    err.rejected = res.status === 400 || res.status === 401 || data.error === 'invalid_grant';
    throw err;
  }

  return data;
}

function toSession(data) {
  return {
    accessToken: data.access_token,
    expiresIn: Number(data.expires_in) || 3600
  };
}

// The page shown in the browser tab after Reddit redirects back.

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

// Resolves with { accessToken, expiresIn } once logged in, or null if the
// user declined or cancelled. Rejects if the login couldn't be completed.

function login() {
  if (pendingLogin) {
    shell.openExternal(pendingLogin.authorizeUrl);
    return pendingLogin.promise;
  }

  const redirect = new URL(config.redirectUri);
  let state = crypto.randomBytes(16).toString('hex');

  const authorizeUrl = `${config.authorizeUrl}?` + new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    state,
    redirect_uri: config.redirectUri,
    duration: config.duration,
    scope: config.scope.join(',')
  });

  let server = null;
  let timer = null;
  let settled = false;
  let finish = null;

  const promise = new Promise((resolve, reject) => {
    finish = (err, result) => {
      if (settled) return;
      settled = true;

      clearTimeout(timer);
      server.close(() => { });
      pendingLogin = null;

      if (err) reject(err);
      else resolve(result);
    };

    server = http.createServer(async (req, res) => {
      const url = new URL(req.url, config.redirectUri);

      if (url.pathname !== redirect.pathname) {
        res.writeHead(404, { 'Connection': 'close' }).end();
        return;
      }

      // Only the redirect for this login attempt is accepted, and only once.
      if (!state || url.searchParams.get('state') !== state) {
        respond(res, 400, 'This login link is invalid or has expired. Please log in again from Tidder.');
        return;
      }

      state = null;

      const error = url.searchParams.get('error');
      const code = url.searchParams.get('code');

      if (error === 'access_denied') {
        respond(res, 200, 'Login cancelled. You can close this tab.');
        finish(null, null);
        return;
      }

      if (error || !code) {
        respond(res, 400, 'Reddit couldn\'t complete the login. Please try again from Tidder.');
        finish(new Error(`Reddit couldn't complete the login (${error || 'no code'})`));
        return;
      }

      try {
        const data = await tokenRequest(config.tokenUrl, {
          grant_type: 'authorization_code',
          code,
          redirect_uri: config.redirectUri
        });

        if (data.refresh_token)
          saveRefreshToken(data.refresh_token);

        respond(res, 200, 'You\'re logged in to Tidder. You can close this tab.');
        finish(null, toSession(data));
      } catch (err) {
        respond(res, 500, 'Tidder couldn\'t finish logging in. Please try again.');
        finish(err);
      }
    });

    server.on('error', (err) => {
      finish(err.code === 'EADDRINUSE'
        ? new Error(`Port ${redirect.port} is in use by another program. Close it and try again.`)
        : err);
    });

    server.listen(Number(redirect.port), redirect.hostname, () => {
      shell.openExternal(authorizeUrl);
    });

    timer = setTimeout(() => finish(new Error('Login timed out. Please try again.')), LOGIN_TIMEOUT);
  });

  pendingLogin = { authorizeUrl, promise, cancel: () => finish(null, null) };

  return promise;
}

function cancelLogin() {
  if (pendingLogin)
    pendingLogin.cancel();
}

// Resolves with a new { accessToken, expiresIn }, null if there's no
// usable refresh token (logged out), or { error } if Reddit couldn't be
// reached and it's worth trying again later.

async function refresh() {
  const token = loadRefreshToken();

  if (!token)
    return null;

  try {
    return toSession(await tokenRequest(config.tokenUrl, {
      grant_type: 'refresh_token',
      refresh_token: token
    }));
  } catch (err) {
    if (err.rejected) {
      clearRefreshToken();
      return null;
    }

    return { error: err.message };
  }
}

// Forgets the refresh token and revokes it with Reddit, which also revokes
// the access tokens issued from it.

async function logout() {
  const token = loadRefreshToken();
  clearRefreshToken();

  if (!token)
    return;

  try {
    await tokenRequest(config.revokeUrl, { token, token_type_hint: 'refresh_token' });
  } catch (err) { }
}

module.exports = { login, cancelLogin, refresh, logout, userAgent };

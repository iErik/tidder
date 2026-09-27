// Reddit tokens: the token endpoint requests, and the refresh token, which
// never leaves the main process. It's stored encrypted with safeStorage; the
// renderer only gets short-lived access tokens.

const fs = require('fs');
const path = require('path');
const { app, net, safeStorage } = require('electron');

const config = require('../../app/config/authConfig.json');

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

// Exchanges the one-time code from Reddit's redirect for tokens, keeping
// the refresh token. Resolves with { accessToken, expiresIn }.

async function exchangeCode(code) {
  const data = await tokenRequest(config.tokenUrl, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri
  });

  if (data.refresh_token)
    saveRefreshToken(data.refresh_token);

  return toSession(data);
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

module.exports = { exchangeCode, refresh, logout, userAgent };

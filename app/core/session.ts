// The access token and its expiry, kept in localStorage so a reload doesn't
// need a refresh. The refresh token never leaves the main process (see
// electron/auth/tokens.js).

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getExpiresAt(): number {
  return Number(localStorage.getItem('expires_at')) || 0;
}

export function hasValidToken(): boolean {
  return Date.now() < getExpiresAt();
}

export function storeTokens(tokens: TidderAuthTokens): void {
  localStorage.setItem('access_token', tokens.accessToken);
  localStorage.setItem('expires_at', String(Date.now() + tokens.expiresIn * 1000));
}

export function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('expires_at');
}

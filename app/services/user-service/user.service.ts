import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { BehaviorSubject } from 'rxjs';

import oauthConfig from 'config/authConfig.json';

// Refresh the access token this long before it expires, and wait this long
// before retrying when Reddit can't be reached.
const REFRESH_MARGIN = 5 * 60 * 1000;
const REFRESH_RETRY_DELAY = 60 * 1000;

export interface LoginStatus {
  state: 'idle' | 'waiting' | 'error';
  message?: string;
}

// TODO: Create a proper events API

@Injectable()
export class UserService {
  private _userData: any;
  private refreshTimer: any;

  private updatingState = new BehaviorSubject<boolean>(false);
  public updatingState$ = this.updatingState.asObservable();

  private userLoggedIn  = new BehaviorSubject<boolean>(false);
  public  userLoggedIn$ = this.userLoggedIn.asObservable();

  private loginStatus = new BehaviorSubject<LoginStatus>({ state: 'idle' });
  public  loginStatus$ = this.loginStatus.asObservable();

  constructor(private http: HttpClient) { }

  setup(): void {
    if (this.isAuthenticated()) {
      this.scheduleRefresh();
      this.getIdentity();
      return;
    }

    // The access token is gone or expired; the main process may still have
    // a refresh token from a previous session to log in with silently.
    this.updatingState.next(true);

    window.tidder.auth.refresh().then((result) => {
      if (result && !('error' in result)) {
        this.storeTokens(result);
        this.getIdentity();
      } else {
        this.updatingState.next(false);
      }
    });
  }

  getIdentity(): void {
    console.log("Getting User Identity...");

    this.updatingState.next(true);
    let options = { headers: this.getAuthenticatedHeaders() };

    this.http.get(`${oauthConfig.authBaseURI}/api/v1/me.json`, options)
      .subscribe({
        next: (res) => {
          this._userData = res;
          this.updatingState.next(false);
          this.userLoggedIn.next(false);
        },
        error: (err) => {
          // Reddit rejected the token (revoked or expired), so the user is
          // effectively logged out and should see the login screen again.
          if (err.status === 401 || err.status === 403)
            this.logout();
          else
            this.updatingState.next(false);
        }
      });
  }

  // Opens Reddit's login page in the system browser. The main process
  // (see electron/auth/browser-login.js) waits for Reddit to redirect back.
  login(): void {
    if (this.loginStatus.getValue().state === 'waiting') {
      // Already waiting: this just opens the login page in the browser again.
      window.tidder.auth.login();
      return;
    }

    this.loginStatus.next({ state: 'waiting' });

    window.tidder.auth.login().then((result) => {
      if (!result) {
        this.loginStatus.next({ state: 'idle' });
      } else if ('error' in result) {
        this.loginStatus.next({ state: 'error', message: result.error });
      } else {
        this.loginStatus.next({ state: 'idle' });
        this.storeTokens(result);
        this.getIdentity();
      }
    });
  }

  cancelLogin(): void {
    window.tidder.auth.cancel();
  }

  logout(): void {
    console.log("loggin out")

    this.updatingState.next(true);
    clearTimeout(this.refreshTimer);

    localStorage.removeItem('access_token');
    localStorage.removeItem('expires_at');
    window.tidder.auth.logout();

    this._userData = null;
    location.hash = '';

    this.userLoggedIn.next(false);
    this.updatingState.next(false);
  }

  isAuthenticated(): boolean {
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  getToken(): string {
    return localStorage.getItem('access_token');
  }

  getAuthenticatedHeaders(): HttpHeaders {
    return this.isAuthenticated()
      ? new HttpHeaders({ 'Authorization': `Bearer ${this.getToken()}` })
      : new HttpHeaders({ });
  }

  get userData() {
    return this._userData || { };
  }

  private storeTokens(tokens: TidderAuthTokens): void {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('expires_at', String(Date.now() + tokens.expiresIn * 1000));

    this.scheduleRefresh();
  }

  // Access tokens last an hour; they're renewed shortly before expiring.
  private scheduleRefresh(delay?: number): void {
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));

    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(
      () => this.refreshSession(),
      delay ?? Math.max(expiresAt - REFRESH_MARGIN - Date.now(), 0));
  }

  private refreshSession(): void {
    window.tidder.auth.refresh().then((result) => {
      if (!result)
        this.logout();
      else if ('error' in result)
        this.scheduleRefresh(REFRESH_RETRY_DELAY);
      else
        this.storeTokens(result);
    });
  }
}

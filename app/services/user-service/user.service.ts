import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders, HttpParams } from '@angular/common/http';

import { OAuthService } from 'angular-oauth2-oidc';

import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { generateStateString } from 'utils/utils';
import oauthConfig from 'config/authConfig.json';

// TODO: Create a proper events API

@Injectable()
export class UserService {
  private _userData: any;
  private logoutTimer: any;

  private updatingState = new BehaviorSubject<boolean>(false);
  public updatingState$ = this.updatingState.asObservable();

  private userLoggedIn  = new BehaviorSubject<boolean>(false);
  public  userLoggedIn$ = this.userLoggedIn.asObservable();

  constructor(private http: HttpClient, private oAuthService: OAuthService) { }

  setup(): void {
    this.oAuthService.loginUrl = oauthConfig.loginUrl;
    this.oAuthService.logoutUrl = oauthConfig.logoutUrl;
    this.oAuthService.redirectUri = oauthConfig.redirectUri;
    this.oAuthService.clientId = oauthConfig.clientId;
    this.oAuthService.scope = oauthConfig.scope.join(',');
    this.oAuthService.requireHttps = oauthConfig.requireHttps;

    this.oAuthService.oidc = oauthConfig.enableOidc;

    // Newer versions of angular-oauth2-oidc append the redirect URI to the
    // logout URL by default; Tidder's logout URL is just the app's root route.
    this.oAuthService.redirectUriAsPostLogoutRedirectUriFallback = false;
    this.oAuthService.setStorage(localStorage);

    if (this.isAuthenticated() && !this._userData)
      this.getIdentity();
  }

  getIdentity(): void {
    console.log("Getting User Identity...");

    this.updatingState.next(true);
    let options = { headers: this.getAuthenticatedHeaders() };
    let expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    let expireTime = (expiresAt - 300000) - Date.now();

    clearTimeout(this.logoutTimer);
    this.logoutTimer = setTimeout(this.logout.bind(this), expireTime);

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

  login(): void {
    let stateString = generateStateString(32);

    let loginUrl =
      `${oauthConfig.loginUrl}?` + `client_id=${oauthConfig.clientId}` +
      `&redirect_uri=${oauthConfig.redirectUri}` +
      `&scope=${oauthConfig.scope.join(',')}` +
      `&state=${stateString}` +
      `&response_type=token`;

    // The login window lives in the main process (see electron/main.js),
    // which hands back the hash fragment Reddit redirects to.
    window.tidder.login(loginUrl).then((hashFragment) => {
      if (!hashFragment) return;

      this.oAuthService.tryLogin({
        customHashFragment: hashFragment,
        disableOAuth2StateCheck: true,
        disableNonceCheck: true,
      }).then(this.getIdentity.bind(this));
    });
  }

  logout(): void {
    console.log("loggin out")

    this.updatingState.next(true);
    clearTimeout(this.logoutTimer);
    this.oAuthService.logOut();
    this._userData = null;
    this.userLoggedIn.next(false);
    this.updatingState.next(false);
  }

  isAuthenticated(): boolean {
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  getToken(): string {
    return this.oAuthService.getAccessToken();
  }

  getAuthenticatedHeaders(): HttpHeaders {
    let accessToken = this.oAuthService.getAccessToken();

    return this.isAuthenticated()
      ? new HttpHeaders({ 'Authorization': `Bearer ${accessToken}` })
      : new HttpHeaders({ });
  }

  get userData() {
    return this._userData || { };
  }
}

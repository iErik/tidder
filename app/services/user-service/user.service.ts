import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders, HttpParams } from '@angular/common/http';

import { OAuthService } from 'angular-oauth2-oidc';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { remote } from 'electron';

import { generateStateString } from 'utils/utils';
const oauthConfig = require('config/authConfig.json');

// TODO: Create a proper events API

@Injectable()
export class UserService {
  private _userData: any;

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

    setTimeout(this.logout.bind(this), expireTime);

    this.http.get(`${oauthConfig.authBaseURI}/api/v1/me.json`, options)
      .subscribe((res) => {
        this._userData = res;
        this.updatingState.next(false);
        this.userLoggedIn.next(false);
      });
  }

  login(): void {
    let stateString = generateStateString(32);
    let authWindow = new remote.BrowserWindow({
      width: 875,
      height: 600,
      webPreferences: { nodeIntegration: false }
    });

    authWindow.loadURL(
      `${oauthConfig.loginUrl}?` + `client_id=${oauthConfig.clientId}` +
      `&redirect_uri=${oauthConfig.redirectUri}` +
      `&scope=${oauthConfig.scope.join(',')}` +
      `&state=${stateString}` +
      `&response_type=token`
    )

    authWindow.on('ready-to-show', () => authWindow.show());

    authWindow.webContents.on('will-navigate', (ev, newUrl) => {
      let urlHash = newUrl.match(/^https?:\/\/localhost\/(.*)/);

      if (urlHash && urlHash.length > 1) {
        this.oAuthService.tryLogin({
          customHashFragment: urlHash[1],
          disableOAuth2StateCheck: true,
        }).then(this.getIdentity.bind(this));

        authWindow.destroy();
        authWindow = null;
      }
    });
  }

  logout(): void {
    console.log("loggin out")

    this.updatingState.next(true);
    this.oAuthService.logOut();
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

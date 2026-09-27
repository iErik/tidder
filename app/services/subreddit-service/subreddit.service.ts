import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders, HttpParams } from '@angular/common/http';

import { UserService } from 'services/user-service/user.service';

import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import * as _ from 'underscore';

import apiConfig from 'config/authConfig.json';

@Injectable()
export class SubredditService {

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) { }

  get apiRootURL(): string {
    return this.userService.isAuthenticated()
      ? apiConfig.authBaseURI
      : apiConfig.baseURI;
  }

  get reqOptions(): { headers:HttpHeaders, params:any } {
    let headers = this.userService.getAuthenticatedHeaders();
    let params = { raw_json: '1', api_type: 'json' }

    return { headers, params };
  }

  createSub(subData: any): Observable<any> {
    let reqOptions = { ...this.reqOptions, params: { ...subData, api_type: 'json' } };

    return this.http
      .post(`${this.apiRootURL}/api/site_admin`, { }, reqOptions)
      .pipe(catchError(this.handleError));
  }

  getSubInfo(srName: string): Observable<any> {
    return this.http
      .get(`${this.apiRootURL}/r/${srName}/about.json`, this.reqOptions)
      .pipe(map((res:any) => res.data), catchError(this.handleError));
  }

  getSubRules(srName: string): Observable<any> {
    return this.http
      .get(`${this.apiRootURL}/r/${srName}/about/rules.json`, this.reqOptions)
      .pipe(catchError(this.handleError));
  }

  getSubMods(srName: string): Observable<any> {
    return this.http
      .get(`${this.apiRootURL}/r/${srName}/about/moderators.json`, this.reqOptions)
      .pipe(map((res:any) => res.data), catchError(this.handleError));
  }

  getSubStyle(srName: string): Observable<any> {
    return this.http
      .get(`${apiConfig.baseURI}/r/${srName}/about/stylesheet.json`)
      .pipe(map(this.parseSubStyle), catchError(this.handleError));
  }

  setUserFlair(srName: string, flair_enabled: boolean): Observable<any> {
    let reqOptions = {
      ...this.reqOptions,
      params: { flair_enabled: String(flair_enabled), api_type: 'json' }
    };

    return this.http
      .post(`${this.apiRootURL}/r/${srName}/api/setflairenabled`, {}, reqOptions)
      .pipe(map((res:any) => res.json), catchError(this.handleError));
  }

  searchSubs(term:string, sort = 'relevance', after = '', limit = '15'): Observable<any> {
    let reqOptions = { ...this.reqOptions, params: { sort, after, limit } };

    return this.http
      .get(`${this.apiRootURL}/search.json?q=${term}&type=sr`, reqOptions)
      .pipe(map((res:any) => res.data), catchError(this.handleError));
  }

  searchSubNames(query: string, exact=false, include_over_18=true): Observable<any> {
    let reqOptions = {
      ...this.reqOptions,
      params: { query, exact: String(exact), include_over_18: String(include_over_18) }
    };

    // TODO: Please fix that
    let body = JSON.stringify({ });

    return this.http
      .post(`${this.apiRootURL}/api/search_reddit_names.json`, body, reqOptions)
      .pipe(map((res:any) => res.names), catchError(this.handleError));
  }

  getUserSubs(where = 'subscriber', after: string, limit = '25'): Observable<any> {
    let reqOptions = { ...this.reqOptions, params: { after, limit } };

    return this.http
      .get(`${this.apiRootURL}/subreddits/mine/${where}/.json`, reqOptions)
      .pipe(map(this.mapSubListing), catchError(this.handleError));
  }

  getSubs(where = 'popular', after: string, limit = '25'): Observable<any> {
    let reqOptions = { ...this.reqOptions, params: { after, limit } };

    return this.http
      .get(`${this.apiRootURL}/subreddits/${where}/.json`, reqOptions)
      .pipe(map(this.mapSubListing), catchError(this.handleError));
  }

  subscribeUser(sr: string, action: string): Observable<any> {
    let reqOptions = { ...this.reqOptions, params: { sr, action } };

    return this.http
      .post(`${this.apiRootURL}/api/subscribe`, {}, reqOptions)
      .pipe(catchError(this.handleError));
  }

  private parseSubStyle(res: any): string {
    var stylesheet = res.data.stylesheet;
    var images = res.data.images;

    let re = new RegExp("%{2}(?![()])([A-Za-z0-9_\-]+)%{2}", "g");

    return stylesheet.replace(re, (match, imgName) => {
      let imgUrl = '';

      images.forEach((image) => {
        if (image.name === imgName) imgUrl = image.url;
      });

      return imgUrl;
    });
  }

  private mapSubListing(res: any): string {
    return _.tap(res.data, (data) => {
      data.children = _.map(data.children, (sub) => sub.data);
    });
  }

  private handleError(error: HttpResponse<Error> | any): Observable<any> {
    let errMsg: string;

    if (error instanceof HttpResponse) {
      const body:any = error || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }

    console.error(errMsg);
    return throwError(() => error);
  }
}

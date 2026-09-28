import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders, HttpParams } from '@angular/common/http'

import { UserService } from 'services/user-service/user.service';

import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import apiConfig from 'config/authConfig.json';

@Injectable()
export class MultiredditService {
  private eventsSubject: Subject<any> = new Subject<any>();
  public events = this.eventsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private user: UserService
  ) { }

  // The app is only usable while logged in (Reddit blocks the public
  // .json endpoints), so every request goes through the OAuth API.
  get apiRootURL(): string {
    return apiConfig.authBaseURI;
  }

  get reqOptions(): { headers:HttpHeaders, params:any } {
    let headers = this.user.getAuthenticatedHeaders();
    let params = { raw_json: '1', api_type: 'json' }

    return { headers, params };
  }

  getMultiFeed(multiPath:string, sort='', after='', limit='15'): Observable<any> {
    let reqOptions = Object.assign({}, this.reqOptions);
    reqOptions.params = { after, limit };

    let userName = multiPath.match(/^\/user\/([\w\-]+)\/m\/\w+\/$/)[1];
    let multiName = multiPath.match(/^\/user\/[\w\-]+\/m\/(\w+)\/$/)[1];

    let feedURI = userName === this.user.userData.name
      ? `${this.apiRootURL}/me/m/${multiName}/${sort}/.json`
      : `${this.apiRootURL}/user/${userName}/m/${multiName}/${sort}/.json`;

    return this.http
      .get(feedURI, reqOptions)
      .pipe(map((res: any) => res.data), catchError(this.handleError));
  }

  searchMultiFeed(multiPath:string, q:string, sort = 'relevance', after='', limit='15'): Observable<any> {
    let params = { q, sort, after, limit, include_over_18: 'on', restrict_sr: 'on' };
    let userName = multiPath.match(/^\/user\/([\w\-]+)\/m\/\w+\/$/)[1];
    let multiName = multiPath.match(/^\/user\/[\w\-]+\/m\/(\w+)\/$/)[1];

    let feedURI = userName === this.user.userData.name
      ? `${this.apiRootURL}/me/m/${multiName}/search.json`
      : `${this.apiRootURL}/user/${userName}/m/${multiName}/search.json`;

    return this.http
      .get(feedURI, { ...this.reqOptions, params })
      .pipe(map((res: any) => res.data), catchError(this.handleError));
  }

  getUserMultis(expand_srs = false): Observable<any> {
    let params = { expand_srs: String(expand_srs) }

    return this.http
      .get(`${this.apiRootURL}/api/multi/mine`, { ...this.reqOptions, params })
      .pipe(catchError(this.handleError));
  }

  getMultiData(multiName:string, userName:string, expand_srs = false): Observable<any> {
    let reqOptions = { ...this.reqOptions, params: { expand_srs: String(expand_srs) } };

    return this.http
      .get(`${this.apiRootURL}/api/multi/user/${userName}/m/${multiName}`, reqOptions)
      .pipe(map((res: any) => res.data), catchError(this.handleError));
  }

  copyMulti(from:string, display_name:string): Observable<any> {
    let to = from.replace(/(m\/)(\w+)\/$/, `$1${display_name}/`);
    let reqOptions = { ...this.reqOptions, params:  { from, to, display_name } };

    return this.http
      .post(`${this.apiRootURL}/api/multi/copy`, { }, reqOptions)
      .pipe(map((res: any) => res.data), catchError(this.handleError));
  }

  createMulti(model): Observable<any> {
    let reqOptions = { ...this.reqOptions, params: { model } };

    return this.http
      .post(`${this.apiRootURL}/api/multi`, { }, reqOptions)
  }

  updateMulti(multipath:string, model): Observable<any> {
    let reqOptions = { ...this.reqOptions, params: { model } };

    return this.http
      .put(`${this.apiRootURL}/api/multi/${multipath}`, { }, reqOptions)
      .pipe(catchError(this.handleError));
  }

  deleteMulti(multipath:string): Observable<any> {
    return this.http
      .delete(`${this.apiRootURL}/api/multi${multipath}`, this.reqOptions)
      .pipe(catchError(this.handleError));
  }

  renameMulti(from:string, display_name:string): Observable<any> {
    let to = from.replace(/(m\/)(\w+)\/$/, `$1${display_name}/`);
    let reqOptions = { ...this.reqOptions, params:  { from, to, display_name } };

    return this.http
      .post(`${this.apiRootURL}/api/multi/rename`, { }, reqOptions)
      .pipe(map((res: any) => res.data), catchError(this.handleError))
  }

  removeFromMulti(multipath:string, srname:string): Observable<any> {
    return this.http
      .delete(`${this.apiRootURL}/api/multi/${multipath}/r/${srname}`, this.reqOptions)
      .pipe(catchError(this.handleError));
  }

  addToMulti(multipath, model): Observable<any> {
    return this.http
      .put(`${this.apiRootURL}/api/multi/${multipath}/r/${model.name}`, {})
      .pipe(catchError(this.handleError));
  }

  updateDescription(multipath, body_md: string): Observable<any> {
    let model = JSON.stringify({ body_md })
    let reqOptions = { ...this.reqOptions, params: { model } };

    return this.http
      .put(`${this.apiRootURL}/api/multi${multipath}description`, { }, reqOptions)
      .pipe(map((res: any) => res.data), catchError(this.handleError));
  }

  emitAddedMulti(multi: any) {
    this.eventsSubject.next({ type: 'addedMulti', data: multi });
  }

  emitRemovedMulti(multi: any) {
    this.eventsSubject.next({ type: 'removedMulti', data: multi });
  }

  emitChangedMulti(from: any, to: any) {
    this.eventsSubject.next({ type: 'changedMulti', data: { from, to } });
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
    return throwError(() => errMsg);
  }
}

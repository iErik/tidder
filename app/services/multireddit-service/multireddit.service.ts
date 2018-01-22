import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders, HttpParams } from '@angular/common/http'

import { UserService } from 'services/user-service/user.service';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

const apiConfig = require('config/authConfig.json');

@Injectable()
export class MultiredditService {
  private eventsSubject: Subject<any> = new Subject<any>();
  public events = this.eventsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private user: UserService
  ) { }

  get apiRootURL(): string {
    return this.user.isAuthenticated()
      ? apiConfig.authBaseURI
      : apiConfig.baseURI;
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
      .map((res: any) => res.data)
      .catch(this.handleError);
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
      .map((res: any) => res.data)
      .catch(this.handleError);
  }

  getUserMultis(expand_srs = false): Observable<any> {
    let params = { expand_srs: String(expand_srs) }

    return this.http
      .get(`${this.apiRootURL}/api/multi/mine`, { ...this.reqOptions, params })
      .catch(this.handleError);
  }

  getMultiData(multiName:string, userName:string, expand_srs = false): Observable<any> {
    let reqOptions = { ...this.reqOptions, params: { expand_srs: String(expand_srs) } };

    return this.http
      .get(`${this.apiRootURL}/api/multi/user/${userName}/m/${multiName}`, reqOptions)
      .map((res: any) => res.data)
      .catch(this.handleError);
  }

  copyMulti(from:string, display_name:string): Observable<any> {
    let to = from.replace(/(m\/)(\w+)\/$/, `$1${display_name}/`);
    let reqOptions = { ...this.reqOptions, params:  { from, to, display_name } };

    return this.http
      .post(`${this.apiRootURL}/api/multi/copy`, { }, reqOptions)
      .map((res: any) => res.data)
      .catch(this.handleError);
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
      .catch(this.handleError);
  }

  deleteMulti(multipath:string): Observable<any> {
    return this.http
      .delete(`${this.apiRootURL}/api/multi${multipath}`, this.reqOptions)
      .catch(this.handleError);
  }

  renameMulti(from:string, display_name:string): Observable<any> {
    let to = from.replace(/(m\/)(\w+)\/$/, `$1${display_name}/`);
    let reqOptions = { ...this.reqOptions, params:  { from, to, display_name } };

    return this.http
      .post(`${this.apiRootURL}/api/multi/rename`, { }, reqOptions)
      .map((res: any) => res.data)
      .catch(this.handleError)
  }

  removeFromMulti(multipath:string, srname:string): Observable<any> {
    return this.http
      .delete(`${this.apiRootURL}/api/multi/${multipath}/r/${srname}`, this.reqOptions)
      .catch(this.handleError);
  }

  addToMulti(multipath, model): Observable<any> {
    return this.http
      .put(`${this.apiRootURL}/api/multi/${multipath}/r/${model.name}`, {})
      .catch(this.handleError);
  }

  updateDescription(multipath, body_md: string): Observable<any> {
    let model = JSON.stringify({ body_md })
    let reqOptions = { ...this.reqOptions, params: { model } };

    return this.http
      .put(`${this.apiRootURL}/api/multi${multipath}description`, { }, reqOptions)
      .map((res: any) => res.data)
      .catch(this.handleError);
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
    return Observable.throw(errMsg);
  }
}

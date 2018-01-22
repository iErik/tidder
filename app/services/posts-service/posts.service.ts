import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders, HttpParams } from '@angular/common/http';

import { UserService } from 'services/user-service/user.service';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { each, where, findWhere, findIndex, filter } from 'underscore';

const apiConfig = require('config/authConfig.json');

@Injectable()
export class PostsService {

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

  // TODO: the raw_json option should be present in every methods that
  // returns a list of posts.
  getPosts(sort = 'hot', sr = '', after = '', limit = '15'): Observable<any> {
    let params =  { ...this.reqOptions.params, after, limit };

    let postsUri = sr
      ? `${this.apiRootURL}/r/${sr}/${sort}/.json`
      : `${this.apiRootURL}/${sort}/.json`;

    return this.http
      .get(postsUri, { ...this.reqOptions, params })
      .map((res:any) => res.data)
      .catch(this.handleError)
  }

  getSavedPosts(sort='hot', after='', limit='15', type='link'): Observable<any> {
    let params = { ...this.reqOptions.params, after, limit, type };
    let userName = this.userService.userData.name;

    return this.http
      .get(`${this.apiRootURL}/user/${userName}/saved`, { ...this.reqOptions, params })
      .map((res:any) => res.data)
      .catch(this.handleError);
  }

  //  TODO: Rename to searchPosts
  search(term: string, sort = 'relevance', sr = '', after = '', limit = '15'): Observable<any> {
    let params = { ...this.reqOptions.params, sort, after, limit };

    let postsUri = sr
      ? `${this.apiRootURL}/r/${sr}/search.json?q=${term}&restrict_sr=on`
      : `${this.apiRootURL}/search.json?q=${term}`;

    return this.http
      .get(postsUri, { ...this.reqOptions, params })
      .map((res:any) => res.data)
      .catch(this.handleError);
  }

  // TODO: Make sure the sorting mode works
  getPostComments(sr: string, postId: string, options = {}): Observable<any> {
    let params = { ...this.reqOptions.params, ...options };

    return this.http
      .get(`${this.apiRootURL}/r/${sr}/comments/${postId}/.json`, { ...this.reqOptions, params })
      .map(res => ({ post: res[0].data.children[0].data, comments: res[1].data.children }))
      .catch(this.handleError)
  }

  getMoreComments(postId:string, children:string[], sort:string, limit_children = false): Observable<any> {
    let params =
      { ...this.reqOptions.params
      , sort
      , link_id: postId
      , children: children.join(',')
      , limit_children: String(limit_children)
      }

    return this.http
      .get(`${this.apiRootURL}/api/morechildren.json`, { ...this.reqOptions, params })
      .map(this.unflattenPostComments)
      .catch(this.handleError);
  }

  submitPost(post): Observable<any> {
    let params = { ...this.reqOptions.params, ...post };

    return this.http
      .post(`${this.apiRootURL}/api/submit`, { }, { ...this.reqOptions, params })
      .map((res:any) => res.json)
      .catch(this.handleError);
  }

  submitComment(comment): Observable<any> {
    let params = { ...this.reqOptions.params, ...comment };

    return this.http
      .post(`${this.apiRootURL}/api/comment`, { }, { ...this.reqOptions, params })
      .map((res:any) => res.json)
      .catch(this.handleError);
  }

  saveThing(id: string): Observable<any> {
    let params = { ...this.reqOptions.params, id };

    return this.http
      .post(`${this.apiRootURL}/api/save`, {}, { ...this.reqOptions, params })
      .map((res:any) => res.json)
      .catch(this.handleError);
  }

  unsaveThing(id: string): Observable<any> {
    let params = { ...this.reqOptions.params, id };

    return this.http
      .post(`${this.apiRootURL}/api/unsave/`, {}, { ...this.reqOptions, params })
      .map((res:any) => res.json)
      .catch(this.handleError);
  }

  vote(id: string, dir: number): Observable<any> {
    let params = { ...this.reqOptions.params, id, dir: dir + '' };

    return this.http
      .post(`${this.apiRootURL}/api/vote`, {}, { ...this.reqOptions, params })
      .map((res:any) => res.json)
      .catch(this.handleError);
  }

  reportThing(thing_id: string, reason: object): Observable<any> {
    let params = { ...this.reqOptions.params, ...reason, thing_id };

    return this.http
      .post(`${this.apiRootURL}/api/report`, {}, { ...this.reqOptions, params })
      .map((res:any) => res.json)
      .catch(this.handleError);
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

  private unflattenPostComments(res: any): any {
    console.log("moreChildren: ", res.json);
    var resData = res.json;

    var mapReplies = (comment, i, comments) => {
      if (i >= comments.length) return;
      let children = filter(comments, (c) => c.data.parent_id === comment.data.name);

      each(children, (child) => {
        if (comment.kind !== 'more')
          mapReplies(child, findIndex(comments, child), comments);

        comment.data.replies.data
          ? comments[i].data.replies.data.children.push(child)
          : comments[i].data.replies = { data: { children: [child] } }

        comments.splice(findIndex(comments, child), 1);
      });
    }

    return {
      comments: where(each(resData.data.things, mapReplies), { kind: 't1' }),
      moreChildren: findWhere(resData.data.things, { kind: 'more' }) || {}
    }
  }
}

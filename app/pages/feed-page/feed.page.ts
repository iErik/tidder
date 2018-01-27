import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

import { FeedService } from 'services/feed-service/feed.service';
import { UserService } from 'services/user-service/user.service';

import { ISubscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/skip';

import { isEmpty } from 'underscore';
import { togglePageScroll } from 'utils/utils';

@Component({
  templateUrl: './feed.page.html',
  providers: [ FeedService ]
})

export class FeedPage implements OnInit, OnDestroy {
  public currentPost: any;
  private routerSubscription: ISubscription;

  // We could perhaps create a separate service for FeedActions
  public showOverlay: boolean = false;
  public overlayData
    : { type: string, thing: any }
    = { type: '', thing: { } };

  constructor(
    private feedService: FeedService,
    private user: UserService,

    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.routerSubscription = this.router.events
      .skip(1)
      .filter(ev => ev instanceof NavigationEnd)
      .subscribe((ev: NavigationEnd) => this.changeSource());

    this.changeSource();
  }

  changeSource(): void {
    let route = this.route.snapshot;

    if (route.params['subredditName']) {
      this.feedSource = `r/${route.params['subredditName']}`
    } else if (route.params['multiName']) {
      let multiName = route.params['multiName'];
      let userName = route.params['userName'];

      this.feedSource = `/user/${userName}/m/${multiName}/`;
      this.searchQuery = ''
    } else if (route.url[0] && route.url[0].path === 'saved') {
      this.feedSource = 'saved';
      this.searchQuery = '';
    } else {
      this.feedSource = this.user.isAuthenticated() ? 'home' : 'r/all';
      this.searchQuery = '';
    }
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
  }

  changeCurrentPost(post: any): void {
    this.currentPost = post;
  }

  handleFeedAction(action: any): void {
    switch (action.type) {
      case 'open':
        this.changeCurrentPost(action.thing);
        break;
      default:
        this.openOverlay(action);
    }
  }

  openOverlay(overlayData): void {
    togglePageScroll(false);
    this.showOverlay = true;
    this.overlayData = overlayData;
  }

  closeOverlay(): void {
    togglePageScroll(true);
    this.showOverlay = false;
    this.overlayData = { type: '', thing: {} };
  }

  hasPost(): boolean {
    return !isEmpty(this.currentPost);
  }

  get sortMode() { return this.feedService.sortMode; }
  set sortMode(sort: string) { this.feedService.sortMode = sort; }

  get feedSource() { return this.feedService.feedSource; }
  set feedSource(source: string) { this.feedService.feedSource = source; }

  get searchQuery() { return this.feedService.searchQuery; }
  set searchQuery(query: string) { this.feedService.searchQuery = query; }
}

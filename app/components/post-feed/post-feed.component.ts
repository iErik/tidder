import {
  Component,
  OnInit,
  OnDestroy,
  DoCheck,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';

import { where, map, isEmpty } from 'underscore';

import { Observable } from 'rxjs/Observable';
import { ISubscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/distinctUntilChanged';

import { MultiredditService } from 'services/multireddit-service/multireddit.service';
import { SubredditService } from 'services/subreddit-service/subreddit.service';
import { PostsService } from 'services/posts-service/posts.service';
import { FeedService }  from 'services/feed-service/feed.service';

import { togglePageScroll } from 'utils/utils';

@Component({
  selector: 'post-feed',
  templateUrl: './post-feed.component.html',
  styleUrls: [ './post-feed.component.scss' ],
  //changeDetection: ChangeDetectionStrategy.OnPush
})

export class PostFeedComponent implements OnInit, OnDestroy {
  @Input() currentPost: any;

  private searchSubscription: ISubscription;
  private feedSubscription: ISubscription;

  public postFeed: object[] = [];
  public subFeed: object[] = [];
  public overlayPost: object;
  public lastPost: string = '';

  public isLoadingPosts = false;
  public reloadingPosts = true;

  public showOverlay: boolean = false;
  public overlayData
    : { type: string, thing: object }
    = { type: '', thing: {} };

  @Output() onFeedAction = new EventEmitter<any>();

  constructor(
    private multiService: MultiredditService,
    private subService: SubredditService,
    private postsService: PostsService,
    private feedService: FeedService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cdr.detach();
    this.searchSubscription = this.feedService.searchQuery$
      .combineLatest(this.feedService.sortMode$)
      .distinctUntilChanged()
      .debounceTime(300)
      .combineLatest(this.feedService.feedSource$)
      .subscribe((filters) => {
        console.log("filters: ", filters);
        this.reloadingPosts = true;
        this.cdr.detectChanges();

        return filters[0][0].trim() ? this.search(true) : this.fetchPosts(true);
      });
  }

  ngOnDestroy() {
    this.searchSubscription.unsubscribe();
  }

  fetchPosts(overrideFeed = false): void {
    this.lastPost = overrideFeed ? '' : this.lastPost;
    this.isLoadingPosts = overrideFeed ? false : true;
    this.reloadingPosts = overrideFeed ? true : false;

    var sort = this.feedService.sortMode;
    var src = this.feedService.feedSource;

    switch(true) {
      case src.startsWith('r/'):
        this.postsService
          .getPosts(sort, src.replace('r/', ''), this.lastPost)
          .subscribe(this.handleFeedData.bind(this, overrideFeed));
        break;

      case /^\/user\/[\w\-]+\/m\/\w+\/$/.test(src):
        this.multiService
          .getMultiFeed(src, sort, this.lastPost)
          .subscribe(this.handleFeedData.bind(this, overrideFeed));
        break;

      case src === 'home':
        this.postsService
          .getPosts(sort, '', this.lastPost)
          .subscribe(this.handleFeedData.bind(this, overrideFeed));
        break;

      case src === 'saved':
        this.postsService
          .getSavedPosts(sort, this.lastPost)
          .subscribe(this.handleFeedData.bind(this, overrideFeed));
        break;
    }
  }

  search(overrideFeed = false): void {
    if (this.feedService.feedSource.startsWith('sr:'))
      this.searchSubreddits(overrideFeed);
    else
      this.searchPosts(overrideFeed);
  }

  searchPosts(overrideFeed = false): void {
    this.lastPost = overrideFeed ? '' : this.lastPost;
    this.isLoadingPosts = true;

    var searchQuery = this.feedService.searchQuery;
    var sort = this.feedService.sortMode;
    var src = this.feedService.feedSource;

    if (src.startsWith('r/')) {
      this.postsService
        .search(searchQuery, sort, src.replace('r/', ''), this.lastPost)
        .subscribe(this.handleFeedData.bind(this, overrideFeed));
    } else if (/^\/user\/[\w\-]+\/m\/\w+\/$/.test(src)) {
      this.multiService
        .searchMultiFeed(src, searchQuery, sort, this.lastPost)
        .subscribe(this.handleFeedData.bind(this, overrideFeed));
    } else {
      this.postsService
        .search(searchQuery, sort, '', this.lastPost)
        .subscribe(this.handleFeedData.bind(this, overrideFeed));
    }
  }

  searchSubreddits(overrideFeed = false): void {
    this.lastPost = overrideFeed ? '' : this.lastPost;
    this.isLoadingPosts = true;

    let searchQuery = this.feedService.searchQuery;
    let sort = this.feedService.sortMode;

    this.subService
      .searchSubs(searchQuery, sort, this.lastPost)
      .subscribe(this.handleFeedData.bind(this, overrideFeed));
  }

  handleFeedData(override: boolean, data: any): void {
    let source = this.feedService.feedSource;
    let dataFeed = source.startsWith('sr:') ? 'subFeed' : 'postFeed';
    this[dataFeed === 'postFeed' ? 'subFeed' : 'postFeed'] = [];

    this.lastPost = data.after;
    this[dataFeed] = override
      ? where(data.children, { kind: 't3' })
      : this[dataFeed].concat(where(data.children, { kind: 't3' }));

    this.reloadingPosts = false
    this.isLoadingPosts = false
    this.cdr.detectChanges();

    console.log("PostFeed.data: ", data);
  }

  onScroll(ev): void {
    console.log("PostFeed.onScroll: ", this.lastPost);

    if (this.lastPost === null)
      return
    else if (this.feedService.searchQuery.trim())
      this.search();
    else
      this.fetchPosts();
  }
}

import { Component, Output, EventEmitter } from '@angular/core';

import { FeedService } from 'services/feed-service/feed.service';

@Component({
  selector: 'post-feed-filters',
  templateUrl: './post-feed-filters.component.html',
  styleUrls: [ './post-feed-filters.component.scss' ]
})

export class PostFeedFiltersComponent {
  @Output() onFeedAction = new EventEmitter<any>();

  constructor( private feedService: FeedService ) { }

  emitFeedAction(type: string): void {
    this.onFeedAction.emit({ type, thing: {} });
  }

  get sortMode() {
    return this.feedService.sortMode;
  }

  set sortMode(sort: string) {
    this.feedService.sortMode = sort
  }

  get feedSource() {
    return this.feedService.feedSource;
  }

  set feedSource(source: string) {
    this.feedService.feedSource = source;
  }

  get searchQuery() {
    return this.feedService.searchQuery;
  }

  set searchQuery(query: string) {
    this.feedService.searchQuery = query;
  }

  updateSortMode(sortMode: string) {
    this.sortMode = sortMode;
  }
}

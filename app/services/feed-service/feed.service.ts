import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

//  This component will serve as  a 'BUS device' between Page
// components  and the PostFeed component.

@Injectable()
export class FeedService {
  private displaySubSource = new BehaviorSubject<boolean>(true);
  private searchQuerySource = new BehaviorSubject<string>('');
  private feedSourceSource = new BehaviorSubject<string>('');
  private sortModeSource = new BehaviorSubject<string>('hot');

  public displaySubSource$ = this.displaySubSource.asObservable();
  public searchQuery$ = this.searchQuerySource.asObservable();
  public feedSource$ = this.feedSourceSource.asObservable();
  public sortMode$ = this.sortModeSource.asObservable();

  get displaySub() {
    return this.displaySubSource.getValue();
  }

  set displaySub(value: boolean) {
    this.displaySubSource.next(value);
  }

  get searchQuery() {
    return this.searchQuerySource.getValue();
  }

  set searchQuery(query: string) {
    let previousValue = this.searchQuery;
    this.searchQuerySource.next(query);

    if (query.trim() && !previousValue.trim()) {
      this.sortMode = 'relevance';
    } else if (!query.trim() && !this.searchQuery.trim() && this.sortMode !== 'hot') {
      this.sortMode = 'hot'
    }
  }

  get feedSource() {
    return this.feedSourceSource.getValue();
  }

  set feedSource(source: string) {
    this.feedSourceSource.next(source);
  }

  get sortMode() {
    return this.sortModeSource.getValue();
  }

  set sortMode(sort: string) {
    this.sortModeSource.next(sort);
  }
}

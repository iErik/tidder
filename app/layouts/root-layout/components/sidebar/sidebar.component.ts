import {
  Component,
  OnChanges,
  DoCheck,
  Input,
  OnInit,
  OnDestroy
} from '@angular/core';

import { MultiredditService } from 'services/multireddit-service/multireddit.service';
import { SubredditService } from 'services/subreddit-service/subreddit.service';
import { UserService } from 'services/user-service/user.service';

import { ISubscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { map, sortBy, reject, findIndex, isEmpty } from 'underscore';

@Component({
  selector: 'app-sidebar',
  templateUrl: 'sidebar.component.html',
  styleUrls: [ 'sidebar.component.scss' ]
})

export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isActive: boolean = false;

  private multiEventsSubscription: ISubscription;
  public multiredditList: Array<any> = [];
  public loadingMultiList: boolean = false;

  public subredditList: Array<any> = [];
  private lastSubItem: string = '';
  public loadingSubList: boolean = false;

  constructor(
    private multiService: MultiredditService,
    private subService: SubredditService,
    public user: UserService
  ) { }

  ngOnInit() {
    this.fetchMultiList();
    this.fetchSubList();

    this.multiEventsSubscription = this.multiService.events.subscribe((ev) => {
      switch(ev.type) {
        case 'addedMulti':
          this.onAddedMulti(ev.data);
          break;
        case 'removedMulti':
          this.onRemovedMulti(ev.data);
          break;
        case 'changedMulti':
          this.onChangedMulti(ev.data);
          break;
        }
      });
  }

  ngOnDestroy() {
    this.multiEventsSubscription.unsubscribe();
  }

  fetchMultiList(): void {
    if (this.user.isAuthenticated()) {
      console.log("fetching user multis...")
      this.loadingMultiList = true;
      this.multiService.getUserMultis()
        .subscribe(this.handleMultiData.bind(this));
    }
  }

  fetchSubList(overrideSubList = false): void {
    // We've reached the end of the listing
    if (this.lastSubItem === null) return;

    this.loadingSubList = true;
    this.lastSubItem = overrideSubList ? '' : this.lastSubItem;

    if (this.user.isAuthenticated()) {
      this.subService.getUserSubs('subscriber', this.lastSubItem)
        .subscribe(this.handleSubData.bind(this, overrideSubList));
    } else {
      this.subService.getSubs('popular', this.lastSubItem)
        .subscribe(this.handleSubData.bind(this, overrideSubList));
    }
  }

  handleMultiData(data): void {
    this.multiredditList = map(data, m => m.data);
    this.loadingMultiList = false;
  }

  handleSubData(override: boolean, data: any): void {
    this.lastSubItem = data.after;
    this.subredditList = override
      ? data.children
      : this.subredditList.concat(data.children);
    this.loadingSubList = false;
  }

  onAddedMulti(multi): void {
    this.multiredditList = sortBy([...this.multiredditList, multi], 'name');
  }

  onRemovedMulti({ path }): void {
    this.multiredditList = sortBy(reject(this.multiredditList, { path }), 'name');
  }

  onChangedMulti({ from, to }): void {
    let changedMulti = findIndex(this.multiredditList, { path: from.path });
    this.multiredditList[changedMulti] = to;
  }
}

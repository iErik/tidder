import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { SubredditService } from 'services/subreddit-service/subreddit.service';

import { abbreviate } from 'utils/utils';

var moment = require('moment');

@Component({
  selector: 'sub-info-feed-card',
  templateUrl: './sub-info-feed-card.component.html',
  styleUrls: [ './sub-info-feed-card.component.scss' ]
})

export class SubInfoFeedCardComponent {
  @Input() subInfo;

  constructor(
    private sanitizer: DomSanitizer,
    private subService: SubredditService
  ) { }

  get publicDescription() {
    var txt = document.createElement('textarea');
    txt.innerHTML = this.subInfo.public_description_html;

    return this.sanitizer.bypassSecurityTrustHtml(txt.value);
  }

  get subscriberCount() {
    return this.subInfo.subscribers.toLocaleString();
  }

  get relativeCreationDate() {
    return moment(this.subInfo.created_utc * 1000).fromNow(true);
  }

  subscribeUser(): void {
    let sr = this.subInfo.name;
    let initialState = this.subInfo.user_is_subscriber;
    let action = this.subInfo.user_is_subscriber ? 'unsub' : 'sub';
    this.subInfo.user_is_subscriber = action === 'sub' ? true : false;

    this.subService.subscribeUser(sr, action).subscribe(() => {}, (err) => {
      this.subInfo.user_is_subscriber = initialState;
    });
  }
}

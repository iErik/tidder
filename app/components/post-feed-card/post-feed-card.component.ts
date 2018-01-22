import {
  Component,
  Input, Output,
  EventEmitter,
  ChangeDetectorRef
} from '@angular/core';


import { PostsService } from 'services/posts-service/posts.service';

import { abbreviate, numToBoolean, capitalizeFirstLetter } from 'utils/utils';
import { isEmpty } from 'underscore';

var moment = require('moment');

@Component({
  selector: 'post-feed-card',
  templateUrl: './post-feed-card.component.html',
  styleUrls: [ './post-feed-card.component.scss' ]
})

export class PostFeedCardComponent {
  @Input() post;
  @Input() displaySubreddit: boolean = true;

  @Output() onFeedAction = new EventEmitter<object>();

  constructor(
    private postsService: PostsService,
    private cdr: ChangeDetectorRef
  ) { }

  get voteCount() {
    return abbreviate(this.post.score, 1, 1);
  }

  getPostThumbnail(): string {
    return this.post.preview
      ? this.post.preview.images[0].source.url
      : this.post.thumbnail;
  }

  canBePreviewed(): boolean {
    if (this.post.is_self && this.post.selftext_html)
      return true;
    else if (this.post.media !== null)
      return true;
    else if (this.post.preview && !isEmpty(this.post.preview.images[0].variants))
      return true;
    else if (this.post.post_hint && this.post.post_hint !== 'link')
      return true;
    else
      return false;
  }

  hasThumbnail(): boolean {
    return this.post.thumbnail.startsWith('http');
  }

  hasExternalLink(): boolean {
    return this.post.domain.indexOf('i.redd.it') >= 0 || this.post.is_self
      ? false
      : true;
  }

  votePost(dir: number): void {
    let previousState = this.post.likes;
    this.post.likes = dir === 0 ? null : numToBoolean(dir);
    this.cdr.detectChanges();

    this.postsService.vote(this.post.name, dir).subscribe(
      (res) => { if (res && res.errors) this.revertChanges('likes', previousState) },
      this.revertChanges.bind(this, 'likes', previousState));
  }

  savePost(save:boolean = true): void {
    let previousState = this.post.saved;
    let saveAction = save ? 'saveThing' : 'unsaveThing';
    this.post.saved = save;
    this.cdr.detectChanges();

    this.postsService[saveAction](this.post.name).subscribe(
      (res) => { if (res && res.errors) this.revertChanges('saved', previousState) },
      this.revertChanges.bind(this, 'saved', previousState));
  }

  emitFeedAction(type: string, ev): void {
    ev.preventDefault();
    this.onFeedAction.emit({ type, thing: this.post });
  }

  revertChanges(property: string, originalState: any) {
    this.post[property] = originalState;
    this.cdr.detectChanges();
  }
}

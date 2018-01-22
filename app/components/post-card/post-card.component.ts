import {
  Component,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef
} from '@angular/core';

import { DomSanitizer } from '@angular/platform-browser';

import { PostsService } from 'services/posts-service/posts.service';
import { UserService } from 'services/user-service/user.service';

import { isEmpty } from 'underscore';
import { abbreviate, numToBoolean } from 'utils/utils';

const remote = require('electron').remote
const moment = require('moment');

@Component({
  selector: 'post-card',
  templateUrl: './post-card.component.html',
  styleUrls: [ './post-card.component.scss' ],
})

export class PostCardComponent implements OnChanges {
  @Input()  post: any;
  @Output() onFeedAction = new EventEmitter<object>();

  constructor(
    private user: UserService,
    private sanitizer: DomSanitizer,
    private postsService: PostsService,
    private cdr: ChangeDetectorRef
  ) { this.cdr.detach(); }

  ngOnChanges(changes) {
    if (changes['post'] && !isEmpty(changes['post'])) {
      this.cdr.reattach();
      setTimeout(() => this.cdr.detach());
    }
  }

  get postScore() {
    return abbreviate(this.post.score, 1, 1);
  }

  get selfText() {
    var txt = document.createElement('textarea');
    txt.innerHTML = this.post.selftext_html;
    return txt.value;
  }

  get postMedia() {
    var txt = document.createElement('textarea');
    txt.innerHTML = this.post.secure_media_embed.content;

    return this.sanitizer.bypassSecurityTrustHtml(txt.value);
  }

  // NOTE: This does not work with subreddits that disable previews
  get postImage() {
    return this.post.preview.images[0].variants.gif
      ? this.post.preview.images[0].variants.gif.source.url
      : this.post.preview.images[0].source.url;
  }

  get videoSource() {
    if (this.post.is_video)
      return this.post.media.reddit_video.fallback_url;
    else if (this.post.preview && this.post.preview.images[0].variants['mp4'])
      return this.post.preview.images[0].variants['mp4']['source']['url'];
  }

  isImage(): boolean {
    if (this.post.media || this.post.is_self)
      return false;
    else
      return this.post.preview && !this.post.preview.images[0].variants['mp4'];
  }

  isVideo(): boolean {
    if ((this.post.media && !this.post.media['reddit_video']) || this.post.is_self)
      return false
    else
      return this.post.is_video
        || ( this.post.preview && this.post.preview.images[0].variants['mp4']);
  }

  isEmbbeded(): boolean {
    return (this.post.media !== null) && (this.post.is_video === false)
  }

  hasContent(): boolean {
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

  revertChanges(property: string, originalState: any) {
    this.post[property] = originalState;
    this.cdr.detectChanges();
  }

  openExternalLink(ev, isContentLink: boolean = false): void {
    ev.preventDefault();
    ev.stopPropagation();

    if (isContentLink && ev.target.tagName.toLowerCase() === 'a')
      remote.shell.openExternal(ev.target.href);
    else
      remote.shell.openExternal(this.post.url);
  }

  emitFeedAction(type: string): void {
    this.onFeedAction.emit({ type, thing: this.post });
  }
}

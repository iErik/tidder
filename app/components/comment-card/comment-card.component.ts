import {
  Component,
  OnInit,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';


import { UserService } from 'services/user-service/user.service';
import { PostsService } from 'services/posts-service/posts.service';

import { abbreviate, numToBoolean } from 'utils/utils';

const remote = require('electron').remote;
const moment = require('moment');

@Component({
  selector: 'comment-card',
  templateUrl: './comment-card.component.html',
  styleUrls: [ './comment-card.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentCardComponent implements OnChanges {
  @Input() comment;
  @Input() isParent:boolean;

  @Output() onCommentAction = new EventEmitter<object>();

  public isCollapsed:boolean = false;
  public showReplyEditor:boolean = false;

  // Default displayLimit must be relative to the comment depth.
  public childDisplayLimit:number = 0;

  constructor(
    public user: UserService,
    private postsService: PostsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnChanges(changes) {
    let comment = changes['comment'];

    if (comment && comment.firstChange) {
      if (comment.currentValue.depth === 0)
        this.childDisplayLimit = 4;
      else if (comment.currentValue.depth === 1)
        this.childDisplayLimit = 2;
      else
        this.childDisplayLimit = -1;

      this.cdr.detectChanges();
    }
  }

  get commentScore() {
    return abbreviate(this.comment.score, 1, 1);
  }

  get replies() {
    return this.comment.replies ? this.comment.replies.data.children : [];
  }

  hasMoreReplies(): boolean {
    return (this.replies.length > 0)
      && (this.childDisplayLimit < this.replies.length);
  }

  loadMoreReplies() {
    this.childDisplayLimit += 3;
    this.cdr.detectChanges();
  }

  voteComment(dir): void {
    let previousState = this.comment.likes;
    this.comment.likes = dir === 0 ? null : numToBoolean(dir);

    this.postsService.vote(this.comment.name, dir)
      .subscribe(() => {}, (err) => this.comment.likes = previousState);
  }

  saveComment(isSaved:boolean = true): void {
    let previousState = this.comment.saved;
    let saveAction = isSaved ? 'saveThing' : 'unsaveThing';
    this.comment.saved = isSaved;

    this.postsService[saveAction](this.comment.name)
    .subscribe(() => {}, (err) => this.comment.saved = previousState);
  }

  reportComment(): void {
    this.onCommentAction.emit({ action: 'report', thing: this.comment });
  }

  collapseComment(ev): void {
    ev.preventDefault();
    this.isCollapsed = !this.isCollapsed;

    this.cdr.detectChanges();
  }

  toggleReplyEditor(ev?): void {
    ev ? ev.preventDefault() : undefined;
    this.showReplyEditor = !this.showReplyEditor;
  }

  // TODO: Refactor that
  addChild(childComment): void {
    if (typeof this.comment.replies === 'string')
      this.comment.replies = { data: { children: [] } };

    this.comment.replies.data.children.unshift(childComment);
    this.showReplyEditor = false;
  }

  openExternalLink(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    if (ev.target.tagName.toLowerCase() === 'a')
      remote.shell.openExternal(ev.target.href);
  }

  trackByFn(index, item): string {
    return item.data.name || index;
  }
}

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

import { PostsService } from 'services/posts-service/posts.service';
import { UserService } from 'services/user-service/user.service';

import { findWhere, where, isEmpty } from 'underscore';

@Component({
  selector: 'comment-feed',
  templateUrl: './comment-feed.component.html',
  styleUrls: [ './comment-feed.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentFeedComponent implements OnChanges {
  @Input() post: any;
  @Output() onCommentAction = new EventEmitter<object>();

  public comments: Array<object> = [];
  public sortMode: string = 'confidence';
  public nextComments: any;

  public loadingComments: boolean = true;
  public displayLimit: number = 10;

  constructor(
    private postsService: PostsService,
    public user: UserService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnChanges(changes) {
    if (changes['post'] && !isEmpty(changes['post']))
      this.fetchComments();
  }

  fetchComments(): void {
    this.loadingComments = true;
    let subName = this.post.subreddit;
    let postId = this.post.id;
    let options =
      { sr_detail: false
      , showmore: true
      , depth: 20
      , context: 8
      , sort: this.sortMode
      };

    this.postsService.getPostComments(subName, postId, options)
      .subscribe(({ post, comments }) => {
        this.comments = where(comments, { kind: 't1' });
        this.nextComments = findWhere(comments, { kind: 'more' }) || { };
        this.loadingComments = false;

        this.cdr.detectChanges();
      });
  }

  loadMore(): void {
    if (this.displayLimit >= this.comments.length) {
      this.postsService
        .getMoreComments(this.post.name, this.nextComments.data.children, this.sortMode)
        .subscribe(({ comments, moreChildren }) => {
          this.post.push(...comments);
          this.nextComments = moreChildren;
          this.cdr.detectChanges();
        });
    } else {
      this.displayLimit += 10;
    }
  }

  hasMoreComments(): boolean {
    return !isEmpty(this.nextComments) || (this.displayLimit < this.comments.length);
  }

  addComment(comment): void {
    this.post.num_comments = this.post.num_comments++;
    this.comments.unshift(comment);
  }

  changeSortMode(sortMode: string): void {
    this.sortMode = sortMode;
    this.fetchComments();
  }

  emitCommentAction(data): void {
    this.onCommentAction.emit(data);
  }

  trackByFn(index, item): string {
    return item.data.name;
  }
}

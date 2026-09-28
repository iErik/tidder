import { Component, OnDestroy, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

import { SubredditService } from 'services/subreddit-service/subreddit.service';
import { PostsService } from 'services/posts-service/posts.service';

import { Observable, Subject, Subscription, of } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'post-submit',
  templateUrl: './post-submit.component.html',
  styleUrls: [ './post-submit.component.scss' ]
})

export class PostSubmitComponent implements OnDestroy {
  @Output() onCancel = new EventEmitter<void>();

  public loadingSubmission: boolean;
  public errors: any[] = [];
  public submissionSuccess: boolean;
  public postLink: string;
  public subSuggestions: string[] = [];

  private subQuery = new Subject<string>();
  private subQuerySubscription: Subscription;

  public post =
    { kind: 'link'
    , title: ''
    , url: ''
    , sr: []
    };

  constructor(
    private subService: SubredditService,
    private postService: PostsService,
  ) {
    this.subQuerySubscription = this.subQuery
      .pipe(
        debounceTime(250),
        switchMap(query => query ? this.subAutoComplete(query) : of([]))
      )
      .subscribe(names => this.subSuggestions = names || []);
  }

  ngOnDestroy() {
    this.subQuerySubscription.unsubscribe();
  }

  public subAutoComplete = (input: string): Observable<any> => {
    return this.subService.searchSubNames(input)
      .pipe(catchError(() => of([])));
  }

  // post.sr stays a one-element array, which is what the submit API
  // params expect (it used to be the model of a single-tag input).
  updateSubreddit(name: string): void {
    const trimmed = name.trim();

    this.post.sr = trimmed ? [trimmed] : [];
    this.subQuery.next(trimmed);
  }

  submitPost(): void {
    this.loadingSubmission = true;
    this.errors = [];
    this.post.sr.join();

    this.postService.submitPost(this.post).subscribe(({ errors, data }) => {
      this.loadingSubmission = false;

      if (errors.length > 0) {
        errors.forEach((error) => {
          this.errors.push({ code: error[0], reason: error[1], field: error[2] });
        });
      } else {
        this.postLink = data.url.replace(/^https:.*\.com/, '');
        this.submissionSuccess = true;
      }
    });
  }

  updatePostKind(kind: string): void {
    this.post.kind = kind;
  }

  emitCancel() {
    this.onCancel.emit();
  }
}

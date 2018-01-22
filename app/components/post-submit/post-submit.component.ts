import { Component, Output, EventEmitter } from '@angular/core';

import { SubredditService } from 'services/subreddit-service/subreddit.service';
import { PostsService } from 'services/posts-service/posts.service';

import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'post-submit',
  templateUrl: './post-submit.component.html',
  styleUrls: [ './post-submit.component.scss' ]
})

export class PostSubmitComponent {
  @Output() onCancel = new EventEmitter<void>();

  public loadingSubmission: boolean;
  public errors: any[] = [];
  public submissionSuccess: boolean;
  public postLink: string;

  public post =
    { kind: 'link'
    , title: ''
    , url: ''
    , sr: []
    };

  constructor(
    private subService: SubredditService,
    private postService: PostsService,
  ) { }

  public subAutoComplete = (input: string): Observable<any> => {
    return this.subService.searchSubNames(input);
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

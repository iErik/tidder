import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { SubredditService } from 'services/subreddit-service/subreddit.service';
import { PostsService } from 'services/posts-service/posts.service';

@Component({
  selector: 'report-card',
  templateUrl: './report-card.component.html',
  styleUrls: [ './report-card.component.scss' ]
})

export class ReportCardComponent implements OnInit {
  @Input() thing: any;
  @Output() onCancel = new EventEmitter<void>();

  public loadingRules: boolean = true;
  public loadingSubmission: boolean;
  public reportSubmitted: boolean;

  public subRules: object[] = [];
  public isRuleReason: boolean;

  public reportForm = new FormGroup({
    reason: new FormControl('', Validators.required)
  });

  constructor(
    private subService: SubredditService,
    private postService: PostsService,
  ) { }

  ngOnInit() {
    this.fetchSubRules();
  }

  fetchSubRules(): void {
    this.subService.getSubRules(this.thing.subreddit).subscribe((data) => {
      this.subRules = data.rules;
      this.loadingRules = false;
    });
  }

  submitForm(): void {
    let reason = this.reportForm.get('reason').value;

    if (reason === 'subRules') {
      this.isRuleReason = true
    } else {
      this.loadingSubmission = true;

      let reasonObj = {};
      reasonObj[reason[0]] = reason[1];

      // TODO: I think we may still have to check for errors
      this.postService.reportThing(this.thing.name, reasonObj).subscribe((data) => {
          this.loadingSubmission = false;
          this.reportSubmitted = true;
          this.thing.reported = true;
        });
    }
  }

  rollbackForm(): void {
    if (this.isRuleReason) {
      this.isRuleReason = false
    } else {
      this.emitCancel();
    }
  }

  emitCancel(): void {
    this.onCancel.emit();
  }
}

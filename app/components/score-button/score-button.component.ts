import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'score-button',
  templateUrl: './score-button.component.html',
  styleUrls: [ './score-button.component.scss' ]
})

export class ScoreButtonComponent {
  @Input() score: number;
  @Input() likes: boolean;

  @Output() onUpvote = new EventEmitter<number>();
  @Output() onDownvote = new EventEmitter<number>();
}

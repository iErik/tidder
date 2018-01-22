import {
  Component,
  DoCheck,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';


@Component({
  selector: 'post-viewer',
  templateUrl: './post-viewer.component.html',
  styleUrls: [ './post-viewer.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PostViewerComponent {
  public loadingComments: boolean = false;

  public postComments: Array<object> = [];
  public commentsSortMode: string = 'confidence';
  public nextComments: any;

  @Input() currentPost: any;
  @Output() onFeedAction = new EventEmitter<any>();
}

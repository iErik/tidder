import { Component, Input, Output, EventEmitter } from '@angular/core';

import { PostsService } from 'services/posts-service/posts.service';

@Component({
  selector: 'comment-editor',
  templateUrl: './comment-editor.component.html',
  styleUrls: [ './comment-editor.component.scss' ]
})

export class CommentEditorComponent {
  @Input() parentId: string;
  @Input() isChild: boolean;

  @Output() onCommentSubmitted = new EventEmitter<object>();

  public loadingRequest: boolean = false;
  public editorHasFocus: boolean;
  public comment = { thing_id: '' , text: '' };

  constructor( private postsService: PostsService ) { }

  submitComment(): void {
    if (!this.comment.text)
      return;

    this.loadingRequest = true;
    this.comment.thing_id = this.parentId;

    console.log("loadingRequest: ", this.loadingRequest);

    this.postsService.submitComment(this.comment).subscribe((data) => {
      console.log("submitComment.data: ", data);

      this.loadingRequest = false;
      this.onCommentSubmitted.emit(data.data.things[0]);
      this.resetComment();
    });
  }

  collapseEditor(): void { }

  resetComment(): void {
    this.comment = { thing_id: '', text: '' };
  }
}

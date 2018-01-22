import { NgModule }                         from '@angular/core';
import { CommonModule }                     from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule }                     from '@angular/router';
import { BrowserAnimationsModule }          from '@angular/platform-browser/animations';

import { MomentModule }                     from 'angular2-moment';
import { TagInputModule }                   from 'ngx-chips';
import { InfiniteScrollModule }             from 'ngx-infinite-scroll';
//import { TextareaAutosizeModule }           from 'ngx-textarea-autosize';

import { SubInfoFeedCardComponent }         from './sub-info-feed-card';
import { PostFeedFiltersComponent }         from './post-feed-filters';
import { SharePostCardComponent }           from './share-post-card';
import { WindowControlsComponent }          from './window-controls';
import { CommentEditorComponent }           from './comment-editor';
import { PostFeedCardComponent }            from './post-feed-card';
import { SubmitButtonComponent }            from './submit-button';
import { CommentFeedComponent }             from './comment-feed';
import { ThemePickerComponent }             from './theme-picker';
import { ScoreButtonComponent }             from './score-button';
import { CommentCardComponent }             from './comment-card';
import { SplitButtonComponent }             from './split-button';
import { PostViewerComponent }              from './post-viewer';
import { ReportCardComponent }              from './report-card';
import { PostSubmitComponent }              from './post-submit';
import { SearchBarComponent }               from './search-bar';
import { PostFeedComponent }                from './post-feed';
import { PostCardComponent }                from './post-card';

const components =
[ SubInfoFeedCardComponent
, PostFeedFiltersComponent
, SharePostCardComponent
, WindowControlsComponent
, CommentEditorComponent
, PostFeedCardComponent
, SubmitButtonComponent
, CommentFeedComponent
, ThemePickerComponent
, ScoreButtonComponent
, CommentCardComponent
, SplitButtonComponent
, PostViewerComponent
, ReportCardComponent
, PostSubmitComponent
, SearchBarComponent
, PostFeedComponent
, PostCardComponent
];

@NgModule({
  imports: [
    RouterModule.forChild([]),
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,

//    TextareaAutosizeModule,
    InfiniteScrollModule,
    TagInputModule,
    MomentModule
  ],

  declarations: components,
  exports: components
})
export class ComponentsModule { }

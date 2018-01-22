import { NgModule }            from '@angular/core';
import { RouterModule }        from '@angular/router';

import { FeedPageModule }      from './feed-page/feed.module';

import { routes }              from './pages.routes';

@NgModule({
  imports: [
    RouterModule.forChild(routes),

    FeedPageModule
  ],

  exports: [ FeedPageModule ]
})

export class PagesModule { }

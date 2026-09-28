import { NgModule }         from '@angular/core';
import { FormsModule }      from '@angular/forms';
import { CommonModule }     from '@angular/common';

import { ComponentsModule } from 'components/components.module';

import { FeedPage }         from './feed.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,

    ComponentsModule
  ],

  declarations: [ FeedPage ],
  exports: [ FeedPage ]
})

export class FeedPageModule { }

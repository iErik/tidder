import { NgModule } from '@angular/core';

import { UserService } from './user-service/user.service';
import { PostsService } from './posts-service/posts.service';
import { SubredditService } from './subreddit-service/subreddit.service';
import { MultiredditService } from './multireddit-service/multireddit.service';

@NgModule({
  providers:
    [ UserService
    , PostsService
    , SubredditService
    , MultiredditService
    ]
})

export class ServicesModule { }

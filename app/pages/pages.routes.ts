import { Routes } from '@angular/router';

import { FeedPage } from './feed-page/feed.page';

export const routes: Routes = [
  { path: ''
  , children:
    [{ path: ''
     , component: FeedPage
     }
     ,
     { path: 'user/:userName/m/:multiName'
     , component: FeedPage
     }
     ,
     { path: 'r/:subredditName'
     , component: FeedPage
     }
     ,
     { path: 'saved'
     , component: FeedPage
     }]
  }
];

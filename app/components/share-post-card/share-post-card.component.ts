import { Component, Input, OnInit } from '@angular/core';

import { popupWindow } from 'utils/utils';

//  TODO: Move most of these hard coded strings into the api
//  config json file.

@Component({
  selector: 'share-post-card',
  templateUrl: './share-post-card.component.html',
  styleUrls: [ './share-post-card.component.scss' ]
})

export class SharePostCardComponent implements OnInit {
  @Input() post: any;
  public postLink : string;

  ngOnInit() { this.postLink = `https://www.reddit.com${this.post.permalink}`; }

  shareOnFacebook(): void {
    // Lets just use Reddit's API own variables for now
    let appId = '322647334569188';
    let redirect_uri = 'https://www.reddit.com/share/close';
    let apiUrl = `https://www.facebook.com/dialog/feed?app_id=${appId}`
      + `&link=${encodeURIComponent(`${this.postLink}?ref=share&ref_source=facebook`)}`
      + `&redirect_uri=${encodeURIComponent(redirect_uri)}&display=popup`;

    popupWindow(apiUrl, 550, 450, 'Share');
  }

  shareOnTwitter(): void {
    let apiUrl = `https://twitter.com/intent/tweet`
      + `?url=${this.postLink}?ref=share&ref_source=twitter`
      + `&text=${encodeURIComponent(this.post.title + "\n")}&via=reddit`;

    popupWindow(apiUrl, 550, 450, 'Share');
  }

  shareOnTumblr(): void {
    let apiUrl = `https://www.tumblr.com/widgets/share/tool/preview`
      + `?canonicalUrl=${encodeURIComponent(`${this.postLink}?ref=share&ref_source=tumblr`)}`
      + `&title=${encodeURIComponent(this.post.title)}&_format=html&posttype=link`;

    popupWindow(apiUrl, 550, 450, 'Share');
  }
}

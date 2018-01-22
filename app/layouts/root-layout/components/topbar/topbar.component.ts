import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

import { UserService } from 'services/user-service/user.service';

import { ISubscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-topbar',
  templateUrl: 'topbar.component.html',
  styleUrls: [ 'topbar.component.scss' ]
})

export class TopbarComponent implements OnInit, OnDestroy {
  public pageLabel = 'FRONTPAGE';

  private routerSubscription: ISubscription;

  @Input() isSidebarActive: boolean;
  @Output() onSidebarToggle = new EventEmitter<boolean>();

  constructor(
    public user: UserService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.routerSubscription = this.router.events
      .filter(event => event instanceof NavigationEnd)
      .subscribe((ev: NavigationEnd) => {
        if (ev.url.startsWith('/r/')) {
          this.pageLabel = `r/${ev.url.replace('/r/', '').toUpperCase()}`;
        } else if (/^\/user\/[\w\-]+\/m\/\w+$/.test(ev.url)) {
          let multiName = ev.url.match(/^\/user\/[\w\-]+\/m\/(\w+)$/)[1];
          this.pageLabel = `m/${multiName.toUpperCase()}`;
        } else {
          this.pageLabel = 'FRONTPAGE';
        }
      });
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
  }

  toggleSidebar(): void {
    this.onSidebarToggle.emit(!this.isSidebarActive);
  }

  login(): void {
    this.user.login();
  }

  logout(): void {
    this.user.logout();
  }
}

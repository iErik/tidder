import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';

const settings = require('electron-settings');

import { UserService } from 'services/user-service/user.service';

import { ISubscription } from 'rxjs/Subscription';

@Component({
  selector: 'root-layout',
  templateUrl: './root.layout.html'
})

export class RootLayout implements OnInit, OnDestroy {
  public showSidebar = false;
  public updatingState = true;

  private userStateSubscription: ISubscription;
  private appThemeObserver: any;

  constructor(
    private cdr: ChangeDetectorRef,
    private user: UserService,
    private zone: NgZone
  ) { }

  ngOnInit() {
    console.log("settings: ", settings);

    this.userStateSubscription = this.user.updatingState$
      .subscribe((isUpdating) => {
        this.zone.run(() => {
          this.updatingState = isUpdating;

          // Well, technically, zone.run should run change detection right
          // afterwards, but that doesn't always happen, go figure.
          this.cdr.detectChanges();
        });
      });

    this.appThemeObserver = settings.watch('appTheme', newTheme => {
      console.log("Changes to appTheme detected")
      this.zone.run(() => this.cdr.detectChanges());
    });
  }

  ngOnDestroy() {
    console.log("RootLayout.OnDestroy")
    this.userStateSubscription.unsubscribe();
    this.appThemeObserver.dispose();
  }

  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  get appTheme() { return settings.get('appTheme'); }
}

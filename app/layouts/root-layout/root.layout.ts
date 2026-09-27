import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ChangeDetectionStrategy } from '@angular/core';

import { UserService } from 'services/user-service/user.service';

import { Subscription } from 'rxjs';

const settings = window.tidder.settings;

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'root-layout',
  templateUrl: './root.layout.html'
})

export class RootLayout implements OnInit, OnDestroy {
  public platform = window.tidder.platform;
  public showSidebar = false;
  public updatingState = true;

  private userStateSubscription: Subscription;
  private appThemeObserver: any;

  constructor(
    private cdr: ChangeDetectorRef,
    public user: UserService,
    private zone: NgZone
  ) { }

  ngOnInit() {
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
      this.zone.run(() => this.cdr.detectChanges());
    });
  }

  ngOnDestroy() {
    this.userStateSubscription.unsubscribe();
    this.appThemeObserver.dispose();
  }

  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  get appTheme() { return settings.get('appTheme'); }
}

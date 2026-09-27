import { Component, ChangeDetectionStrategy } from '@angular/core';

import { Observable } from 'rxjs';

import { UserService, LoginStatus } from 'services/user-service/user.service';

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-login-screen',
  templateUrl: 'login-screen.component.html',
  styleUrls: [ 'login-screen.component.scss' ]
})

export class LoginScreenComponent {
  public status$: Observable<LoginStatus>;

  constructor(private user: UserService) {
    this.status$ = user.loginStatus$;
  }

  login(): void {
    this.user.login();
  }

  cancel(): void {
    this.user.cancelLogin();
  }
}

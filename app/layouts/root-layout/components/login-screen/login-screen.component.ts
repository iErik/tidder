import { Component, ChangeDetectionStrategy } from '@angular/core';

import { UserService } from 'services/user-service/user.service';

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-login-screen',
  templateUrl: 'login-screen.component.html',
  styleUrls: [ 'login-screen.component.scss' ]
})

export class LoginScreenComponent {
  constructor(private user: UserService) { }

  login(): void {
    this.user.login();
  }
}

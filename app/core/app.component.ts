import { Component } from '@angular/core';

import { UserService } from 'services/user-service/user.service';

@Component({
  selector: 'app-root',
  template: `<root-layout></root-layout>`
})

export class AppComponent {
  constructor( private userService: UserService ) {
    this.userService.setup();
  }
}

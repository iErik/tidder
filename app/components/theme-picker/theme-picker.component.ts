import { Component } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';

const settings = require('electron-settings');
const appThemes = require('config/themes.json').appThemes;

@Component({
  selector: 'theme-picker',
  templateUrl: './theme-picker.component.html',
  styleUrls: [ './theme-picker.component.scss' ],

  animations: [
    trigger(
    'enterAnimation'
    , [ transition(':enter',
        [ style({ opacity: 0 })
        , animate('200ms', style({ opacity: 1 }))
        ])
      , transition(':leave',
        [ style({ opacity: 1 })
        , animate('200ms', style({ opacity: 0 }))
        ])
      ]
    )
  ]
})

export class ThemePickerComponent {
  public showMenu: boolean = false;
  public themes = Object.keys(appThemes || {});

  get currentTheme() {
    return;
  }

  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  changeTheme(theme: string): void {
    console.log("Changing current theme to: ", theme);

    this.showMenu = false;
    settings.set('appTheme', theme);
  }
}

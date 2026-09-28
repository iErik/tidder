import { Component, ChangeDetectionStrategy } from '@angular/core';

import themesConfig from 'config/themes.json';

const settings = window.tidder.settings;
const appThemes = themesConfig.appThemes;

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'theme-picker',
  templateUrl: './theme-picker.component.html',
  styleUrls: [ './theme-picker.component.scss' ]
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

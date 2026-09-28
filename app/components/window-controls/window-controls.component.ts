import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'window-controls',
  templateUrl: './window-controls.component.html',
  styleUrls: [ './window-controls.component.scss' ]
})

export class WindowControlsComponent {
  public platform:string = window.tidder.platform;

  closeWindow(): void {
    window.tidder.window.close();
  }

  minimizeWindow(): void {
    window.tidder.window.minimize();
  }

  maximizeWindow(): void {
    window.tidder.window.maximize();
  }

  unmaximizeWindow(): void { }

  getIconClass(icon: string): string {
    return this.platform === 'darwin' ? `icn-${icon}-darwin` : `icn-${icon}`;
  }
}

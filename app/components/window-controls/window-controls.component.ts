import { Component, OnInit } from '@angular/core';
import { remote } from 'electron';
const os = require('os');

@Component({
  selector: 'window-controls',
  templateUrl: './window-controls.component.html',
  styleUrls: [ './window-controls.component.scss' ]
})

export class WindowControlsComponent {
  public platform:string = os.platform();

  closeWindow(): void {
    remote.getCurrentWindow().close();
  }

  minimizeWindow(): void {
    remote.getCurrentWindow().minimize();
  }

  maximizeWindow(): void {
    remote.getCurrentWindow().maximize();
  }

  unmaximizeWindow(): void { }

  getIconClass(icon: string): string {
    return this.platform === 'darwin' ? `icn-${icon}-darwin` : `icn-${icon}`;
  }
}

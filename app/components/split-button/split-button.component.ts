import { Component, Input } from '@angular/core';


@Component({
  selector: 'split-button',
  templateUrl: './split-button.component.html',
  styleUrls: [ './split-button.component.scss' ]
})

export class SplitButtonComponent {
  @Input() buttonLabel: string;
}

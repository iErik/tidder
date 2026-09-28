import { Component, Input, ChangeDetectionStrategy } from '@angular/core';


@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'split-button',
  templateUrl: './split-button.component.html',
  styleUrls: [ './split-button.component.scss' ]
})

export class SplitButtonComponent {
  @Input() buttonLabel: string;
}

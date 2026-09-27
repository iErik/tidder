import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'submit-button',
  templateUrl: './submit-button.component.html',
  styleUrls: [ './submit-button.component.scss' ]
})

export class SubmitButtonComponent {
  @Input() spinnerType: string = 'round-spinner';
  @Input() isDisabled: boolean;
  @Input() isLoading: boolean;
  @Input() outline: boolean;
}

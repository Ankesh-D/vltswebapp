import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-global-modal',
    imports: [],
    templateUrl: './global-modal.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./global-modal.component.scss']
})
export class GlobalModalComponent {

  @Input() show = false;
  @Input() title = '';
  @Input() message = '';

  @Input() button1 = '';
  @Input() button2 = '';
  @Input() button3 = '';

  @Output() action1 = new EventEmitter();
  @Output() action2 = new EventEmitter();
  @Output() action3 = new EventEmitter();

  closeModal(){
    this.show = false;
  }

}
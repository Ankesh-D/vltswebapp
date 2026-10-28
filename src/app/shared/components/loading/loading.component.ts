import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-loading',
    imports: [MatProgressSpinnerModule],
    template: `
    @if (show) {
      <div class="loading-overlay">
        <mat-spinner [diameter]="diameter"></mat-spinner>
        @if (message) {
          <p class="loading-message">{{ message }}</p>
        }
      </div>
    }
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .loading-message {
      color: white;
      margin-top: 16px;
      font-size: 16px;
    }
  `]
})
export class LoadingComponent {
  @Input() show = false;
  @Input() message = '';
  @Input() diameter = 50;
}

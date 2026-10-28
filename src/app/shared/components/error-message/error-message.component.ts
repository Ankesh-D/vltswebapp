import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-error-message',
    imports: [MatCardModule, MatIconModule, MatButtonModule],
    template: `
    @if (message) {
      <mat-card class="error-card">
        <mat-card-content>
          <div class="error-content">
            <mat-icon color="warn">error</mat-icon>
            <div class="error-text">
              <h3>{{ title || 'Error' }}</h3>
              <p>{{ message }}</p>
            </div>
          </div>
          @if (showRetry && onRetry) {
            <button mat-raised-button color="primary" (click)="onRetry()">
              Retry
            </button>
          }
        </mat-card-content>
      </mat-card>
    }
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .error-card {
      margin: 20px;
      background-color: #ffebee;
    }

    .error-content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;
    }

    .error-text {
      flex: 1;
    }

    .error-text h3 {
      margin: 0 0 8px 0;
      color: #c62828;
    }

    .error-text p {
      margin: 0;
      color: #d32f2f;
    }
  `]
})
export class ErrorMessageComponent {
  @Input() message = '';
  @Input() title = 'Error';
  @Input() showRetry = false;
  @Input() onRetry?: () => void;
}

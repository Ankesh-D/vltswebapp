import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-toast',
    imports: [CommonModule],
    template: `
    <div class="toast-box" [ngClass]="type">
      <div class="icon-area">
        <i class="fa" [ngClass]="icon" aria-hidden="true"></i>
      </div>
      <div class="content-area">
        <div class="toast-title">{{ title }}</div>
        <div class="toast-message">{{ message }}</div>
      </div>
      <button class="close-btn" (click)="dismiss()" aria-label="Close">
        <i class="fa fa-times" aria-hidden="true"></i>
      </button>
      <!-- Progress bar animation -->
      <div class="progress-bar" [style.animation-duration]="duration + 'ms'"></div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    :host {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000000;
      pointer-events: auto;
    }
    .toast-box {
      display: flex;
      align-items: flex-start;
      background: white;
      border-radius: 4px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.2);
      min-width: 300px;
      max-width: 450px;
      overflow: hidden;
      position: relative;
      animation: slideInRight 0.3s ease-out;
      border-left: 5px solid;
    }
    .toast-box.error { border-left-color: #f44336; }
    .toast-box.success { border-left-color: #4caf50; }
    
    .icon-area {
      padding: 12px 0 12px 12px;
      display: flex;
      align-items: center;
    }
    .icon-area .fa {
      font-size: 24px;
      line-height: 1;
      width: 24px;
      text-align: center;
    }
    .fa-check-circle { color: #4caf50; }
    .fa-exclamation-triangle { color: #f44336; }

    .content-area {
      flex: 1;
      padding: 12px;
    }
    .toast-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 2px;
      text-transform: capitalize;
    }
    .toast-message {
      font-size: 13px;
      color: #555;
    }
    .close-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      margin: 8px 8px 0 4px;
      font-size: 18px;
      color: #999;
      line-height: 1;
      opacity: 0.7;
    }
    .close-btn:hover {
      color: #333;
      opacity: 1;
    }
    
    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: rgba(0,0,0,0.1);
      width: 100%;
      animation: progress linear forwards;
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes progress {
      to { width: 0%; }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' = 'error';
  @Input() duration = 5000;
  @Output() closed = new EventEmitter<void>();

  private timer: any;

  get icon() {
    return this.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
  }
  get title() { return this.type === 'success' ? 'Success' : 'Error'; }

  ngOnInit() {
    this.timer = setTimeout(() => this.dismiss(), this.duration);
  }

  ngOnDestroy() { if (this.timer) clearTimeout(this.timer); }
  dismiss() { this.closed.emit(); }
}
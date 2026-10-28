import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { PanicSession, apiField } from '../panic-session-map/panic-session.model';
import { ToastService } from '../../../core/services/toast.service';
import { AlertService } from '../../../core/services/alert.service';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-panic-action', standalone: true,
  imports: [CommonModule, FormsModule, A11yModule],
  templateUrl: './panic-action.component.html', styleUrl: './panic-action.component.scss'
})
export class PanicActionComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly alertService = inject(AlertService);
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private currentSession!: PanicSession;
  @Input({ required: true }) set session(value: PanicSession) {
    this.currentSession = value;
    this.mobileNumber = value.ownerPhone || '';
    this.reason = ''; this.remark = '';
  }
  get session(): PanicSession { return this.currentSession; }
  @Output() closed = new EventEmitter<void>();
  @Output() resolved = new EventEmitter<void>();
  submitting = false;
  reasons: { id: string; name: string }[] = [];
  reasonsLoading = false;
  reasonsError = '';
  reason = '';
  mobileNumber = '';
  remark = '';
  ngOnInit(): void { this.loadReasons(); }

  loadReasons(): void {
    if (this.reasonsLoading) return;
    this.reasonsLoading = true;
    this.reasonsError = '';
    this.reasons = [];
    this.reason = '';
    this.alertService.getSosReasonList().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.reasonsLoading = false)
    ).subscribe({
      next: response => {
        const entity = response.entity;
        const rows = Array.isArray(entity) ? entity : entity?.listData ?? entity?.listdata ?? entity?.details;
        if (!response.status || !Array.isArray(rows)) {
          this.reasonsError = 'Could not load reasons.';
          return;
        }
        this.reasons = rows.map(row => ({
          id: String(apiField(row, 1) ?? '').trim(),
          name: String(apiField(row, 2) ?? '').trim()
        })).filter(option => !!option.id && !!option.name);
        if (!this.reasons.length) this.reasonsError = 'No reasons available.';
      },
      error: () => this.reasonsError = 'Could not load reasons.'
    });
  }

  @HostListener('document:keydown.escape', ['$event']) onEscape(event: KeyboardEvent): void {
    event.stopImmediatePropagation(); this.closed.emit();
  }

  
  
  submit(): void {
    if (this.submitting || this.reasonsLoading || !this.reasons.some(option => option.id === this.reason) || !this.remark.trim()) return;
    const vehicleId = this.session.vehicleId?.trim() || '0';
    const reasonId = this.reason.trim();
    if (!this.session.sessionId.trim() || !reasonId) {
      this.toast.show('Status could not be saved: session ID or reason is missing.', 'error');
      return;
    }
    this.submitting = true;
    this.alertService.resolveSosSession({
      param1: vehicleId,
      param2: this.session.sessionId,
      param3: reasonId,
      param4: this.remark.trim(),
      pagename: 'Vehicle Status Details'
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.submitting = false)).subscribe({
      next: response => {
        if (response.status !== true) {
          this.toast.show(response.message || 'Panic session could not be resolved. Please retry.', 'error');
          return;
        }
        const message = typeof response.entity === 'string' ? response.entity.trim() : '';
        this.toast.show(message || response.message || 'Panic session resolved successfully.', 'success');
        this.resolved.emit();
        this.closed.emit();
      },
      error: () => this.toast.show('Panic session could not be resolved. Please retry.', 'error')
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { AlertService } from '../../../core/services/alert.service';
import { apiField, numericValue } from '../panic-session-map/panic-session.model';

@Component({
    selector: 'app-erss-session-details',
    imports: [CommonModule, FormsModule],
    templateUrl: './erss-session-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['../control-center-dashboard/control-center-dashboard.component.scss', './erss-session-details.component.scss']
})
export class ErssSessionDetailsComponent implements OnInit {
  @Input() initialTotal: number | null = null;
  private readonly service = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  private requestVersion = 0;
  search = '';
  private appliedSearch = '';
  page = 1;
  pageSize = 20;
  total: number | null = null;
  loading = false;
  error = '';
  rows: string[][] = [];
  readonly columns = [
    'Session ID', 'Vehicle no.', 'Chassis no.', 'IMEI', 'Vehicle class', 'RTO',
    'Customer name', 'Customer mobile', 'Last panic time', 'Last panic location',
    'Latitude', 'Longitude', 'Vendor', 'Device model', 'Device serial no.', 'ICCID',
    'Mobile 1', 'Network 1', 'Mobile 2', 'Network 2', 'Activation date',
    'Valid upto', 'Dealer', 'Push time', 'Push response'
  ];
  ngOnInit(): void { this.load(); }
  get pages(): number | null { return this.total === null ? null : Math.max(1, Math.ceil(this.total / this.pageSize)); }
  get hasNext(): boolean { if (this.error) return false; return this.total === null ? this.rows.length === this.pageSize : this.page * this.pageSize < this.total; }
  get rangeStart(): number { return this.rows.length ? (this.page - 1) * this.pageSize + 1 : 0; }
  get rangeEnd(): number { return this.rows.length ? this.rangeStart + this.rows.length - 1 : 0; }
  searchRows(): void { this.appliedSearch = this.search.trim(); this.page = 1; this.load(); }
  changePageSize(): void { this.page = 1; this.load(); }
  changePage(direction: number): void {
    if (this.loading || (direction < 0 && this.page === 1) || (direction > 0 && !this.hasNext)) return;
    this.page += direction; this.load();
  }
  load(): void {
    const version = ++this.requestVersion;
    this.request?.unsubscribe();
    this.loading = true; this.error = ''; this.rows = [];
    this.total = this.appliedSearch ? null : this.initialTotal;
    this.request = this.service.getPushToErssSessionDetails({
      param1: this.appliedSearch, param2: String(this.page), param3: String(this.pageSize),
      param4: '', param5: '', param6: '', param7: '', param8: ''
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => { if (version === this.requestVersion) this.loading = false; })).subscribe({
      next: response => {
        if (response.status !== true || (response.statuscode != null && Number(response.statuscode) !== 200)) {
          this.error = response.message || 'Could not load ERSS session details.'; return;
        }
        const entity = response.entity;
        const records = Array.isArray(entity) ? entity : entity?.listData ?? entity?.listdata ?? entity?.details;
        if (!Array.isArray(records)) { this.error = 'Invalid ERSS session details response.'; return; }
        const total = numericValue(entity?.totalCount ?? entity?.TotalCount ?? entity?.totalRecords ?? entity?.Param1 ?? entity?.param1);
        if (total !== null && total >= 0) this.total = total;
        if (this.pages !== null && this.page > this.pages) {
          this.page = this.pages; this.load(); return;
        }
        if (total === null && records.length < this.pageSize && (records.length > 0 || this.page === 1)) {
          this.total = (this.page - 1) * this.pageSize + records.length;
        }
        this.rows = records.slice(0, this.pageSize).map(row => this.columns.map((_column, index) => String(apiField(row, index + 2) ?? '').trim()));
      },
      error: () => this.error = 'Could not load ERSS session details. Please retry.'
    });
  }
}

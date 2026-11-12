
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import dayjs, { Dayjs } from 'dayjs/esm';
import { OperationService } from '../../../core/services/operation.service';
import { ToastService } from '../../../core/services/toast.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
@Component({
    selector: 'app-new-raw-data',
    imports: [
    FormsModule,
    NgxDaterangepickerMd,
    CommonDataToolbarComponent,
    DataTableComponent,
    PaginationComponent
],
    templateUrl: './new-raw-data.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./new-raw-data.component.scss']
})
export class NewRawDataComponent {

  imei: string = '';

selectedDate: any = {
  startDate: dayjs(),
  endDate: dayjs()
};

  packetType = 'LOGIN';

  dataType = '';
// history
  pageSize = 25;
  readonly pageSizeOptions = [10, 25, 50, 100];
  currentPage = 1;
  totalCount = 0;
  pageCount = 0;
  loading = false;

  rawData: any[] = [];
  sortKey = '';
  reverse = false;
  readonly tableColumns: DataTableColumn<any>[] = [
    { key: 'serialNumber', header: 'Sr No', sortKey: 'serialNumber', width: '70px' },
    {
      key: 'param4',
      header: 'Raw String',
      sortKey: 'param4',
      cellClassName: 'raw-string-cell',
      cellStyle: { 'max-width': '420px', 'overflow-wrap': 'anywhere' }
    },
    { key: 'param5', header: 'Device IP', sortKey: 'param5' },
    { key: 'param6', header: 'Port', sortKey: 'param6' }
  ];

  packetTabs = [
    { label: 'LOGIN', value: 'LOGIN' },
    { label: 'HEALTH', value: 'HEALTH' },
    { label: 'PVT', value: 'PVT' },
    { label: 'PANIC', value: 'PANIC' },
    { label: 'ALERT', value: 'ALERT' },
    { label: 'UNKNOWN', value: 'UNKNOWN' }
  ];

  constructor(
    private operationService: OperationService,
    private toast: ToastService
  ) {
    this.toast.pageName = 'Raw Data'; // Set page name for toast service
   }

  searchRawData(pageNo: number = 1) {
  if (!this.imei || !this.imei.trim()) {
    this.toast.show('Please enter IMEI.', 'error');
    return;
  }

  if (!this.selectedDate?.startDate) {
    this.toast.show('Please select Date.', 'error');
    return;
  }

  this.loading = true;
  this.currentPage = pageNo;

  const request = {
    param1: '',
    param2: pageNo.toString(),
    param3: this.pageSize.toString(),
    param4: '',
    param5: this.imei.trim(),
  param6: this.selectedDate.startDate.format('DD-MMM-YYYY'),
    param7: this.dataType,
    param8: this.packetType
  };

  this.toast.showLoader();

  this.operationService.getNewRawData(request).subscribe({
    next: (response: any) => {

      this.loading = false;
      this.toast.hideLoader();

      if (response.statuscode == 200) {
        const listData = response.entity?.listData || [];
        this.rawData = listData.map((item: any, index: number) => ({
          ...item,
          serialNumber: (pageNo - 1) * this.pageSize + index + 1
        }));
        this.totalCount = response.entity?.param1 || 0;
        this.pageCount = listData.length;
      } else {
        this.rawData = [];
        this.totalCount = 0;
        this.pageCount = 0;
        this.toast.show(response.entity, 'error');
      }
    },

    error: () => {
      this.loading = false;
      this.toast.hideLoader();
      this.rawData = [];
      this.totalCount = 0;
      this.pageCount = 0;
      this.toast.show('Something went wrong.', 'error');
    }
  });
}

  changeTab(type: string) {

    this.packetType = type;

    if (this.imei.trim()) {
      this.searchRawData(1);
    }

  }
  isInvalidDate = (date: Dayjs) => {
  return date.isAfter(dayjs(), 'day');
};
  onPageSizeChange(pageSize: number | string): void {
    const nextPageSize = Number(pageSize);
    if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) {
      return;
    }

    this.pageSize = nextPageSize;
    this.searchRawData(1);
  }

  onPageChange(pageNo: number): void {
    this.searchRawData(pageNo);
  }

  sort(key: string): void {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
  }

  getPaginatedData(): any[] {
    const rows = [...this.rawData];
    if (!this.sortKey) {
      return rows;
    }

    return rows.sort((a, b) => {
      const firstValue = a[this.sortKey];
      const secondValue = b[this.sortKey];
      const comparison = typeof firstValue === 'number' && typeof secondValue === 'number'
        ? firstValue - secondValue
        : String(firstValue ?? '').localeCompare(String(secondValue ?? ''), undefined, { numeric: true });

      return this.reverse ? -comparison : comparison;
    });
  }
}
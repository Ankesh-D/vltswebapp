import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseApiService } from '../../../core/services/base-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

export interface RTOWiseDeviceDetail {
  "param1": string;//"30020",// devicemakeid
  "param2": string;//"BLACKBOX GPS TECHNOLOGIES OPC PVT LTD",// vendorname
  "param3": string;//"1",// InstalledCount
  "param4": string;//"1",// ActivatedCount
  "param5": string;//"0",// PendingCount
  "param6": string;//"0",// RTOApprovedCount
  "param7": string;//"0",// Received
  "param8": string;//"0",// NotReceived
  "param9": string;//"1"// NeverReceived
}

@Component({
    selector: 'app-new-device-count',
    imports: [FormsModule, RouterModule, CommonTableComponent],
    templateUrl: './new-device-count.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './new-device-count.component.scss'
})
export class NewDeviceCountComponent implements OnInit {
  readonly tableColumns: CommonTableColumn<RTOWiseDeviceDetail>[] = [
    { key: 'rowNumber', label: '#', className: 'text-center', cellClass: 'text-center' },
    { key: 'param2', label: 'Vendor Name', cellClass: 'fw-bold text-dark' },
    { key: 'param3', label: 'Installed', cellClass: 'text-center' },
    { key: 'param4', label: 'Activated', cellClass: 'text-center text-muted' },
    { key: 'param5', label: 'RTO Approve Count', cellClass: 'text-center fw-bold' },
    { key: 'param6', label: 'Not Activated Count', cellClass: 'text-center' },
    { key: 'param7', label: 'Received', cellClass: 'text-center text-success fw-bold' },
    { key: 'param8', label: 'Not Received', cellClass: 'text-center text-danger' },
    { key: 'param9', label: 'Never Received', cellClass: 'text-center text-warning' }
  ];

  rtowisedevicedetails: RTOWiseDeviceDetail[] = [];
  loading: boolean = false;
  searchText: string = '';

  // Pagination & Counts
  pageSize: number = 20;
  pageSizeOptions: number[] = [20, 50, 100, 200, 500];
  totalCount: number = 0;
  pageCount: number = 0;

  // Filters
  fromDate: string = '01-Jan-2021';
  toDate: string = '';
  selectedRTOFilter: string = '';

  // Totals for Summary Footer  
  InstalledCount = 0; ActivatedCount = 0; PendingCount = 0;
  RTOApprovedCount = 0; Received = 0; NotReceived = 0;
  NeverReceived = 0; 
  

  constructor(
    private baseApiService: BaseApiService,
    private notificationService: NotificationService
  ) {
    this.toDate = this.formatDate(new Date());
  }

  ngOnInit() {
    this.loadDevices();
  }

  loadDevices() {
    //this.loading = true;

    this.baseApiService.post<any>('/psv_newdevisescount', {
      param1: this.searchText || '',
      param2: this.fromDate,
      param3: this.toDate
    }).subscribe({
      next: (response) => {
       // this.loading = false;
        if (response && response.status && response.entity) {
          const data = response.entity;
          
          // Normalizing the response: if entity is a single object (as in your snippet), wrap it in an array.
          this.rtowisedevicedetails = Array.isArray(data) ? data : [data];
          
          this.totalCount = this.rtowisedevicedetails.length;
          this.pageCount = this.rtowisedevicedetails.length;
          this.calculateTotals();
        } else {
          this.rtowisedevicedetails = [];
          this.totalCount = 0;
          this.calculateTotals();
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Failed to load RTO device counts. Please try again.');
      }
    });
  }

  private calculateTotals() {
    this.InstalledCount = 0; this.ActivatedCount = 0; this.PendingCount = 0;
    this.RTOApprovedCount = 0; this.Received = 0; this.NotReceived = 0;
    this.NeverReceived = 0;

    this.rtowisedevicedetails.forEach(rto => {
      this.InstalledCount += Number(rto.param3) || 0;
      this.ActivatedCount += Number(rto.param4) || 0;
      this.PendingCount += Number(rto.param5) || 0;
      this.RTOApprovedCount += Number(rto.param6) || 0;
      this.Received += Number(rto.param7) || 0;
      this.NotReceived += Number(rto.param8) || 0;
      this.NeverReceived += Number(rto.param9) || 0;
    });
  }

  getSearchDetails() { this.loadDevices(); }

  reloadData() {
    this.searchText = '';
    this.loadDevices();
  }

  onPageSizeChange(event: any) {
    this.loadDevices();
  }

  formatDate(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = date.getDate();
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    return `${d < 10 ? '0' + d : d}-${m}-${y}`;
  }
}

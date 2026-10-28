import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceService, Device } from '../../../core/services/device.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

declare var $: any;

@Component({
    selector: 'app-receipt-generated-devices',
    imports: [CommonModule, FormsModule, LoadingComponent, ErrorMessageComponent, CommonTableComponent],
    templateUrl: './receipt-generated-devices.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./receipt-generated-devices.component.scss']
})
export class ReceiptGeneratedDevicesComponent implements OnInit, AfterViewInit {
  devices: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#' },
    { key: 'param7', label: 'Receipt No.', sortable: true },
    { key: 'param11', headers: ['Vehicle No.', 'Chassis No.'], sortable: true, sortKey: 'param11' },
    { key: 'param5', label: 'Customer Name', sortable: true },
    { key: 'param4', label: 'Mobile No.', sortable: true },
    { key: 'param6', label: 'Email ID', sortable: true },
    { key: 'param28', headers: ['Receipt Date', 'Time'], sortable: true },
    { key: 'param19', label: 'Amount', sortable: true },
    { key: 'param16', label: 'Status', sortable: true },
    { key: 'param14', label: 'Payment Mode', sortable: true },
    { key: 'param53', label: 'Transaction ID', sortable: true }
  ];
  loading = false;
  errorMessage = '';
  
  fromDate: string = '';
  toDate: string = '';
  
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  
  sortKey: string = '';
  reverse: boolean = false;
  
  constructor(
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.initializeDatePickers();
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeDatePickers();
    }, 200);
  }
  
  initializeDatePickers() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.datepicker) {
        $('.datepick').datepicker({
          format: 'dd-M-yyyy',
          endDate: '+0d',
          autoclose: true
        });
        const today = new Date();
        const formattedDate = this.formatDate(today);
        $('.datepick').datepicker('setDate', today);
        if (!this.fromDate) this.fromDate = formattedDate;
        if (!this.toDate) this.toDate = formattedDate;
      }
    }, 100);
  }
  
  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  
  getdatewiseactivated(page: number = 1) {
    // Get values from jQuery datepicker
    if (typeof $ !== 'undefined') {
      const fromDateVal = $('#fromdate').val();
      const toDateVal = $('#todate').val();
      
      if (fromDateVal) this.fromDate = fromDateVal.toString();
      if (toDateVal) this.toDate = toDateVal.toString();
    }
    
    if (!this.fromDate || !this.toDate) {
      alert('Please select From Date and To Date');
      return;
    }
    
    this.currentPage = page;
    this.loading = true;
    this.errorMessage = '';
    this.devices = [];
    
    const request = {
      param1: this.fromDate,
      param2: this.toDate,
      param3: this.currentPage.toString(),
      param4: this.pageSize.toString()
    };
    
    this.deviceService.getReceiptGeneratedDevices(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.devices = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
        } else {
          this.errorMessage = typeof response?.entity === 'string' ? response.entity : 'Failed to load receipt generated devices';
          this.devices = [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error loading receipt generated devices. Please try again.';
        this.devices = [];
        console.error('Error loading receipt generated devices:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  sort(column: string) {
    if (this.sortKey === column) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = column;
      this.reverse = false;
    }
  }
  
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = 8;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }
  
  getPaginatedData(): any[] {
    return this.devices;
  }
  
  onPageChange(page: number) {
    this.currentPage = page;
    this.getdatewiseactivated(this.currentPage);
  }
  
  getSearchDetails() {
    this.currentPage = 1;
    this.getdatewiseactivated(this.currentPage);
  }
  
  toString(value: any): string {
    return value != null ? String(value) : '';
  }
}

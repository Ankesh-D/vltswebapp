import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeviceService, Device } from '../../../core/services/device.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-current-day-installation',
    imports: [CommonModule, FormsModule, RouterModule, LoadingComponent, ErrorMessageComponent, CommonTableComponent],
    templateUrl: './current-day-installation.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./current-day-installation.component.scss']
})
export class CurrentDayInstallationComponent implements OnInit {
  devices: any[] = [];
  loading = false;
  
  toString(value: any): string {
    return value != null ? String(value) : '';
  }
  errorMessage = '';
  searchText = '';
  
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  
  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#', value: device => device.param1 ? this.toString(device.param1) : 'NA' },
    { key: 'param12', label: 'Vehicle No.', sortable: true, value: device => device.param12 && this.toString(device.param12).length > 0 ? device.param12 : 'NA' },
    { key: 'serial', headers: ['Serial No.', 'IMEI No.'], sortable: true, sortKey: 'param5' },
    { key: 'param6', label: 'ICCID No.', sortable: true, value: device => device.param6 && this.toString(device.param6).length > 0 ? device.param6 : 'NA' },
    { key: 'param18', label: 'RTO Name', sortable: true, value: device => device.param18 && this.toString(device.param18).length > 0 ? device.param18 : 'NA' },
    { key: 'customer', headers: ['Customer Name', 'Mobile No.'], sortable: true, sortKey: 'param8' },
    { key: 'installation', headers: ['Installation Date', 'Time'], sortable: true, sortKey: 'param28' },
    { key: 'param25', label: 'Activation Status', sortable: true, cellClass: 'font-weight-bold', value: device => device.param25 === 'Pending OTP' ? 'Pending' : device.param25 || 'NA' }
  ];
  
  constructor(
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.currentdayinstallation(1);
  }
  
  currentdayinstallation(page: number = 1) {
    this.currentPage = page;
    this.loading = true;
    this.errorMessage = '';
    this.devices = [];
    
    const request = {
      param1: this.searchText.trim(),
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString()
    };
    
    this.deviceService.getCurrentDayInstallation(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.devices = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
        } else {
          this.errorMessage = typeof response?.entity === 'string' ? response.entity : 'Failed to load current day installation';
          this.devices = [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error loading current day installation. Please try again.';
        this.devices = [];
        console.error('Error loading current day installation:', error);
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
}

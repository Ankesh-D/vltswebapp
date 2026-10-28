import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

declare var jAlert: any;

@Component({
    selector: 'app-bulk-activation-logs',
    imports: [FormsModule, RouterModule, CommonTableComponent],
    templateUrl: './bulk-activation-logs.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./bulk-activation-logs.component.scss']
})
export class BulkActivationLogsComponent implements OnInit {
  // Report data
  logData: any[] = [];
  loading = false;
  errorMessage = '';
  
  // Search and pagination
  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;
  
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'index', header: '#', sortable: true, sortKey: 'param1' },
    { key: 'param2', header: 'File Name', sortable: true },
    { key: 'param3', header: 'Upload Date', sortable: true },
    { key: 'param4', header: 'Total Records', sortable: true },
    { key: 'param5', header: 'Success', sortable: true },
    { key: 'param6', header: 'Failed', sortable: true },
    { key: 'param7', header: 'Status', sortable: true },
    { key: 'actions', header: 'Actions' }
  ];

  constructor(
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.getBulkActivationLogs(1);
  }

  getBulkActivationLogs(pageNo: number) {
    this.loading = true;
    this.currentPage = pageNo;
    
    const request = {
      param1: this.searchText.trim(),
      param2: pageNo.toString(),
      param3: this.pageSize === this.totalCount ? 'All' : this.pageSize.toString()
    };
    
    this.deviceService.getBulkActivationLogs(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          if (response.entity === 'No Data Found' || !response.entity) {
            this.logData = [];
            this.totalCount = 0;
            this.pageCount = 0;
          } else if (response.entity && response.entity.listData) {
            this.logData = response.entity.listData;
            this.totalCount = response.entity.param1 || 0;
            this.pageCount = this.logData.length < this.pageSize ? this.logData.length : this.pageSize;
          }
        } else {
          this.logData = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error loading logs';
        console.error('Error loading bulk activation logs:', error);
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.getBulkActivationLogs(1);
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.getBulkActivationLogs(1);
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    
    this.logData.sort((a, b) => {
      const aVal = (a as any)[key] || '';
      const bVal = (b as any)[key] || '';
      
      if (this.reverse) {
        return bVal.localeCompare(aVal);
      } else {
        return aVal.localeCompare(bVal);
      }
    });
  }

  onPageChange(page: number) {
    this.getBulkActivationLogs(page);
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newSize = target.value;
    this.pageSize = newSize === 'All' ? this.totalCount : parseInt(newSize);
    this.currentPage = 1;
    this.getBulkActivationLogs(1);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = Math.min(totalPages, 8);
    for (let i = 1; i <= maxPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  viewDetails(log: any) {
    // Navigate to detailed view or show modal
    //console.log('View details for log:', log);
    // TODO: Implement detailed view
  }
}

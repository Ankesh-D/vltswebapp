import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertService, Alert, AlertRequest } from '../../../core/services/alert.service';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonPaginationComponent } from '../../../shared/components/common-pagination/common-pagination.component';
import { CommonTableComponent, CommonTableColumn } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-alert-list',
    imports: [
      CommonModule,
      FormsModule,
      RouterModule,
      CommonDataToolbarComponent,
      CommonPaginationComponent,
      CommonTableComponent
    ],
    templateUrl: './alert-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./alert-list.component.scss']
})
export class AlertListComponent implements OnInit {
  alerts: Alert[] = [];
  readonly tableColumns: CommonTableColumn<Alert>[] = [
    { key: 'param1', header: '#' },
    { key: 'param11', header: 'Vehicle/Chassis No.', sortable: true },
    { key: 'param5', header: 'Event Time', sortable: true },
    { key: 'param4', header: 'Alert Type', sortable: true },
    { key: 'param12', header: 'Vendor', sortable: true },
    { key: 'param18', header: 'RTO', sortable: true },
    { key: 'param28', header: 'Customer Details', sortable: true }
  ];
  loading = false;
  errorMessage = '';
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20];
  totalCount = 0;
  pageCount = 0;
  
  // Route parameters
  type: string = '';   // Alert type filter
  date: string = '';    // Date filter
  
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  
  constructor(
    private alertService: AlertService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Get route parameters
    this.route.params.subscribe(params => {
      this.type = params['type'] || '0';
      this.date = params['date'] || '0';
      
      // Reload alerts with new params
      this.loadAlerts();
    });
  }

  loadAlerts() {
    this.loading = true;
    this.errorMessage = '';
    this.alerts = [];

    const request: AlertRequest = {
      param1: this.searchText.trim(),
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString(),
      param4: this.type !== '0' ? this.type : '',
      param5: this.date !== '0' ? this.date : ''
    };

    //console.log('Loading alerts with request:', request);

    this.alertService.getTodaysAlerts(request).subscribe({
      next: (response) => {
        this.loading = false;
        // console.log('Alert API Response:', {
        //   status: response?.status,
        //   hasEntity: !!response?.entity,
        //   listDataLength: response?.entity?.listData?.length,
        //   totalCount: response?.entity?.param1
        // });

        if (response?.status && response?.entity) {
          if (Object.keys(response.entity).length === 0) {
            this.alerts = [];
            if (this.currentPage === 1) {
              this.totalCount = 0;
              this.pageCount = 0;
            }
          } else if (response.entity.listData !== undefined) {
            this.alerts = response.entity.listData || [];
            if (response.entity.param1 !== undefined && response.entity.param1 !== null) {
              this.totalCount = response.entity.param1 || 0;
            }
          } else if (Array.isArray(response.entity)) {
            this.alerts = response.entity;
            this.totalCount = response.entity.length;
          } else {
            this.alerts = [];
          }

          this.pageCount = this.alerts.length < this.pageSize ? this.alerts.length : this.pageSize;
          this.updatePageSizeOptions();
          this.cdr.detectChanges();
        } else {
          const errorMsg = typeof response?.entity === 'string'
            ? response.entity
            : 'Failed to load alerts';
          this.errorMessage = errorMsg;
          this.alerts = [];
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error loading alerts. Please try again.';
        this.alerts = [];
        console.error('Error loading alerts:', error);
        this.cdr.detectChanges();
      }
    });
  }

  updatePageSizeOptions() {
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 0) options.push(this.totalCount);
    this.pageSizeOptions = options;
  }

  onPageSizeChange(size: number | string) {
    if (size === 'All' || size === this.totalCount) {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }
    this.currentPage = 1;
    this.loadAlerts();
  }

  onPageChange(page: number) {
    if (page < 1) return;
    const totalPages = this.getTotalPages();
    if (this.totalCount > 0 && page > totalPages) return;
    this.currentPage = page;
    this.loadAlerts();
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.loadAlerts();
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.loadAlerts();
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    this.cdr.detectChanges();
  }

  goHome() {
    this.router.navigate(['/dashboard']);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const total = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = 8;
    
    if (total <= maxPages) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(total);
      } else if (this.currentPage >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(total);
      }
    }
    return pages;
  }

  shouldShowPage(page: number): boolean {
    return page !== -1;
  }
}

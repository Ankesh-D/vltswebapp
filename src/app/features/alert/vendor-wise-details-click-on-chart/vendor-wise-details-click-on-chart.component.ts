import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DeviceService, Device,  AssetsDetailsRequest } from '../../../core/services/device.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-vendor-wise-details-click-on-chart',
    imports: [CommonModule, FormsModule, RouterModule, CommonTableComponent],
    templateUrl: './vendor-wise-details-click-on-chart.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vendor-wise-details-click-on-chart.component.scss'
})
export class VendorWiseDetailsClickOnChartComponent implements OnInit {
  devices: Device[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'index', label: '#', width: '35px' },
    { key: 'vehicle', headers: ['Chassis No.', 'Vehicle No.'], sortable: true, sortKey: 'param5' },
    { key: 'engine', label: 'Engine No', sortable: true, sortKey: 'param7' },
    { key: 'device', headers: ['Serial No.', 'IMEI No.', 'ICCID No.'], sortable: true, sortKey: 'param8' },
    { key: 'vehicleType', headers: ['Vehicle Type', 'Vehicle Class'], sortable: true, sortKey: 'param9' },
    { key: 'make', headers: ['Make', 'Model'], sortable: true, sortKey: 'param50', width: '97px' },
    { key: 'installationDate', label: 'Installation Date', sortable: true, sortKey: 'param16', width: '95px' },
    { key: 'customer', label: 'Customer Details', sortable: true, sortKey: 'param47' },
    { key: 'dealer', headers: ['Dealer', '(Vendor)'], sortable: true, sortKey: 'param34' },
    { key: 'rto', label: 'RTO Name', sortable: true, sortKey: 'param18' },
    { key: 'activation', label: 'Activation Status', sortable: true, sortKey: 'param25' },
    { key: 'polling', label: 'Polling Status', sortable: true, sortKey: 'param45' }
  ];
  loading = false;
  errorMessage = '';
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20];
  totalCount = 0;
  pageCount = 0;
    roleId: string = '';
  // Route parameters
  filter: string = '';  // Filter type (TotalDevice, Activated, Pending, etc.)
  vendor: string = '';  // Vendor ID (encrypted)
  rto: string = '';     // RTO ID (encrypted)
  
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  
  // Filter type display
  filterType: string = 'Total Device';
  
  constructor(
    private toast: ToastService,
    private deviceService: DeviceService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleId') || '';
    // Get route parameters
    this.route.params.subscribe(params => {
      this.filter = params['filter'] || 'TotalDevice';
      this.vendor = params['vendor'] || '0';
      this.rto = params['rto'] || '0';
      
      // Map filter to display name
      this.mapFilterToDisplayName();
      
      // Reload devices with new params
      this.loadDevices();
    });
    
  }
  redirectInsert() {
    this.router.navigate(['device/entry']);
  }

  mapFilterToDisplayName() {
    if (this.filter === 'TotalDevice' || this.filter === 'Total Device' || this.filter === 'TOTAL DEVICE') {
      this.filterType = 'Total Device';
    } else if (this.filter === 'ACTIVATED') {
      this.filterType = 'Activated';
    } else if (this.filter === 'PENDING') {
      this.filterType = 'Pending';
    } else if (this.filter === 'TODAYINSTALLED' || this.filter === 'Installed') {
      this.filterType = 'Today\'s Installation';
    } else if (this.filter === 'NeverReceived') {
      this.filterType = 'Never Received';
    } else if (this.filter === 'NotReceived') {
      this.filterType = 'Not Received';
    } else {
      this.filterType = this.filter;
    }
  }

  loadDevices() {
    this.loading = true;
    this.errorMessage = '';
    this.devices = [];

    // Normalize filter value - pass it directly to API as original JSP does
    // The original passes $routeParams.filter directly to param2
    let filterValue = this.filter;
    if (filterValue === 'Total') {
      filterValue = 'TotalDevice';
    }
    // Backend API doesn't seem to recognize "Installed" as a valid filter
    // Map "Installed" to "TotalDevice" since installed devices = all devices that have been installed
    // This is a workaround for backend API limitation
    if (filterValue === 'Installed') {
      // console.warn('⚠️ Backend API does not support "Installed" filter. Mapping to "TotalDevice" as workaround.');
      filterValue = 'TotalDevice';
    }

  const request: AssetsDetailsRequest = {
  param1: this.searchText,
  param2: this.currentPage,
  param3: this.pageSize,
  param4: filterValue,
  param5: this.vendor !== '0' ? this.vendor : '',
  param6: this.rto !== '0' ? this.rto : '',
  param7: this.vendor !== '0' ? this.vendor : '',
};

    // console.log('Loading devices with request:', {
    //   ...request,
    //   filterValue: filterValue,
    //   originalFilter: this.filter
    // });

    this.deviceService.getAssetsDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        const statuscode = (response as any)?.statuscode;
        // console.log('Device API Response (Full):', JSON.stringify(response, null, 2));
        // console.log('Device API Response (Summary):', {
        //   status: response?.status,
        //   statuscode: statuscode,
        //   hasEntity: !!response?.entity,
        //   listDataLength: response?.entity?.listData?.length,
        //   totalCount: response?.entity?.param1,
        //   currentPage: this.currentPage,
        //   pageSize: this.pageSize,
        //   filter: this.filter,
        //   filterValue: filterValue,
        //   entityKeys: response?.entity ? Object.keys(response.entity) : [],
        //   isEmptyEntity: response?.entity ? Object.keys(response.entity).length === 0 : true
        // });

        // Log warning if filter is "Installed" but returns empty
        if (this.filter === 'Installed' && String(response?.entity?.param1) === '0') {
          // console.warn('⚠️ API returned 0 records for "Installed" filter. This might indicate:');
          // console.warn('1. Backend API does not recognize "Installed" as a valid filter value');
          // console.warn('2. Backend query needs to be checked/fixed');
          // console.warn('3. The filter value might need to be converted (e.g., "TotalDevice" or "TODAYINSTALLED")');
        }

        // Check statuscode==200 like original JSP controller does
        if ((response?.status && statuscode === 200) || (response?.status && !statuscode)) {
          if (Object.keys(response.entity).length === 0) {
            this.devices = [];
            if (this.currentPage === 1) {
              this.totalCount = 0;
              this.pageCount = 0;
            }
          } else if (response.entity.listData !== undefined) {
            this.devices = response.entity.listData || [];
            // Parse totalCount - it might be string or number
            if (response.entity.param1 !== undefined && response.entity.param1 !== null) {
              const totalCountValue = Number(response.entity.param1) || 0;
              if (this.totalCount !== totalCountValue) {
                // console.log(`Total count updated: ${this.totalCount} -> ${totalCountValue}`);
              }
              this.totalCount = totalCountValue;
            }
          } else if (Array.isArray(response.entity)) {
            this.devices = response.entity;
            this.totalCount = response.entity.length;
          } else {
            this.devices = [];
          }

          this.pageCount = this.devices.length < this.pageSize ? this.devices.length : this.pageSize;
          this.updatePageSizeOptions();
          this.cdr.detectChanges();
        } else {
          const errorMsg = typeof response?.entity === 'string'
            ? response.entity
            : 'Failed to load devices';
          this.errorMessage = errorMsg;
          this.devices = [];
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error loading devices. Please try again.';
        this.devices = [];
        console.error('Error loading devices:', error);
        this.cdr.detectChanges();
      }
    });
  }

  getStatus(status: any): string {
  return status ? status.toString().trim().toLowerCase() : '';
}

isConnected(status: any): boolean {
  if (!status) return false;

  return status.toString().trim().toLowerCase() === 'connected';
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
    this.loadDevices();
  }

  onPageChange(page: number) {
    if (page < 1) return;
    const totalPages = this.getTotalPages();
    if (this.totalCount > 0 && page > totalPages) return;
    this.currentPage = page;
    this.loadDevices();
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.loadDevices();
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.loadDevices();
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

  goToAdminDashboard() {
    this.router.navigate(['/AdminDashboard']);
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

  // Helper method to convert value to string for template usage
  toString(value: any): string {
    return value ? String(value) : '';
  }

  // Helper method to check if string has length
  hasLength(value: any): boolean {
    return value && String(value).length > 0;
  }

  printReceipt(d: any) {
    let request  = {
      param1: d.param19,
      param10: "pdf"
    }
    this.deviceService.getReceiptGeneratedDevices1(request).subscribe({
      next: (response: any) => {
        if( response.statuscode == 200) {
          let  receiptUrl: string = response.entity;
          if (receiptUrl) {
            window.open(receiptUrl, '_blank');
          }
          
        }

      },
      error: (error) => {
        console.error('Error generating receipt:', error);
  this.toast.show('Error generating receipt. Please try again.', 'error');

      }
    });

  }
}

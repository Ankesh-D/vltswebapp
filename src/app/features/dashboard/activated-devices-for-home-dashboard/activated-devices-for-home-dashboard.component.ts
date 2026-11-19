import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DeviceService, Device, DeviceRequest } from '../../../core/services/device.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-activated-devices-for-home-dashboard',
    imports: [CommonModule, RouterModule, CommonDataToolbarComponent, DataTableComponent, PaginationComponent],
    templateUrl: './activated-devices-for-home-dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './activated-devices-for-home-dashboard.component.scss'
})
export class ActivatedDevicesForHomeDashboardComponent  implements OnInit {
  devices: Device[] = [];
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
  readonly tableColumns: DataTableColumn<Device>[] = [
    { header: '#', key: 'param1' },
    {
      headers: ['IMEI No.', 'Serial No.'],
      sortKey: 'param5',
      cellClassName: 'multiline-cell',
      value: device => this.joinValues(device.param5, device.param6)
    },
    {
      headers: ['ICCID No.', 'M2M Code'],
      sortKey: 'param7',
      cellClassName: 'multiline-cell',
      value: device => this.joinValues(device.param7, device.param14)
    },
    {
      headers: ['Mobile N/W 1', 'Mobile N/W 2'],
      sortKey: 'param8',
      cellClassName: 'multiline-cell',
      value: device => this.joinValues(device.param10, device.param11)
    },
    {
      headers: ['Mobile No. 1', 'Mobile No. 2'],
      sortKey: 'param9',
      cellClassName: 'multiline-cell',
      value: device => this.joinValues(device.param8, device.param9)
    },
    {
      headers: ['Mobile No. 1 Validity', 'Mobile No. 2 Validity'],
      sortKey: 'param50',
      width: '130px',
      cellClassName: 'multiline-cell',
      value: device => this.joinValues(device.param50, device.param51)
    },
    {
      headers: ['Dealer', 'Vendor'],
      sortKey: 'param16',
      width: '160px',
      cellClassName: 'multiline-cell',
      value: device => this.joinValues(device.param15, device.param16)
    },
    {
      header: 'Vehicle Status',
      sortKey: 'param47',
      cellClassName: 'multiline-cell',
      value: device => this.joinValues(device.param47, device.param20 || '')
    },
    {
      header: 'Activation Status',
      sortKey: 'param34',
      cellClassName: 'multiline-cell',
      value: device => `${device.param34 || 'NA'}\n${device.param34 === 'Activated' ? device.param54 || '-' : '-'}`
    },
    {
      header: 'Polling Status',
      sortKey: 'param48',
      cellClassName: 'multiline-cell',
      value: device => this.joinValues(device.param48, device.param60)
    }
  ];
  
  constructor(
    private toast: ToastService,
    private deviceService: DeviceService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.toast.pageName = 'Activated Devices'; // Set page name for toast service
  }

  private joinValues(...values: string[]): string {
    return values.map(value => value || 'NA').join('\n');
  }

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

    const request: DeviceRequest = {
      param1: this.searchText.trim(),
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString(),
      param10: filterValue,
      param8: this.vendor !== '0' ? this.vendor : '',
      param9: this.rto !== '0' ? this.rto : '',
      pdfexcel: ""
    };

    //console.log('Loading devices with request:', {
    //   ...request,
    //   filterValue: filterValue,
    //   originalFilter: this.filter
    // });

    this.deviceService.getDeviceDetailsByType(request).subscribe({
      next: (response) => {
        this.loading = false;
        const statuscode = (response as any)?.statuscode;
        // //console.log('Device API Response (Full):', JSON.stringify(response, null, 2));
        // //console.log('Device API Response (Summary):', 
        //   {
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
        if ((statuscode === 200)) {
          this.devices = response.entity.listData || [];
          const totalCountValue = Number(response.entity.param1) || 0;
          this.totalCount = totalCountValue;
           this.pageCount = this.devices.length < this.pageSize ? this.devices.length : this.pageSize;
          this.updatePageSizeOptions();
          this.cdr.detectChanges();
          // if (Object.keys(response.entity).length === 0) {
          //   this.devices = [];
          //   if (this.currentPage === 1) {
          //     this.totalCount = 0;
          //     this.pageCount = 0;
          //   }
          // } else if (response.entity.listData !== undefined) {
          //   // Parse totalCount - it might be string or number
          //   if (response.entity.param1 !== undefined && response.entity.param1 !== null) {
          //     if (this.totalCount !== totalCountValue) {
          //       // //console.log(`Total count updated: ${this.totalCount} -> ${totalCountValue}`);
          //     }
          //   }
          // } else if (Array.isArray(response.entity)) {
          //   this.devices = response.entity;
          //   this.totalCount = response.entity.length;
          // } else {
          //   this.devices = [];
          //   this.totalCount = 0;
          //   this.pageCount = 0;
          // }

         
        } else {
          this.totalCount = 0;
          this.pageCount = 0;
          this.devices = [];
          const errorMsg = typeof response?.entity === 'string'
            ? response.entity
            : 'Failed to load devices';
          this.errorMessage = errorMsg;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error loading devices. Please try again.';
        this.devices = [];
        // console.error('Error loading devices:', error);
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
    if (this.totalCount > 0 && this.totalCount < 100) options.push(this.totalCount);
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

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
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
        // console.error('Error generating receipt:', error);
  this.toast.show('Error generating receipt. Please try again.', 'error');

      }
    });

  }

  goToAdminDashboard() {
    this.router.navigate(['/AdminDashboard']);
  }
}

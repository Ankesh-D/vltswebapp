import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DeviceService, Device, DeviceRequest } from '../../../core/services/device.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonPaginationComponent } from '../../../shared/components/common-pagination/common-pagination.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
@Component({
    selector: 'app-device-list',
    imports: [CommonModule, RouterModule, CommonDataToolbarComponent,
      CommonPaginationComponent, CommonTableComponent],
    templateUrl: './device-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./device-list.component.scss']
})
export class DeviceListComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private removeUx4gStyles?: () => void;
  private removeUx4gErrorListener?: () => void;

  devices: Device[] = [];
  loading = false;
  errorMessage = '';
  ux4gStylesError = '';
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20];
  totalCount = 0;
  pageCount = 0;
    roleId: any = '';
  // Route parameters
  filter: string = '';  // Filter type (TotalDevice, Activated, Pending, etc.)
  vendor: string = '';  // Vendor ID (encrypted)
  rto: string = '';     // RTO ID (encrypted)
  
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'index', label: '#', width: '3%' },
    { key: 'param5', label: 'IMEI No./Serial No.', sortable: true, width: '12%', cellClass: 'ux4g-table-cell-text' },
    { key: 'param7', label: 'ICCID No./M2M Code', sortable: true, width: '10%', cellClass: 'ux4g-table-cell-text' },
    { key: 'param8', label: 'Mobile N/W 1/Mobile N/W 2', sortable: true, width: '7%', cellClass: 'ux4g-table-cell-text' },
    { key: 'param9', label: 'Mobile No. 1/Mobile No. 2', sortable: true, width: '8%' },
    { key: 'param50', label: 'Mobile No. 1 Validity/Mobile No. 2 Validity', sortable: true, width: '10%' },
    { key: 'param16', label: 'Dealer/Vendor', sortable: true, width: '10%', cellClass: 'ux4g-table-cell-text' },
    { key: 'param47', label: 'Vehicle Status', sortable: true, width: '10%' },
    { key: 'param54', label: 'Installation Date', width: '8%' },
    { key: 'param34', label: 'Activation Status', sortable: true, width: '11%' },
    { key: 'param48', label: 'Polling Status', sortable: true, width: '11%' }
  ];
  
  // Filter type display
  filterType: string = 'Total Device';
  
  constructor(
    private toast: ToastService,
    private deviceService: DeviceService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.toast.pageName = 'Device Master Details'; // Set page name for toast service
  }

  ngOnInit() {
    this.loadUx4gStyles();
    this.roleId = sessionStorage.getItem('roleid');
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

  ngOnDestroy() {
    this.removeUx4gErrorListener?.();
    this.removeUx4gStyles?.();
  }

  private loadUx4gStyles() {
    const stylesheet = this.renderer.createElement('link') as HTMLLinkElement;
    this.renderer.setAttribute(stylesheet, 'rel', 'stylesheet');
    this.renderer.setAttribute(
      stylesheet,
      'href',
      new URL('assets/ux4g/ux4g.css', this.document.baseURI).href
    );
    this.removeUx4gErrorListener = this.renderer.listen(stylesheet, 'error', () => {
      this.ux4gStylesError = 'UX4G styles could not be loaded. Refresh this page to try again.';
      this.cdr.detectChanges();
    });
    this.renderer.appendChild(this.document.head, stylesheet);
    this.removeUx4gStyles = () => this.renderer.removeChild(this.document.head, stylesheet);
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
      param2: this.currentPage.toString() ,// Pass filter directly as original does
      param3:this.pageSize.toString(),
      param10:filterValue,
      param8: this.vendor !== '0' ? this.vendor : '',
      param9: this.rto !== '0' ? this.rto : '',
      pdfexcel: ""


    };

    // //console.log('Loading devices with request:', {
    //   ...request,
    //   filterValue: filterValue,
    //   originalFilter: this.filter
    // });

    this.deviceService.getDeviceDetailsByType(request).subscribe({
      next: (response) => {
        this.loading = false;
        const statuscode = (response as any)?.statuscode;
       

        // Log warning if filter is "Installed" but returns empty
        if (this.filter === 'Installed' && String(response?.entity?.param1) === '0') {
          // console.warn('⚠️ API returned 0 records for "Installed" filter. This might indicate:');
          // console.warn('1. Backend API does not recognize "Installed" as a valid filter value');
          // console.warn('2. Backend query needs to be checked/fixed');
          // console.warn('3. The filter value might need to be converted (e.g., "TotalDevice" or "TODAYINSTALLED")');
        }

        // Check statuscode==200 like original JSP controller does
        if ((response?.status && statuscode === 200)) {
          // if (Object.keys(response.entity).length === 0) {
          //   this.devices = [];
          //   if (this.currentPage === 1) {
          //     this.totalCount = 0;
          //     this.pageCount = 0;
          //   }
          // } else if (response.entity.listData !== undefined) {
            this.devices = response.entity.listData || [];
            // Parse totalCount - it might be string or number
            if (response.entity.param1 !== undefined && response.entity.param1 !== null) {
              const totalCountValue = Number(response.entity.param1) || 0;
              if (this.totalCount !== totalCountValue) {
                // //console.log(`Total count updated: ${this.totalCount} -> ${totalCountValue}`);
              }
              this.totalCount = totalCountValue;
            }
          // } else if (Array.isArray(response.entity)) {
          //   this.devices = response.entity;
          //   this.totalCount = response.entity.length;
          // } 
          else {
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
          this.totalCount = 0;
          this.pageCount = 0;
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
    if (this.totalCount > 0 && this.totalCount < 100) options.push(this.totalCount); // 'All'
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
        // console.error('Error generating receipt:', error);
  this.toast.show('Error generating receipt. Please try again.', 'error');

      }
    });

  }
}

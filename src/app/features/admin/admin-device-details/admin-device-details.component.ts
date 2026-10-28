import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-admin-device-details',
    imports: [CommonModule, FormsModule, RouterModule, CommonTableComponent],
    templateUrl: './admin-device-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./admin-device-details.component.scss']
})
export class AdminDeviceDetailsComponent implements OnInit, AfterViewInit {
  deviceDetails: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#' },
    { key: 'param11', label: 'Vehicle/Chassis No.', sortable: true },
    { key: 'param5', headers: ['Serial No.', 'IMEI No.'], sortable: true },
    { key: 'param6', headers: ['ICCID No.', 'M2M Code'], sortable: true },
    { key: 'param18', label: 'RTO Name', sortable: true },
    { key: 'param28', label: 'Customer Details', sortable: true, width: '145px' },
    { key: 'param8', label: 'Dealer', sortable: true, width: '160px' },
    { key: 'param43', label: 'Installation Date', sortable: true },
    { key: 'param19', label: 'Vehicle Type', sortable: true },
    { key: 'param26', label: 'Activation Status' }
  ];
  loading = false;

  filterType: string = '';
  vendor: string = '';
  rto: string = '';

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;

  roleId: string = '';

  constructor(
    private vehicleService: VehicleService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleId') || '';
    this.route.params.subscribe(params => {
      this.filterType = params['filter'] || '';
      this.vendor = params['vendor'] === '0' ? '' : (params['vendor'] || '');
      this.rto = params['rto'] === '0' ? '' : (params['rto'] || '');

      // Map filter type
      if (this.filterType === 'Total Device' || this.filterType === 'TOTAL DEVICE') {
        this.filterType = 'TotalDevice';
      }

      this.getDeviceDetails();
    });
  }

  ngAfterViewInit() {
    // Component initialization
  }

  getDeviceDetails() {
    this.loading = true;
    const request = {
      param1: this.searchText,
      param2: this.filterType,
      param3: String(this.currentPage),
      param4: String(this.pageSize),
      param9: this.vendor,
      param10: this.rto
    };

    this.vehicleService.getVehicleDetailsByType(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceDetails = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.deviceDetails.length;
        } else {
          this.deviceDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.deviceDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        console.error('Error fetching device details:', error);
        jAlert('Error fetching device details.');
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getDeviceDetails();
  }

  reloadData() {
    this.searchText = '';
    this.getDeviceDetails();
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.deviceDetails.sort((a, b) => {
      const valA = (a as any)[key];
      const valB = (b as any)[key];
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return this.reverse ? comparison * -1 : comparison;
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.getDeviceDetails();
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.getDeviceDetails();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  }

  getDisplayFilterType(): string {
    if (this.filterType === 'TotalDevice' || this.filterType === 'Total Device' || this.filterType === 'TOTAL DEVICE') {
      return 'Total';
    } else if (this.filterType === 'ACTIVATED') {
      return 'Activated';
    } else if (this.filterType === 'PENDING') {
      return 'Pending';
    } else if (this.filterType === 'TODAYINSTALLED') {
      return "Today's Installation";
    } else if (this.filterType === 'NeverReceived') {
      return 'Never Received';
    } else if (this.filterType === 'NotReceived') {
      return 'Not Received';
    }
    return this.filterType;
  }
}

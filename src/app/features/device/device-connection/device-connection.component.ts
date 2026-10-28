import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-device-connection',
    imports: [CommonModule, FormsModule, RouterModule, CommonTableComponent],
    templateUrl: './device-connection.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./device-connection.component.scss']
})
export class DeviceConnectionComponent implements OnInit, AfterViewInit {
  deviceDetails: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#' },
    { key: 'param5', headers: ['IMEI No.', 'Serial No.'], sortable: true },
    { key: 'param7', headers: ['ICCID No.', 'M2M Code'], sortable: true },
    { key: 'param8', headers: ['Mobile N/W 1', 'Mobile N/W 2'], sortable: true },
    { key: 'param9', headers: ['Mobile No. 1', 'Mobile No. 2'], sortable: true },
    { key: 'param48', label: 'Connection Status', sortable: true },
    { key: 'param60', label: 'Last Update', sortable: true }
  ];
  loading = false;

  searchText: string = '';
  selectedVendor: string = '';
  selectedDevice: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;

  // Dropdowns
  vendorList: any[] = [];
  deviceList: any[] = [];

  roleId: string = '';

  constructor(
    private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleId') || '';
    this.loadVendorList();
    this.getDeviceConnection(1);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
        $('#vendorselector').on('change', (e: any) => {
          this.selectedVendor = e.target.value;
          this.onVendorChange();
        });
        $('#deviceselector').on('change', (e: any) => {
          this.selectedDevice = e.target.value;
        });
      }
    }, 200);
  }

  loadVendorList() {
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vendorList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading vendor list:', error);
      }
    });
  }

  onVendorChange() {
    this.selectedDevice = '';
    this.deviceList = [];
    if (this.selectedVendor) {
      const encryptedVendorId = this.encryptionService.encryptAccountId(this.selectedVendor);
      const roleId = this.encryptionService.encryptAccountId('11'); // Vendor role
      this.deviceService.getRawDataDeviceRoster(encryptedVendorId, roleId).subscribe({
        next: (response) => {
          if (response.status && response.entity) {
            this.deviceList = response.entity;
          }
        },
        error: (error) => {
          console.error('Error loading device list:', error);
        }
      });
    }
    this.cdr.detectChanges();
  }

  getDeviceConnection(pageNumber: number) {
    this.loading = true;
    this.currentPage = pageNumber;

    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      param4: this.selectedVendor || '',
      param5: this.selectedDevice || ''
    };

    this.deviceService.getDeviceConnection(request).subscribe({
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
          jAlert('No Data Found: ' + response.entity);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.deviceDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        console.error('Error fetching device connection:', error);
        jAlert('Error fetching device connection.');
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getDeviceConnection(1);
  }

  reloadData() {
    this.searchText = '';
    this.selectedVendor = '';
    this.selectedDevice = '';
    this.deviceList = [];
    this.getDeviceConnection(1);
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
    this.getDeviceConnection(this.currentPage);
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.getDeviceConnection(this.currentPage);
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

  getPaginatedData(): any[] {
    return this.deviceDetails;
  }
}

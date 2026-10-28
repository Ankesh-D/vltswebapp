import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceService } from '../../../core/services/device.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-device-login',
    imports: [CommonModule, FormsModule, CommonTableComponent],
    templateUrl: './device-login.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./device-login.component.scss']
})
export class DeviceLoginComponent implements OnInit, AfterViewInit {
  deviceDataList: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#' },
    { key: 'param3', label: 'Vehicle No.', sortable: true },
    { key: 'param2', label: 'IMEI No.', sortable: true },
    { key: 'param6', label: 'Firmware Version', sortable: true },
    { key: 'param13', label: 'Login Date Time', sortable: true },
    { key: 'param11', label: 'Latitude', sortable: true },
    { key: 'param8', label: 'Latitude Direction', sortable: true },
    { key: 'param10', label: 'Longitude', sortable: true },
    { key: 'param9', label: 'Longitude Direction', sortable: true },
    { key: 'param18', label: 'Device IP', sortable: true },
    { key: 'param14', label: 'Raw String', sortable: true, cellStyle: { 'max-width': '200px', 'overflow-wrap': 'anywhere' } }
  ];
  loading = false;

  selectedVendor: string = '';
  selectedIMEI: string = '';
  selectedDate: string = '';
  searchText: string = '';

  vendorList: any[] = [];
  imeiList: any[] = [];

  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;

  constructor(
    private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {
    this.toast.pageName = 'Device Login Check';
  }

  ngOnInit() {
    this.loadVendors();
    this.initializeDatePicker();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
        $('#vendorselector').on('change', (e: any) => {
          this.selectedVendor = e.target.value;
          this.onVendorChange();
        });
        $('#imeino').on('change', (e: any) => {
          this.selectedIMEI = e.target.value;
        });
      }
    }, 200);
  }

  initializeDatePicker() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.datepicker) {
        $('#daterawdata').datepicker({
          format: 'dd-M-yyyy',
          endDate: '+0d',
          autoclose: true
        }).on('changeDate', (e: any) => {
          this.selectedDate = this.formatDate(e.date);
        });
        $('#daterawdata').datepicker('setDate', '+0d');
        const today = new Date();
        this.selectedDate = this.formatDate(today);
      }
    }, 100);
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  loadVendors() {
    this.deviceService.getPortAssignToVendorRoster().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vendorList = response.entity;
          if (this.vendorList.length === 1) {
            this.selectedVendor = this.vendorList[0].param3;
            this.onVendorChange();
          }
        }
      }
    });
  }

  onVendorChange() {
    this.imeiList = [];
    this.selectedIMEI = '';
    if (this.selectedVendor) {
      const encryptedVendorId = this.encryptionService.encryptAccountId(this.selectedVendor);
      const roleId = this.encryptionService.encryptAccountId('11');
      this.deviceService.getRawDataDeviceRoster(encryptedVendorId, roleId).subscribe({
        next: (response) => {
          if (response.status && response.entity) {
            this.imeiList = response.entity;
          }
          this.cdr.detectChanges();
          setTimeout(() => {
            if (typeof $ !== 'undefined' && $.fn.select2) {
              $('#imeino').select2();
            }
          }, 100);
        }
      });
    }
  }

  getLoginCheck() {
    if (!this.selectedVendor) {
      jAlert('Please select Vendor.');
      return;
    }
    if (!this.selectedDate) {
      jAlert('Please select Date.');
      return;
    }

    this.loading = true;
    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      param4: this.selectedVendor,
      param5: this.selectedDate,
      param6: this.selectedIMEI || ''
    };

    this.deviceService.getDeviceLoginCheck(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceDataList = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.deviceDataList.length;
        } else {
          this.deviceDataList = [];
          this.totalCount = 0;
          this.pageCount = 0;
          jAlert('No Data Found: ' + response.entity);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.deviceDataList = [];
        this.totalCount = 0;
        this.pageCount = 0;
        console.error('Error fetching device login:', error);
        jAlert('Error fetching device login.');
        this.cdr.detectChanges();
      }
    });
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.deviceDataList.sort((a, b) => {
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
    this.getLoginCheck();
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
}

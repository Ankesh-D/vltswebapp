import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceService } from '../../../core/services/device.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastService } from '../../../core/services/toast.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;


@Component({
    selector: 'app-device-health',
    imports: [CommonModule, FormsModule, NgSelectModule, CommonTableComponent],
    templateUrl: './device-health.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./device-health.component.scss']
})
export class DeviceHealthComponent implements OnInit, AfterViewInit {
  healthData: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#' },
    { key: 'param2', label: 'IMEI No.', sortable: true },
    { key: 'param17', label: 'Date Time', sortable: true },
    { key: 'param6', label: 'Battery(%)', sortable: true },
    { key: 'param7', label: 'Low Battery Threshold', sortable: true },
    { key: 'param8', label: 'Memory(%)', sortable: true },
    { key: 'param10', label: 'Ignition ON', sortable: true },
    { key: 'param11', label: 'Ignition OFF', sortable: true },
    { key: 'param12', label: 'Digital Input', sortable: true },
    { key: 'param13', label: 'Analog 1', sortable: true },
    { key: 'param18', label: 'Digital Output', sortable: true },
    { key: 'param19', label: 'Analog 2', sortable: true },
    { key: 'param23', label: 'Device IP', sortable: true, cellStyle: { 'max-width': '150px', 'overflow-wrap': 'anywhere' } },
    { key: 'param15', label: 'Raw String', sortable: true, cellStyle: { 'max-width': '200px', 'overflow-wrap': 'anywhere' } }
  ];
  loading = false;
  showTable = false;

  searchText: string = '';
  selectedDate: string = '';
  selectedVendor: string = '';
  selectedIMEI: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;

  // Dropdowns
  vendorList: any[] = [];
  imeiList: any[] = [];

  roleId: string = '';

  constructor(
    private toast:ToastService,
    private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {
    this.roleId = sessionStorage.getItem('roleid') || '';
    this.toast.pageName = 'Device Health';
  }

  ngOnInit() {
    
    this.loadVendorList();
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
        $('.datepick').datepicker({
          format: 'dd-M-yyyy',
          endDate: '+0d',
          autoclose: true
        });
        $('.datepick').datepicker('setDate', '+0d');
        const today = new Date();
        this.selectedDate = this.formatDate(today);
        
        $('#daterawdata').on('changeDate', (e: any) => {
          this.selectedDate = this.formatDate(e.date);
          this.cdr.detectChanges();
        });
      }
    }, 100);
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  loadVendorList() {
    this.loading = true;
    // Using port assign to vendor roster API
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.vendorList = response.entity;
          if (this.vendorList.length === 1) {
            this.selectedVendor = this.vendorList[0].param1;
            this.onVendorChange();
          }
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading vendor list:', error);
      }
    });
  }

onVendorChange() {
  this.selectedIMEI = '';
  this.imeiList = [];

  if (!this.selectedVendor) {
    return;
  }

  const encryptedVendorId =
    this.encryptionService.encryptAccountId(this.selectedVendor);
  const encryptedRoleId =
    this.encryptionService.encryptAccountId(this.roleId);

  this.deviceService
    .getRawDataDeviceRoster(encryptedVendorId, encryptedRoleId)
    .subscribe({
      next: (response: any) => {
        if (response.status && response.entity) {
          // 🔥 LIMIT to avoid hang
          this.imeiList = response.entity.slice(0, 300);
        }
      },
      error: (error: any) => {
        console.error('IMEI load error', error);
      }
    });
}

  getHealthDetails() {
    if (!this.selectedVendor) {
      
    this.toast.show('Please select vendor', 'error');

      return;
    }

    this.loading = true;
    this.currentPage = 1;
    this.showTable = false;

    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      param4: this.selectedVendor,
      param5: this.selectedDate,
      param6: this.selectedIMEI || ''
    };

    this.deviceService.getDeviceHealth(request).subscribe({
      next: (response: any) => {
  this.loading = false;

  // 🔴 CASE: No Data Found
  if (response.status === true && response.entity === 'No Data Found') {
    this.showTable = false;
    this.healthData = [];
    this.totalCount = 0;
    this.pageCount = 0;

  this.toast.show('No Data Found', 'error');

    return;
  }

  // ✅ CASE: Valid data
  if (response.status === true && response.entity) {
    this.showTable = true;
    this.healthData = response.entity.listData || [];
    this.totalCount = response.entity.param1 || 0;
    this.pageCount = this.healthData.length;
  } else {
    // 🔴 Any other unexpected case
    this.showTable = false;
    this.healthData = [];
    this.totalCount = 0;
    this.pageCount = 0;

   this.toast.show('Please select vendor', 'error');

  }

  this.cdr.detectChanges();
}
,
      error: (error) => {
        this.loading = false;
        this.showTable = false;
        this.healthData = [];
        this.totalCount = 0;
        this.pageCount = 0;
        console.error('Error fetching device health:', error);
     this.toast.show('Error fetching device health.', 'error');

        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getHealthDetails();
  }

  reloadData() {
    this.searchText = '';
    this.getHealthDetails();
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.healthData.sort((a, b) => {
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
    this.getHealthDetails();
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.getHealthDetails();
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
    return this.healthData;
  }
}

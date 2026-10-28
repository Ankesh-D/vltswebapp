import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OperationService } from '../../../core/services/operation.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DeviceService } from '../../../core/services/device.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import localeData from 'dayjs/plugin/localeData';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastService } from '../../../core/services/toast.service';
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(localeData);
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);

declare var $: any;
@Component({
    selector: 'app-emergency-raw-data',
    imports: [CommonModule, FormsModule, NgxDaterangepickerMd, NgSelectModule],
    templateUrl: './emergency-raw-data.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./emergency-raw-data.component.scss']
})
export class EmergencyRawDataComponent implements OnInit, AfterViewInit {
  selectedRange: any = {
    startDate: dayjs(),
    endDate: dayjs()
  };
  selectedVendor: any = null;
  selectedDevice: any = null;

  companyList: any[] = [];
  deviceList: any[] = [];

  rawData: any[] = [];
  loading = false;

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;

  vendorId: any = '';
  showVendorList: boolean = true;
  roleid: any = "";
  errorMessage: string | null = null;
  searchFlag: boolean = false;
  showDetailsFlag: boolean = false;

  constructor(
    private router: Router,
    private operationService: OperationService,
    private dashboardService: DashboardService,
    private deviceService: DeviceService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    public toast: ToastService
  ) {
    this.roleid = sessionStorage.getItem('roleid');
     this.vendorId = sessionStorage.getItem('userid');
  }

  ngOnInit() {

    // this.initializeDatePickers();
    this.loadCompanyList();
    this.checkTask();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      // this.initializeDatePickers();
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
      }
    }, 200);
  }

  checkTask() {
    // 'task' value session storage se ya jahan se bhi aap store kar rahe hain wahan se lein

    // Safe check: null check karein aur whitespace trim karein
    if (this.roleid && this.roleid.toString().trim() === "11") {

      this.showVendorList = false;
      this.selectedVendor = "";
      this.loadDeviceRosterForTask11();
    } else {
      this.showVendorList = true;
    }
  }

  loadDeviceRosterForTask11() {
    this.loading = true;
    // API call with empty vendorId and roleId as per your requirement
    this.deviceService.getRawDataDeviceRoster('', '').subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading device list for task 11:', error);
        this.cdr.detectChanges();
      }
    });
  }

  loadCompanyList() {
    this.loading = true;
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.companyList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        let msg = error;
        this.errorMessage = msg;
        this.toast.show(msg, 'error');
        console.error('Error loading company list:', error);
        this.cdr.detectChanges();
      }
    });
  }

  onVendorChange() {
    if (!this.selectedVendor) {
      this.deviceList = [];
      this.selectedDevice = '';
      return;
    }
    this.showDetailsFlag = false;
    this.loading = true;
    this.vendorId = this.selectedVendor;
    const encryptedVendorId = this.encryptionService.encryptAccountId(this.selectedVendor);
    const encryptedRoleId = this.encryptionService.encryptAccountId('11');

    this.deviceService.getRawDataDeviceRoster(encryptedVendorId, encryptedRoleId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        let msg = error;
        this.errorMessage = msg;
        this.toast.show(msg, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  searchRawData(pageNo: number = 1) {
    if (!this.selectedRange.startDate) {
      this.toast.show('Select Date.', 'error');
      return;
    }
    if (this.roleid && this.roleid.toString().trim() !== "11") {
      if (!this.selectedVendor) {
        this.toast.show('Select Vendor.', 'error');
        return;
      }
    }
    if (!this.selectedDevice) {
      this.toast.show('Select Device No.', 'error');
      return;
    }

    this.loading = true;
    this.currentPage = pageNo;

    const request = {
      param1: this.searchText.trim(),
      param2: pageNo.toString(),
      param3: this.pageSize === this.totalCount ? 'All' : this.pageSize.toString(),
      param4: this.vendorId,
      param5: this.selectedDevice,
      param6: this.selectedRange.startDate.format('DD-MMM-YYYY') 
    };
    this.toast.showLoader();
    this.operationService.getEmergencyRawData(request).subscribe({
      next: (response) => {
        this.toast.hideLoader();
        this.loading = false;

        const entity: any = response.entity as any;
        this.searchFlag = false;
        if (entity === 'No Data Found' || !entity) {
          this.rawData = [];
          this.totalCount = 0;
          this.pageCount = 0;
        } else if (entity && entity.listData) {
          this.showDetailsFlag = true;
          this.rawData = entity.listData;
          this.totalCount = entity.param1 || 0;
          this.pageCount = this.rawData.length < this.pageSize ? this.rawData.length : this.pageSize;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.toast.hideLoader();
        this.loading = false;
        this.searchFlag = false;
        let msg = error;
        this.errorMessage = msg;
        this.toast.show("Something went wrong.", 'error');
        this.cdr.detectChanges();
      }
    });
  }

  goToEmergencyRawData() {
    this.router.navigate(['/RawData']);
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.searchRawData(1);
  }

  resetFilters() {
    this.searchFlag = false;
    this.selectedRange = {
      startDate: null,
      endDate: null
    };
    this.selectedVendor = '';
    this.selectedDevice = '';
    this.errorMessage = '';
    this.showDetailsFlag = false;
    setTimeout(() => {
      this.selectedRange = {
        startDate: dayjs(),
        endDate: dayjs()
      };
    });
    this.cdr.detectChanges();
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.searchRawData(1);
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }

    this.rawData.sort((a, b) => {
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
    this.searchRawData(page);
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newSize = target.value;
    this.pageSize = newSize === 'All' ? this.totalCount : parseInt(newSize);
    this.currentPage = 1;
    this.searchRawData(1);
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

  getPaginatedData(): any[] {
    return this.rawData;
  }
  
}

import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

declare var $: any;

@Component({
    selector: 'app-change-dealer',
    imports: [CommonModule, FormsModule, RouterModule, NgbPaginationModule],
    templateUrl: './change-dealer.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./change-dealer.component.scss']
})
export class ChangeDealerComponent implements OnInit, AfterViewInit {
  deviceDetails: any[] = [];
  loading = false;

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;

  // Change Dealer Modal
  editSerialNo: string = '';
  editDeviceId: string = '';
  editVendorId: string = '';
  editOldDealerId: string = '';
  editNewDealerId: string = '';
  editRemark: string = '';
  isRemarkInvalid: boolean = false;
  dealerList: any[] = [];

  roleId: string = '';
  showChangeModal: boolean = false;
  selectedDealerPlain: string = '';

  constructor(
    private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {this.roleId = sessionStorage.getItem('roleid') || '';}

  ngOnInit() {
    
    this.getChangeDealerData(1);
  }

  ngAfterViewInit() {
    // No jQuery/select2 needed; using plain select / Angular bindings
  }
  updatePageSizeOptions() {
    // Generate page size options based on total count
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 0 && this.totalCount < 100) options.push(this.totalCount); // 'All'
    this.pageSizeOptions = options;
  }
  getChangeDealerData(pageNumber: number) {
    this.loading = true;
    this.currentPage = pageNumber;

    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      param8: 'changedevicetodealer',
      param9: '', // vendorid filter can be added here if needed
      param10: '', // distributorid filter can be added here if needed
      param11: '', // dealerid filter can be added here if needed
      pdfexcel: ''
    };

    this.deviceService.getDeviceDetailsForChange(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceDetails = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.deviceDetails.length;
          this.updatePageSizeOptions();
        } else {
          this.deviceDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
          // jAlert('No Data Found: ' + response.entity);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.deviceDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        console.error('Error fetching device details:', error);
        // jAlert('Error fetching device details.');
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getChangeDealerData(1);
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
    this.getChangeDealerData(1);
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
    if (page < 1) return;
    const totalPages = this.getTotalPages();
    if (this.totalCount > 0 && page > totalPages) return;
    this.currentPage = page;
    this.getChangeDealerData(this.currentPage);
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.getChangeDealerData(this.currentPage);
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

  getPaginatedData(): any[] {
    return this.deviceDetails;
  }

  // Change Dealer
  getDeviceDataForChange(device: any) {
    this.editSerialNo = device.param6 || '';
    this.editDeviceId = device.param2; // deviceId
    this.editVendorId = device.param3; // vendorId
    this.editOldDealerId =device.param35; // oldDealerId
    this.editNewDealerId = '';
    this.editRemark = '';
    this.isRemarkInvalid = false;
    this.dealerList = [];
    this.selectedDealerPlain = '';

    this.loading = true;
    const encryptedVendorId = this.encryptionService.encryptAccountId(device.param3);
    const queryParams = `companyid=${encodeURIComponent(encryptedVendorId)}`;
    
    this.dashboardService.getDealerListByVendor(device.param3, '').subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.dealerList = response.entity;
        }
        this.cdr.detectChanges();
        // Open Angular modal
        this.showChangeModal = true;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading dealer list:', error);
        // jAlert('Error loading dealer list.');
      }
    });
  }

  checkRemark() {
    this.isRemarkInvalid = this.editRemark.length < 10;
  }

  changeDealer() {
    if (!this.editNewDealerId) {
      // jAlert('Select Dealer Name');
      return;
    }
    this.checkRemark();
    if (this.isRemarkInvalid) {
      // jAlert('Enter remark with minimum 10 characters length');
      return;
    }

    this.loading = true;
    const request = {
      param1: this.editDeviceId,
      param2: this.editOldDealerId,
      param3: this.editNewDealerId,
      param5: this.editRemark
    };

    this.deviceService.changeDeviceToDealer(request).subscribe({
      next: (response) => {
        this.loading = false;
        // jAlert(response.entity);
        if (response.status && response.entity === 'Successfully Saved.') {
          this.showChangeModal = false;
          this.getChangeDealerData(this.currentPage);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error changing dealer:', error);
        // jAlert('Error changing dealer.');
      }
    });
  }

  back() {
    this.editRemark = '';
    this.isRemarkInvalid = false;
    this.showChangeModal = false;
  }

  onNewDealerChange(dealerId: string) {
    this.selectedDealerPlain = dealerId;
    this.editNewDealerId = dealerId ? this.encryptionService.encryptAccountId(dealerId) : '';
  }
}

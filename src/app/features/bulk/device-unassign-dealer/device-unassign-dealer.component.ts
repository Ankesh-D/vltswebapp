import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../core/services/toast.service';
declare var jAlert: any;

@Component({
    selector: 'app-device-unassign-dealer',
    imports: [CommonModule, FormsModule, RouterModule, NgbPaginationModule],
    templateUrl: './device-unassign-dealer.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./device-unassign-dealer.component.scss']
})
export class DeviceUnassignDealerComponent implements OnInit {
  // List data
  deviceDetails: any[] = [];
  loading = false;
  errorMessage = '';
  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20];
  totalCount = 0;
  pageCount = 0;
roleId: string = "";
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;

  // Modal state
  showUnassignModal = false;
  editSerialNo: string = '';
  editDeviceId: string = '';
  editDealerId: string = '';
  remark: string = '';
  isRemarkInvalid: boolean = false;

  constructor(
    private deviceService: DeviceService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) { 
    this.toast.pageName = 'Unassign Device From Dealer'; // Set page name for toast service
    this.roleId = sessionStorage.getItem('roleid') || '';
  }

  ngOnInit() {
    this.getUnassignDeviceData(1);
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

  getUnassignDeviceData(pageNumber: number) {
    this.loading = true;
    this.currentPage = pageNumber;

    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      param8: 'unassigndevicefromdealer',
      param9: '',  // vendorid filter can be added here if needed
      param10: '', // distributorid filter can be added here if needed
      param11: '', // dealerid filter can be added here if needed
      pdfexcel: '' // not used for regular fetch
    };
        // pdfexcel: '' };

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
          this.errorMessage = typeof response.entity === 'string' ? response.entity : 'No Data Found';
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.deviceDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        this.errorMessage = 'Failed to load device list.';
        console.error('Error loading device list:', error);
        this.cdr.detectChanges();
      }
    });
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

  onPageChange(page: number) {
    if (page < 1) return;
    const totalPages = this.getTotalPages();
    if (this.totalCount > 0 && page > totalPages) return;
    this.currentPage = page;
    this.getUnassignDeviceData(this.currentPage);
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.getUnassignDeviceData(this.currentPage);
  }

  getPaginatedData(): any[] {
    return this.deviceDetails;
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.getUnassignDeviceData(this.currentPage);
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
    this.getUnassignDeviceData(this.currentPage);
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
  }

  // Modal handling
  openUnassignModal(device: any) {
    this.editSerialNo = device.param6 || '';
    this.editDeviceId = this.encryptionService.encryptAccountId(device.param2); // deviceId
    this.editDealerId = this.encryptionService.encryptAccountId(device.param35 || ''); // dealerId if needed
    this.remark = '';
    this.isRemarkInvalid = false;
    this.showUnassignModal = true;
  }

  checkRemark() {
    this.isRemarkInvalid = this.remark.trim().length < 10;
  }

  unassignDevice() {
    if (!this.editDeviceId) {
      jAlert('Invalid device selection.');
      return;
    }
    this.checkRemark();
    if (this.isRemarkInvalid) {
      jAlert('Enter remark with minimum 10 characters length');
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const request = {
      param1: this.editDeviceId,
      param2: this.remark.trim()
    };

    this.deviceService.unassignDeviceFromDealer(request).subscribe({
      next: (response) => {
        this.loading = false;
        jAlert(response.entity);
        if (response.status && response.entity === 'Successfully Saved.') {
          this.showUnassignModal = false;
          this.getUnassignDeviceData(this.currentPage);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error unassigning device from dealer.';
        console.error('Unassign device API error:', error);
        jAlert(this.errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  back() {
    this.remark = '';
    this.isRemarkInvalid = false;
    this.showUnassignModal = false;
  }
}

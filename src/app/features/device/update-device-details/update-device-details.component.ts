import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastService } from '../../../core/services/toast.service';
import { NgSelectModule } from '@ng-select/ng-select'; // Import NgSelectModule
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

@Component({
    selector: 'app-update-device-details',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, ToastComponent, NgbPaginationModule, CommonTableComponent],
    templateUrl: './update-device-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./update-device-details.component.scss']
})

export class UpdateDeviceDetailsComponent implements OnInit, AfterViewInit {
  deviceDetails: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#' },
    { key: 'param6', headers: ['Serial No.', 'IMEI No.'], sortable: true },
    { key: 'param7', label: 'ICCID No.', sortable: true },
    { key: 'param32', headers: ['Mobile N/W 1', 'Mobile N/W 2'], sortable: true },
    { key: 'param9', headers: ['Mobile No. 1', 'Mobile No. 2'], sortable: true },
    { key: 'param13', label: 'Esim Provider', sortable: true },
    { key: 'param38', label: 'Vehicle Status', sortable: true },
    { key: 'param27', label: 'Activation Status', sortable: true },
    { key: 'activity', label: 'Activity' }
  ];
  loading = false;

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;

  // Slider properties for animated tabs
  sliderPosition: string = '0px';
  sliderWidth: string = '0px';

  // Edit Modal (same as Device Details component)
  showEditModal: boolean = false;
  editData: any = {};
  isEditRemarkInvalid: boolean = false;

  // Delete Modal
  showDeleteModal: boolean = false;
  deleteData: any = {};
  isDeleteRemarkInvalid: boolean = false;
  devicestatus: string = '';
  task: any;
  isIncorrect: boolean = false;

  // Dropdowns
  simnetworkdetails: any[] = [];
  tm2mprovider: any[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService // Inject ToastService
  ) {
    this.toastService.pageName = 'Update Device Details'; // Set page name for toast service
  }

  ngOnInit() {
    this.task = sessionStorage.getItem('roleid');
    this.loadNetworkList();
    this.loadM2MProviderList();
    this.getDeviceDetails(1);
  }

  ngAfterViewInit() {
    // Initialize slider position for animated tabs
    setTimeout(() => {
      const tabsContainer = document.querySelector('.modern-tabs-track');
      if (tabsContainer) {
        const firstTab = tabsContainer.querySelector('.modern-tab-item.active') || tabsContainer.querySelector('.modern-tab-item');
        if (firstTab) {
          const tabEl = firstTab as HTMLElement;
          this.sliderWidth = tabEl.clientWidth + 'px';
          this.sliderPosition = tabEl.offsetLeft + 'px';
        }
      }
    }, 100);
  }

  loadNetworkList() {
    this.dashboardService.getNetworkList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.simnetworkdetails = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading network list:', error);
      }
    });
  }

  loadM2MProviderList() {
    this.dashboardService.getM2MProviderList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.tm2mprovider = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading M2M provider list:', error);
      }
    });
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

  getDeviceDetails(pageNumber: number) {
    this.loading = true;
    this.currentPage = pageNumber;

    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      param8: '', // operation type
      param9: '',  // vendorid filter can be added here if needed
      param10: '', // distributorid filter can be added here if needed
      param11: '', // dealerid filter can be added here if needed
      pdfexcel: '' // not used for regular fetch
    };

    this.deviceService.getDeviceDetailsForUpdate(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceDetails = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.deviceDetails.length;
          this.updatePageSizeOptions(); // Update page size options based on total count
        } else if (response.entity) { // Check if entity exists to avoid showing toast for empty response without message
          this.deviceDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.toastService.show('No Data Found: ' + response.entity, 'error'); // Using toastService
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.deviceDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        console.error('Error fetching device details:', error);
        this.toastService.show('Error fetching device details.', 'error'); // Using toastService
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getDeviceDetails(1);
  }

  reloadData() {
    this.searchText = '';
    this.pageSize = 20;
    this.currentPage = 1;
    this.getDeviceDetails(1);
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
    this.getDeviceDetails(this.currentPage);
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.getDeviceDetails(this.currentPage);
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

  // Edit Device (same logic as Device Details component, but using overlay modal)
  openEditModal(device: any) {
    this.editData = {
      ...device,
      nw1: device.param10,
      mob1: device.param8,
      nw2: device.param11,
      mob2: device.param9,
      m2mprovider: device.param12,
      remark: ''
    };
    this.isEditRemarkInvalid = false;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  ForImei() { }
  ForSimNo() { }
  ForSimNo2() { }
  validRemark() { }
  onBlur() { }
  refundamountdata() { }

  checkEditRemark() {
    this.isEditRemarkInvalid = (this.editData.remark || '').length < 10;
  }

  updateDevice() {
    const mob1 = this.editData.mob1 || '';
    const mob2 = this.editData.mob2 || '';
    const nw1 = this.editData.nw1 || '';
    const nw2 = this.editData.nw2 || '';
    const m2mProvider = this.editData.m2mprovider || '';

    // if ((this.editData.param8 !== mob1) && (mob1 === '' || mob1.length < 10 || (mob1.length > 10 && mob1.length < 13))) {
    //   this.toastService.show('Invalid Sim Number 1', 'error');
    //   return;
    // }

    // if ((this.editData.param9 !== mob2) && (mob2 === '' || mob2.length < 10 || (mob2.length > 10 && mob2.length < 13))) {
    //   this.toastService.show('Invalid Sim Number 2', 'error');
    //   return;
    // }

    // if (nw1 === nw2 && (this.editData.param10 !== nw1 || this.editData.param11 !== nw2)) {
    //   this.toastService.show('Please Select Different Network Id', 'error');
    //   return;
    // }

    // if (m2mProvider === '') {
    //   this.toastService.show('Please Select M2M Provider', 'error');
    //   return;
    // }

    // this.checkEditRemark();
    // if (this.isEditRemarkInvalid) {
    //   this.toastService.show('Remark Must have Minimum 10 Words', 'error');
    //   return;
    // }

    this.loading = true;
    const request = {
      param1: this.editData.param2,
      param2: this.editData.param3,
      param3: this.editData.param4,
      param4: this.editData.param5,
      param5: this.editData.param6,
      param6: this.editData.param7,
      param7: '',
      param8: mob1,
      param9: mob2,
      param10: nw1,
      param11: nw2,
      param12: m2mProvider
    };

    this.deviceService.updateDeviceMaster(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.toastService.show(response.entity, response.status ? 'success' : 'error'); // Using toastService
        if (response.status && response.entity.includes('Successfully')) {
          this.showEditModal = false;
          this.getDeviceDetails(this.currentPage);
        }
      },
      error: (error) => {
        this.loading = false;
        this.toastService.show('Error updating device.', 'error'); // Using toastService
      }
    });
  }

  // Delete Device (same as Device Details component, but using overlay modal)
  deldeviceid:any; refundamt: any;
  openDeleteModal(device: any) {
    this.deleteData = {
      ...device,
      remarks: '',
      refundAmount: device.param27 !== 'Activated'
    };
    this.devicestatus = device.param27;
    this.isDeleteRemarkInvalid = false;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  checkDeleteRemark() {
    this.isDeleteRemarkInvalid = (this.deleteData.remarks || '').length < 10;
  }

  deleteDevice() {
    this.checkDeleteRemark();
    if (this.isDeleteRemarkInvalid) {
      this.toastService.show('Remark Must have Minimum 10 Characters', 'error');
      return;
    }

    if (!confirm('Are you sure to Delete ' + this.deleteData.param6 + ' Device')) {
      return;
    }

    this.loading = true;
    const request = {
      param1: this.deleteData.param2,
      param2: this.deleteData.remarks,
      param3: this.deleteData.refundAmount
    };

    this.deviceService.deleteDevice(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.toastService.show(response.entity, response.status ? 'success' : 'error'); // Using toastService
        if (response.status && response.entity.includes('Successfully')) {
          this.showDeleteModal = false;
          this.searchText = '';
          this.getDeviceDetails(this.currentPage);
        }
      },
      error: (error) => {
        this.loading = false;
        this.toastService.show('Error deleting device.', 'error'); // Using toastService
      }
    });
  }

  back() {
    this.editData.remark = '';
    this.deleteData.remarks = '';
    this.isEditRemarkInvalid = false;
    this.isDeleteRemarkInvalid = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
  }

  updateSlider(event: Event) {
    // Ensure navigation happens, we only want to update UI position
    const target = event.currentTarget as HTMLElement;
    if (target) {
      // Use direct element properties for performance
      this.sliderWidth = target.clientWidth + 'px';
      this.sliderPosition = target.offsetLeft + 'px';
      
      // Run change detection to ensure the style updates immediately
      this.cdr.detectChanges();
    }
  }
}

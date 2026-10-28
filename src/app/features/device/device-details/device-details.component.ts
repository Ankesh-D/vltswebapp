import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

declare var $: any;
declare var jAlert: any;

@Component({
  selector: 'app-device-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, CommonTableComponent],
  templateUrl: './device-details.component.html',
  styleUrls: ['./device-details.component.scss']
})
export class DeviceDetailsComponent implements OnInit, AfterViewInit {
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

  // Edit Modal
  showEditModal = false;
  editDeviceId: string = '';
  editDeviceMakeId: string = '';
  editDeviceModelId: string = '';
  editUniqueId: string = '';
  editUniqueDeviceNo: string = '';
  editIccidNo: string = '';
  editMob1: string = '';
  editMob2: string = '';
  editSmnw1: string = '';
  editSimnw2: string = '';
  editM2mProviderId: string = '';
  editM2mProviderCode: string = '';
  editRemark: string = '';
  editRefundAmount: boolean = false;
  isEditRemarkInvalid: boolean = false;

  // Delete Modal
  showDeleteModal = false;
  deleteDeviceId: string = '';
  deleteUniqueDeviceNo: string = '';
  deleteRemark: string = '';
  deleteRefundAmount: boolean = false;
  isDeleteRemarkInvalid: boolean = false;

  // Dropdowns
  networkList: any[] = [];
  m2mProviderList: any[] = [];

  roleId: string = '';

  constructor(
    private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleId') || '';
    this.loadNetworkList();
    this.loadM2MProviderList();
    this.getDeviceDetails(1);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
      }
    }, 200);
  }

  loadNetworkList() {
    this.dashboardService.getNetworkList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.networkList = response.entity;
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
          this.m2mProviderList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading M2M provider list:', error);
      }
    });
  }

  getDeviceDetails(pageNumber: number) {
    this.loading = true;
    this.currentPage = pageNumber;

    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize)
    };

    this.deviceService.getDeviceDetails(request).subscribe({
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
        console.error('Error fetching device details:', error);
        jAlert('Error fetching device details.');
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getDeviceDetails(1);
  }

  reloadData() {
    this.searchText = '';
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

  // Edit Device
  getDeviceDataForEdit(device: any) {
    this.editDeviceId = device.param2 || '';
    this.editDeviceMakeId = device.param3 || '';
    this.editDeviceModelId = device.param4 || '';
    this.editUniqueId = device.param5 || '';
    this.editUniqueDeviceNo = device.param6 || '';
    this.editIccidNo = device.param7 || '';
    this.editMob1 = device.param8 || '';
    this.editMob2 = device.param9 || '';
    this.editSmnw1 = device.param10 || '';
    this.editSimnw2 = device.param11 || '';
    this.editM2mProviderId = device.param12 || '';
    this.editM2mProviderCode = device.param13 || '';
    this.editRemark = '';
    this.editRefundAmount = device.param27 !== 'Activated';
    this.isEditRemarkInvalid = false;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editRemark = '';
    this.isEditRemarkInvalid = false;
  }

  checkEditRemark() {
    this.isEditRemarkInvalid = this.editRemark.length < 10;
  }

  updateDevice() {
    if (this.editUniqueDeviceNo === '' || this.editUniqueDeviceNo.length !== 19) {
      jAlert('Unique Device Id Combination Should be 4 alphanumeric Manufacturing Code, 2 alphanumeric Model Code, 1 alphanumeric testing agency code, production date MMYY, 8 digit numeric serial no.');
      return;
    }
    
    if (this.editUniqueId === '' || this.editUniqueId.length !== 15) {
      jAlert('Invalid IMEI NO');
      return;
    }
    
    if (this.editIccidNo === '') {
      jAlert('Please Enter ICCID NO');
      return;
    }
    
    if (this.editMob1 === '' || this.editMob1.length < 10 || (this.editMob1.length > 10 && this.editMob1.length < 13)) {
      jAlert('Invalid Sim Number 1');
      return;
    }
    
    if (this.editMob2 === '' || this.editMob2.length < 10 || (this.editMob2.length > 10 && this.editMob2.length < 13)) {
      jAlert('Invalid Sim Number 2');
      return;
    }
    
    if (this.editSmnw1 === this.editSimnw2) {
      jAlert('Please Select Different Network Id');
      return;
    }
    
    if (this.editM2mProviderId === '') {
      jAlert('Please Select M2M Provider');
      return;
    }
    
    this.checkEditRemark();
    if (this.isEditRemarkInvalid) {
      jAlert('Remark Must have Minimum 10 Words');
      return;
    }

    this.loading = true;
    const request = {
      param1: this.editDeviceId,
      param2: this.editDeviceMakeId,
      param3: this.editDeviceModelId,
      param4: this.editUniqueId,
      param5: this.editUniqueDeviceNo,
      param6: this.editIccidNo,
      param7: '',
      param8: this.editMob1,
      param9: this.editMob2,
      param10: this.editSmnw1,
      param11: this.editSimnw2,
      param12: this.editM2mProviderId
    };

    this.deviceService.updateDeviceMaster(request).subscribe({
      next: (response) => {
        this.loading = false;
        jAlert(response.entity);
        if (response.status && response.entity.includes('Successfully')) {
          this.closeEditModal();
          this.getDeviceDetails(this.currentPage);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating device:', error);
        jAlert('Error updating device.');
      }
    });
  }

  // Delete Device
  getDeviceDataForDelete(device: any) {
    this.deleteDeviceId = device.param2 || '';
    this.deleteUniqueDeviceNo = device.param6 || '';
    this.deleteRemark = '';
    this.deleteRefundAmount = device.param27 !== 'Activated';
    this.isDeleteRemarkInvalid = false;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deleteRemark = '';
    this.isDeleteRemarkInvalid = false;
  }

  checkDeleteRemark() {
    this.isDeleteRemarkInvalid = this.deleteRemark.length < 10;
  }

  deleteDevice() {
    this.checkDeleteRemark();
    if (this.isDeleteRemarkInvalid) {
      jAlert('Remark Must have Minimum 10 Words');
      return;
    }

    if (!confirm('Are you sure to Delete ' + this.deleteUniqueDeviceNo + ' Device')) {
      return;
    }

    this.loading = true;
    const request = {
      param1: this.encryptionService.encryptAccountId(this.deleteDeviceId),
      param2: '',
      param3: this.deleteRemark,
      param4: this.deleteRefundAmount
    };

    this.deviceService.deleteDevice(request).subscribe({
      next: (response) => {
        this.loading = false;
        jAlert(response.entity);
        if (response.status && response.entity.includes('Successfully')) {
          this.closeDeleteModal();
          this.getDeviceDetails(this.currentPage);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error deleting device:', error);
        jAlert('Error deleting device.');
      }
    });
  }

  back() {
    this.closeEditModal();
    this.closeDeleteModal();
  }
}

import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DealerService } from '../../../core/services/dealer.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EncryptionService } from '../../../core/services/encryption.service';

declare var $: any;
declare var jAlert: any;

@Component({
  selector: 'app-update-dealer-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './update-dealer-details.component.html',
  styleUrls: ['./update-dealer-details.component.scss']
})
export class UpdateDealerDetailsComponent implements OnInit, AfterViewInit {
  dealerDetails: any[] = [];
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
  showEditModal: boolean = false;
  editDealerId: string = '';
  editDealerName: string = '';
  editDealerType: string = '';
  editVendorId: string = '';
  editContactPerson: string = '';
  editMobileNo: string = '';
  editEmailId: string = '';
  editAddress: string = '';
  editCity: string = '';
  editState: string = '';
  editAlternateMobileNo: string = '';
  editRemark: string = '';
  isEditRemarkInvalid: boolean = false;
  isMobileInvalid: boolean = false;
  isEmailInvalid: boolean = false;

  // Delete Modal
  showDeleteModal: boolean = false;
  deleteDealerId: string = '';
  deleteDealerName: string = '';
  deleteRemark: string = '';
  isDeleteRemarkInvalid: boolean = false;

  // Dropdowns
  vendorList: any[] = [];
  stateList: any[] = [];
  cityList: any[] = [];

  roleId: string = '';

  constructor(
    private dealerService: DealerService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleId') || '';
    this.loadStateList();
    this.getDealerDetails(1);
  }

  ngAfterViewInit() {
    // No jQuery/select2; using Angular bindings and overlay modals
  }

  loadStateList() {
    this.dealerService.getStateList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.stateList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading state list:', error);
      }
    });
  }

  onStateChange() {
    this.editCity = '';
    this.cityList = [];
    if (this.editState) {
      this.dealerService.getCityList(this.editState).subscribe({
        next: (response) => {
          if (response.status && response.entity) {
            this.cityList = response.entity;
          }
        },
        error: (error) => {
          console.error('Error loading city list:', error);
        }
      });
    }
    this.cdr.detectChanges();
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

  getDealerDetails(pageNumber: number) {
    this.loading = true;
    this.currentPage = pageNumber;

    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      param4: ''
    };

    this.dealerService.getDealerDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.dealerDetails = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.dealerDetails.length;
        } else {
          this.dealerDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
          jAlert('No Data Found: ' + response.entity);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.dealerDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        console.error('Error fetching dealer details:', error);
        jAlert('Error fetching dealer details.');
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getDealerDetails(1);
  }

  reloadData() {
    this.searchText = '';
    this.getDealerDetails(1);
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.dealerDetails.sort((a, b) => {
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
    this.getDealerDetails(this.currentPage);
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.getDealerDetails(this.currentPage);
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
    return this.dealerDetails;
  }

  // Edit Dealer (uses overlay modal)
  openEditModal(dealer: any) {
    this.editDealerId = dealer.param2 || '';
    this.editDealerName = dealer.param3 || '';
    this.editDealerType = dealer.param23 || '';
    this.editVendorId = dealer.param6 || '';
    this.editContactPerson = dealer.param9 || '';
    this.editMobileNo = dealer.param11 || '';
    this.editEmailId = dealer.param10 || '';
    this.editAddress = dealer.param5 || '';
    this.editCity = dealer.param7 || '';
    this.editState = dealer.param8 || '';
    this.editAlternateMobileNo = dealer.param12 || '';
    this.editRemark = '';
    this.isEditRemarkInvalid = false;
    this.isMobileInvalid = false;
    this.isEmailInvalid = false;

    if (this.roleId === '10' || this.roleId === '17') {
      this.loadVendorList();
    }

    // Load city list for current state and then open modal
    this.onStateChange();
    this.showEditModal = true;
  }

  checkMobileNumber() {
    const reg = /^[1-9][0-9]*$/;
    this.isMobileInvalid = this.editMobileNo.length > 0 && (!reg.test(this.editMobileNo) || this.editMobileNo.length !== 10);
  }

  validateEmail() {
    const emailRegex = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    this.isEmailInvalid = this.editEmailId.length > 0 && !emailRegex.test(this.editEmailId);
  }

  checkEditRemark() {
    this.isEditRemarkInvalid = this.editRemark.length < 10;
  }

  updateDealer() {
    if (!this.editDealerName) {
      jAlert('Please enter Dealer Name');
      return;
    }
    if (!this.editDealerType) {
      jAlert('Please enter Dealer Type');
      return;
    }
    if (!this.editContactPerson) {
      jAlert('Please enter Contact Person');
      return;
    }
    if (!this.editMobileNo || this.editMobileNo.length !== 10) {
      jAlert('Please enter valid 10-digit Mobile No');
      return;
    }
    if (this.editEmailId && !/^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/.test(this.editEmailId)) {
      jAlert('Please enter valid Email ID');
      return;
    }
    if (!this.editAddress) {
      jAlert('Please enter Address');
      return;
    }
    if (!this.editCity) {
      jAlert('Please select City');
      return;
    }
    if (!this.editState) {
      jAlert('Please select State');
      return;
    }
    this.checkEditRemark();
    if (this.isEditRemarkInvalid) {
      jAlert('Remark Must have Minimum 10 Words');
      return;
    }

    this.loading = true;
    const request = {
      param1: this.encryptionService.encryptAccountId(this.editDealerId),
      param2: this.editDealerName,
      param3: '0', // dealerGST
      param4: this.editAddress,
      param5: '0', // address2
      param6: this.editCity,
      param7: this.editState,
      param8: this.editContactPerson,
      param9: this.editEmailId,
      param10: this.editMobileNo,
      param11: this.editAlternateMobileNo,
      param12: (this.roleId === '10' || this.roleId === '17') ? this.editVendorId : '',
      param17: this.editRemark
    };

    this.dealerService.updateDealer(request).subscribe({
      next: (response) => {
        this.loading = false;
        jAlert(response.entity);
        if (response.status && response.statuscode === 200) {
          this.showEditModal = false;
          this.getDealerDetails(this.currentPage);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating dealer:', error);
        jAlert('Error updating dealer.');
      }
    });
  }

  // Delete Dealer
  openDeleteModal(dealer: any) {
    this.deleteDealerId = dealer.param2 || '';
    this.deleteDealerName = dealer.param3 || '';
    this.deleteRemark = '';
    this.isDeleteRemarkInvalid = false;
    this.showDeleteModal = true;
  }

  checkDeleteRemark() {
    this.isDeleteRemarkInvalid = this.deleteRemark.length < 10;
  }

  deleteDealer() {
    this.checkDeleteRemark();
    if (this.isDeleteRemarkInvalid) {
      jAlert('Remark Must have Minimum 10 Words');
      return;
    }

    if (!confirm('Are you sure to Delete Dealer ' + this.deleteDealerName)) {
      return;
    }

    this.loading = true;
    this.dealerService.deleteDealer(this.encryptionService.encryptAccountId(this.deleteDealerId)).subscribe({
      next: (response) => {
        this.loading = false;
        jAlert(response.entity);
        if (response.status && response.entity.includes('Successfully')) {
          this.showDeleteModal = false;
          this.getDealerDetails(this.currentPage);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error deleting dealer:', error);
        jAlert('Error deleting dealer.');
      }
    });
  }

  back() {
    this.editRemark = '';
    this.deleteRemark = '';
    this.isEditRemarkInvalid = false;
    this.isDeleteRemarkInvalid = false;
    this.isMobileInvalid = false;
    this.isEmailInvalid = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
  }
}

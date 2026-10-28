import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PermitHolderService } from '../../../core/services/permit-holder.service';
import { ToastService } from '../../../core/services/toast.service'; // Import ToastService
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonPaginationComponent } from '../../../shared/components/common-pagination/common-pagination.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';


@Component({
    selector: 'app-update-customer-details',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, ToastComponent,
      CommonDataToolbarComponent, CommonPaginationComponent, CommonTableComponent],
    templateUrl: './update-customer-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./update-customer-details.component.scss']
})
export class UpdateCustomerDetailsComponent implements OnInit, AfterViewInit {
  customerDetails: any[] = [];
  loading = false;

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'param1', label: '#', width: '52px' },
    { key: 'param3', label: 'Holder Name', sortable: true },
    { key: 'param4', label: 'Holder Type', sortable: true },
    { key: 'param5', label: 'Mobile No.', sortable: true },
    { key: 'param6', label: 'Email ID', sortable: true },
    { key: 'param7', label: 'Alternate Mobile No.', sortable: true },
    { key: 'param8', label: 'Address', sortable: true },
    { key: 'param9', label: 'City', sortable: true },
    { key: 'param10', label: 'Pin Code', sortable: true },
    { key: 'activity', label: 'Activity', width: '140px' }
  ];

  // Edit Modal
  showEditModal: boolean = false;
  editCustomerId: string = '';
  editHolderName: string = '';
  editHolderType: string = '';
  editMobileNo: string = '';
  editEmailId: string = '';
  editAlternateMobileNo: string = '';
  editAddress: string = '';
  editCity: string = '';
  editPinCode: string = '';
  editRemark: string = '';
  isEditRemarkInvalid: boolean = false;
  isMobileInvalid: boolean = false;
  isAltMobileInvalid: boolean = false;
  isEmailInvalid: boolean = false;

  // Delete Modal
  showDeleteModal: boolean = false;
  deleteCustomerId: string = '';
  deleteHolderName: string = '';
  deleteRemark: string = '';
  isDeleteRemarkInvalid: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  cityName: any;
  selectedCityId: any;
  citylist: any[]= [];
  selectedStateId: any;
  statelist: any[] =[];
  stateName: any;
  stateObj: any;
  cityObj: any;

  constructor(
    private permitHolderService: PermitHolderService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService // Inject ToastService
  ) {
    this.toastService.pageName = 'Update Customer Details'; // Set page name for toast service
  }

  ngOnInit() {
    this.getCustomerDetails(1);
    this.loadStateList();
  }

  ngAfterViewInit() {
    // No jQuery/select2; using Angular bindings and overlay modals
  }
  loadStateList(stateName?: string) {
    this.permitHolderService.getStateList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.statelist = response.entity;
          if(stateName) {
            // after state list loaded, stateName will auto match
            this.statelist.forEach(state => {
              if(state.param2.toLowerCase() === stateName.toLowerCase()) {
                this.selectedStateId = state.param1;
                this.stateObj = state;
                this.loadCityList(this.selectedStateId);
              }
            }); 
          }
        }
      },
      error: (error) => {
        this.errorMessage = error;
      }
    });
  }


  onStateChange() {
    this.cityName = '';
    this.selectedCityId = null;
    this.citylist = [];
    //console.log('Selected State ID:', this.selectedStateId);
    if (this.selectedStateId) {
      const state = this.statelist.find((s: any) => s.param1 == this.selectedStateId);
      if (state) {
        this.stateName = state.param2;
      }
      this.loadCityList(this.selectedStateId);
    }
  }
  loadCityList(stateId: string) {
    this.citylist = [];
    this.permitHolderService.getCityList(stateId).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.citylist = response.entity;
            if(this.showEditModal) {
              // after city list loaded, cityName will auto match
            this.citylist.forEach(city => {
              if(city.param2.toLowerCase() == this.cityName.toLowerCase()) {
                this.selectedCityId = city.param1;
                this.cityObj = city;
              }
            }); 
          }
        }
      },
      error: (error) => {
        console.error('Error loading city list:', error);
      }
    });
  }
  onCityChange() {
    if (this.selectedCityId) {
      const city: any = this.citylist.find((c: any) => c.param1 === this.selectedCityId);
      if (city) {
        this.cityName = city.param2;
      }
    }
  }

  getCustomerDetails(pageNumber: number) {
    this.loading = true;
    this.currentPage = pageNumber;

    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize)
    };

    this.permitHolderService.getPermitHolderDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.customerDetails = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.customerDetails.length;
        } else if (response.entity) {
          this.customerDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.toastService.show('No Data Found: ' + response.entity, 'error');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.customerDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        console.error('Error fetching customer details:', error);
        this.toastService.show('Error fetching customer details.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getCustomerDetails(1);
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
    this.getCustomerDetails(1);
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.customerDetails.sort((a, b) => {
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
    this.getCustomerDetails(this.currentPage);
  }

  onPageSizeChange(newSize: number | string) {
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.getCustomerDetails(this.currentPage);
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
    return this.customerDetails;
  }

  downloadExcel(): void {
    const columns = this.tableColumns.filter(column => column.key !== 'activity');
    const rows = [
      columns.map(column => column.label),
      ...this.customerDetails.map(customer => columns.map(column => customer[column.key] ?? ''))
    ];
    const csv = '\uFEFF' + rows
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const file = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customer-details.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  // Edit Customer (overlay modal)
  openEditModal(customer: any) {
    this.editCustomerId = customer.param2 || '';
    this.editHolderName = customer.param3 || '';
    this.editHolderType = customer.param4 || '';
    this.editMobileNo = customer.param5=='0' ? '' : customer.param5;
    this.editEmailId = customer.param6 || '';
    this.editAlternateMobileNo = customer.param7=='0' || customer.param7=='' ? '' : customer.param7;
    this.editAddress = customer.param8 || '';
    this.editCity = customer.param9 || '';
    this.editPinCode = customer.param10=='0' ? '' : customer.param10;
    this.editRemark = '';
    this.isEditRemarkInvalid = false;
    this.isMobileInvalid = false;
    this.isAltMobileInvalid = false;
    this.isEmailInvalid = false;
    this.showEditModal = true;
    this.selectedStateId = "";
    this.selectedCityId = "";
    let stateName = customer.param11 || '';

    this.loadStateList(stateName);
    
  }

  checkMobileNumber() {
    this.isMobileInvalid = this.editMobileNo.length !== 10;
  }

  checkAlternateMobileNumber() {
    this.isAltMobileInvalid = this.editAlternateMobileNo.length > 0 && this.editAlternateMobileNo.length !== 10;
  }

  validateEmail() {
    const emailRegex = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    this.isEmailInvalid = this.editEmailId.length > 0 && !emailRegex.test(this.editEmailId);
  }

  checkEditRemark() {
    this.isEditRemarkInvalid = this.editRemark.length < 10;
  }

  updateCustomer() {
    if (!this.editHolderName) {
      this.toastService.show('Please enter Holder Name', 'error');
      return;
    }
    // if (!this.editHolderType) {
    //   this.toastService.show('Please enter Holder Type', 'error');
    //   return;
    // }
    if (!this.editMobileNo || this.editMobileNo.length !== 10) {
      this.toastService.show('Please enter valid 10-digit Mobile No', 'error');
      return;
    }
    // if (this.editEmailId && !/^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/.test(this.editEmailId)) {
    //   this.toastService.show('Please enter valid Email ID', 'error');
    //   return;
    // }
    if (this.editRemark === '') {
      this.toastService.show('Remark Must have Minimum 10 Words', 'error');
      return;
    }
    // if (this.editAlternateMobileNo && this.editAlternateMobileNo.length !== 10) {
    //   jAlert('Please enter valid 10-digit Alternate Mobile No');
    //   return;
    // }
    // if (!this.editAddress) {
    //   jAlert('Please enter Address');
    //   return;
    // }
    // if (!this.editCity) {
    //   jAlert('Please enter City');
    //   return;
    // }
    // if (!this.editPinCode) {
    //   jAlert('Please enter Pin Code');
    //   return;
    // }
    //this.checkEditRemark();
    

    this.loading = true;
    const request = {
      param1: this.editCustomerId,
      param2: this.editHolderName,
      param3: this.editHolderType,
      param4: this.editMobileNo,
      param5: this.editEmailId,
      param6: this.editAlternateMobileNo,
      param7: this.editAddress,
      param8: this.cityObj ? this.cityObj.param2 : "",
      param9: this.editPinCode,
      param10: this.stateObj ? this.stateObj.param2 : "",
      param11: this.editRemark
    };

    this.permitHolderService.updatePermitHolder(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.toastService.show(response.entity, response.status ? 'success' : 'error');
        if (response.status && response.entity === 'Successfully updated.') {
          this.showEditModal = false;
          this.getCustomerDetails(this.currentPage);
        }
      },
      error: (error) => {
        this.loading = false;
        this.toastService.show('Error updating customer.', 'error');
      }
    });
  }

  // Delete Customer
  openDeleteModal(customer: any) {
    this.deleteCustomerId = customer.param2 || '';
    this.deleteHolderName = customer.param3 || '';
    this.deleteRemark = '';
    this.isDeleteRemarkInvalid = false;
    this.showDeleteModal = true;
  }

  checkDeleteRemark() {
    this.isDeleteRemarkInvalid = this.deleteRemark.length < 10;
  }

  deleteCustomer() {
    this.checkDeleteRemark();
    if (this.isDeleteRemarkInvalid) {
      this.toastService.show('Remark Must have Minimum 10 Words', 'error');
      //this.errorMessage = 'Remark Must have Minimum 10 Words';
      return;
    }

    if (!confirm('Are you sure to Delete Customer ' + this.deleteHolderName)) {
      return;
    }

    this.loading = true;
    this.permitHolderService.deletePermitHolder(
      this.encryptionService.encryptPassword(this.deleteCustomerId),
      this.deleteRemark
    ).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.status && response.entity.includes('Successfully')) {
          this.toastService.show(response.entity, response.status ? 'success' : 'error');
          this.showDeleteModal = false;
          this.getCustomerDetails(this.currentPage);
        }
      },
      error: (error) => {
        this.loading = false;
        this.toastService.show('Error deleting customer.', 'error');
      }
    });
  }

  back() {
    this.editRemark = '';
    this.deleteRemark = '';
    this.isEditRemarkInvalid = false;
    this.isDeleteRemarkInvalid = false;
    this.isMobileInvalid = false;
    this.isAltMobileInvalid = false;
    this.isEmailInvalid = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
  }
}

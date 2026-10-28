import { Component, OnInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
declare var $: any;
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { VendorService, Vendor, VendorRequest } from '../../../core/services/vendor.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { ToastService } from '../../../core/services/toast.service';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import {  DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
    selector: 'app-vendor-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, ToastComponent,
      CommonDataToolbarComponent, DataTableComponent, PaginationComponent],
    templateUrl: './vendor-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./vendor-list.component.scss']
})
export class VendorListComponent implements OnInit {
  vendors: Vendor[] = [];
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20];
  totalCount = 0;
  pageCount = 0;
  roleId: any;
  // Route parameters
  type: string = '';  // 'dashboard' or other
  counttype: string = '';  // 'Total', 'Active', etc.
  
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: DataTableColumn<Vendor>[] = [
    { header: '#', key: 'param1', className: 'id-column' },
    { header: 'Vendor Name', key: 'param4', sortKey: 'param4' },
    { header: 'MFG Code', key: 'param3', sortKey: 'param3' },
    { header: '', headers: ['Contact Person', 'Mobile No.'], sortKey: 'param16', value: vendor => this.joinValues(vendor.param16, vendor.param18) },
    { header: '', headers: ['CIN No.', 'GST No.'], sortKey: 'param10', value: vendor => this.joinValues(vendor.param10, vendor.param11), },
    { header: '', headers: ['Contact No.', 'Email ID'], sortKey: 'param15', width: '200px', value: vendor => this.joinValues(vendor.param15, vendor.param14) },
    { header: 'Address', key: 'param6', sortKey: 'param6' },
    { header: '', headers: ['City', 'State'], sortKey: 'param8', value: vendor => this.joinValues(vendor.param8, vendor.param9) },
    {
      header: 'Approval',
      key: 'param44',
      sortKey: 'param44',
      clickable: vendor => vendor.param44 === 'Not Approve'
    },
    { header: 'Status', key: 'param37' },
    {
      header: 'Activity',
      className: 'activity-column',
      visible: () => this.canManageVendors(),
      actions: [
        { label: 'Edit', className: 'table-action-btn table-action-edit', run: vendor => this.openEditModal(vendor), disabled: vendor => vendor.param37 !== 'Active' },
        { label: 'Delete', className: 'table-action-btn table-action-delete', run: vendor => this.openDeleteModal(vendor), disabled: vendor => vendor.param37 === 'Suspend' },
        { label: vendor => this.activeBlockLabel(vendor), className: 'table-action-btn table-action-toggle', run: vendor => this.openBlockModal(vendor) }
      ]
    }
  ];

  // State and City lists
  statelist: any[] = [];
  citylist: any[] = [];
  selectedStateId: string = '';
  
  // Modal data
  selectedVendor: Vendor | null = null;
  vendorName: string = '';
  mfgCode: string = '';
  cinNumber: string = '';
  gstNo: string = '';
  address: string = '';
  contactNo: string = '';
  emailId: string = '';
  stateName: string | null = null;
  cityName: string | null = null;
  contactPerson: string = '';
  mobileNo: string = '';
  updateRemark: string = '';
  vendorId: string = '';
  status: string = '';
  activeSuspend: string = 'Block';
  blockUnblock: string = 'block';
  withDealer: string = 'No';
  remarkForBlock: string = '';
  remarkForDelete: string = '';
  
  // Additional fields from original vendor (preserved when editing)
  panno: string = '';
  pincode: string = '';
  contactpersonemail: string = '';
  statusflag: string = '';
  ismobility: string = 'false';
  membershipno: string = '';
  membershipdate: string = '';
  tdsallowance: string = '0';
  
  showSmartMobDiv = false;

  // Template-driven form references
  @ViewChild('editForm') editForm!: NgForm;
  @ViewChild('deleteForm') deleteForm!: NgForm;
  @ViewChild('blockForm') blockForm!: NgForm;

  submittedEdit = false;
  submittedDelete = false;
  submittedBlock = false;

  formErrors: { [key: string]: boolean } = {};
  emailMessage: string = '';
  contactPersonEmailMessage: string = '';
  
  constructor(
    private vendorService: VendorService,
    private route: ActivatedRoute,
    private router: Router,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    public toastService: ToastService
  ) {
    this.toastService.pageName = 'Vendor Master Details'; // Set page name for toast service
  }

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleid');
    // Get route parameters
    this.route.params.subscribe(params => {
      this.type = params['type'] || '0';
      this.counttype = params['counttype'] || '0';
      // Reload vendors with new params
      this.loadVendors();
    });
    
    // Load state list
    this.loadStateList();
    // //console.log('VendorListComponent initialized with type:', this.type, 'counttype:', this.counttype);
  }
  activeBlockLabel(vendor: any): string {
    return vendor.param37 === 'Active' ? 'Block' : 'Active';
  }
  private joinValues(primary?: string, secondary?: string): string {
    const values = [primary, secondary].filter(value => value && value !== '0');
    return values.length ? values.join(' \n ') : '-';
  }
  canManageVendors(): boolean {
    return !['17', '18', '19'].includes(String(this.roleId));
  }
  onVendorCellClick(event: { row: Vendor; column: DataTableColumn<Vendor> }) {
    if (event.column.header === 'Approval' && event.row.param44 === 'Not Approve') {
      this.openApproveModal(event.row);
    }
  }

  loadVendors() {
    this.loading = true;
    this.errorMessage = '';

    const request: VendorRequest = {
      param1: this.searchText.trim(),
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString(),
      param4: this.counttype || ''  // Use counttype from route params (Total, Active, etc.)
    };

    this.vendorService.getVendorDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.vendors = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          
          // Calculate page count
          if (this.vendors.length < this.pageSize) {
            this.pageCount = this.vendors.length;
          } else {
            this.pageCount = this.pageSize;
          }
          
          // Update page size options
          this.updatePageSizeOptions();
        } else {
  // 🔥 IMPORTANT
  this.vendors = [];
  this.totalCount = 0;
  this.pageCount = 0;

  // Optional: clean UI
  this.errorMessage =
    typeof response.entity === 'string'
      ? response.entity
      : null;   // 👈 best UX
}
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error;
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

  onPageSizeChange(size: number | string) {
    if (size === 'All' || size === this.totalCount) {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }
    this.currentPage = 1;
    this.loadVendors();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadVendors();
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
    this.loadVendors();
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.loadVendors();
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    // Trigger change detection to re-render sorted data
    this.cdr.detectChanges();
  }

  loadStateList() {
    this.vendorService.getStateList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.statelist = response.entity;
        }
      },
      error: (error) => {
        this.errorMessage = error;
      }
    });
  }

  onStateChange() {
    this.cityName = null;
    this.citylist = [];
    
    if (this.stateName) {
      const state = this.statelist.find(s => s.param2 === this.stateName);
      if (state) {
        this.selectedStateId = state.param1;
        this.loadCityList(this.selectedStateId);
      }
    }
  }

  loadCityList(stateId: string) {
    this.vendorService.getCityList(stateId).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.citylist = response.entity;
        }
      },
      error: (error) => {
        this.errorMessage = error;
      }
    });
  }

  getManagedata(vendor: Vendor) {
    this.selectedVendor = vendor;
    this.vendorName = vendor.param4 || '';
    this.mfgCode = vendor.param3 || '';
    this.cinNumber = vendor.param10 || '';
    this.gstNo = vendor.param11 || '';
    this.address = vendor.param6 || '';
    this.contactNo = vendor.param15 || '';
    this.emailId = vendor.param14 || '';
    this.stateName = vendor.param9 || null;
    this.cityName = vendor.param8 || null;
    this.contactPerson = vendor.param16 || '';
    this.mobileNo = vendor.param18 || '';
    this.vendorId = this.encryptionService.encryptId(vendor.param2 || '');
    this.status = vendor.param37 || '';
    
    // Preserve additional fields that are not in the form
    // These will be read from the original vendor object when needed
    const vendorAny = vendor as any;
    this.panno = vendorAny.param12 || '';
    this.pincode = vendorAny.param13 || '';
    this.contactpersonemail = vendorAny.param17 || '';
    this.statusflag = vendorAny.param19 || '';
    this.ismobility = vendorAny.param22 === 'Yes' ? 'true' : 'false';
    this.membershipno = vendorAny.param23 || '';
    this.membershipdate = vendorAny.param24 || '';
    this.tdsallowance = vendorAny.param36 === '1' || vendorAny.param36 === 'Yes' ? '1' : '0';
    
    // Set active/suspend button text
    if (this.status === 'Active') {
      this.activeSuspend = 'Block';
      this.blockUnblock = 'block';
    } else {
      this.activeSuspend = 'Active';
      this.blockUnblock = 'unblock';
    }
    
    // Load city list if state is selected
    if (this.stateName) {
      // Find state ID from state name
      const state = this.statelist.find(s => s.param2 === this.stateName);
      if (state) {
        this.selectedStateId = state.param1 || '';
        this.loadCityList(this.selectedStateId);
      }
    }
  }

  openEditModal(vendor: Vendor) {
    this.getManagedata(vendor);
    this.updateRemark = '';
    $('#vendorEditModal').modal('show');
  }

  closeEditModal() {
    this.selectedVendor = null;
    this.submittedEdit = false;
    this.editForm?.resetForm();
    $('#vendorEditModal').modal('hide');
  }

  openDeleteModal(vendor: Vendor) {
    this.selectedVendor = vendor;
    this.vendorName = vendor.param4 || '';
    this.mfgCode = vendor.param3 || '';
    this.vendorId = this.encryptionService.encryptId(vendor.param2 || '');
    this.remarkForDelete = '';
    $('#vendorDeleteModal').modal('show');
  }

  closeDeleteModal() {
    this.selectedVendor = null;
    this.remarkForDelete = '';
    this.submittedDelete = false;
    this.deleteForm?.resetForm();
    $('#vendorDeleteModal').modal('hide');
  }

  openBlockModal(vendor: Vendor) {
    this.getManagedata(vendor);
    this.remarkForBlock = '';
    this.withDealer = 'No';
    $('#vendorBlockModal').modal('show');
  }

  closeBlockModal() {
    this.remarkForBlock = '';
    this.submittedBlock = false;
    this.blockForm?.resetForm();
    $('#vendorBlockModal').modal('hide');
  }

  openApproveModal(vendor: Vendor) {
    this.selectedVendor = vendor;
    this.vendorName = vendor.param4 || '';
    this.vendorId = this.encryptionService.encryptId(vendor.param2 || '');
    $('#vendorApproveModal').modal('show');
  }

  closeApproveModal() {
    this.selectedVendor = null;
    $('#vendorApproveModal').modal('hide');
  }

  editVendorData() {
    this.submittedEdit = true;
    this.editForm?.control.markAllAsTouched();
    // Validation
    if (!this.vendorName || !this.mfgCode || !this.cinNumber || !this.gstNo || 
        !this.address || !this.contactNo || !this.emailId || !this.stateName || 
        !this.cityName || !this.contactPerson || !this.mobileNo || !this.updateRemark ||
        this.updateRemark.length < 10) {
      this.errorMessage = 'Please fill all required fields. Remark must be at least 10 characters.';
      return;
    }
    
    // Email validation
    const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    if (!this.emailId.match(emailRegex)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }
    
    // Contact number validation
    const mobileRegex = /^[6-9][0-9]{9}$/;
    if (this.contactNo.length !== 10 || !mobileRegex.test(this.mobileNo)) {
      this.errorMessage = 'Contact No. must be 10 digits. Mobile No. must be 10 digits and start with 6-9.';
      return;
    }
    
    if (confirm('Are you sure you want to update this vendor?')) {
      this.loading = true;
      
      // Prepare edit vendor data matching original API format
      const vendorData = {
        param1: this.vendorId,
        param2: this.mfgCode,
        param3: this.vendorName,
        param4: this.mfgCode,
        param5: this.address,
        param6: this.address,
        param7: this.cityName,
        param8: this.stateName,
        param9: this.cinNumber,
        param10: this.gstNo,
        param11: this.panno, // Preserved from original
        param12: this.pincode, // Preserved from original
        param13: this.emailId,
        param14: this.contactNo,
        param15: this.contactPerson,
        param16: this.contactpersonemail, // Preserved from original
        param17: this.mobileNo,
        param18: this.statusflag, // Preserved from original
        param19: '', // empty
        param20: '', // empty
        param21: '', // empty
        param22: '', // empty
        param23: '', // empty
        param24: '', // empty
        param25: '', // empty
        param26: '', // empty
        param27: '', // empty
        param28: '', // empty
        param29: '', // empty
        param30: '', // empty
        param31: '', // empty
        param32: '', // empty
        param33: this.ismobility, // Preserved from original
        param34: this.membershipno === '---' ? '' : this.membershipno, // Preserved from original
        param35: this.membershipdate === '---' ? '' : this.membershipdate, // Preserved from original
        param36: this.tdsallowance, // Preserved from original
        param37: this.updateRemark
      };
      
      this.vendorService.editVendor(vendorData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status) {
            this.successMessage = response.entity || 'Vendor updated successfully';
            this.loadVendors();
            this.closeEditModal();
          } else {
            this.errorMessage = 'Failed to update vendor';
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error updating vendor:', error);
          this.errorMessage = error;
        }
      });
    }
  }

  deleteVendorData() {
    this.submittedDelete = true;
    this.deleteForm?.control.markAllAsTouched();
    if (!this.remarkForDelete || this.remarkForDelete.length < 10) {
      this.errorMessage = 'Remarks should be at least 10 characters';
      return;
    }
    
    if (confirm('Are you sure you want to delete this vendor?')) {
      this.vendorService.removeVendor(this.vendorId, this.remarkForDelete).subscribe({
        next: (response) => {
          if (response.status) {
            this.successMessage = response.entity || 'Vendor deleted successfully';
            this.loadVendors();
            this.closeDeleteModal();
          } else {
            this.errorMessage = 'Failed to delete vendor';
          }
        },
        error: (error) => {
          this.errorMessage = 'Error deleting vendor. Please try again.';
        }
      });
    }
  }

  blockUnblockDetails() {
    this.submittedBlock = true;
    this.blockForm?.control.markAllAsTouched();
    if (this.remarkForBlock.length < 10) {
      this.errorMessage = 'Remark should be at least 10 characters';
      return;
    }
    
    this.vendorService.blockUnblockVendor(
      this.vendorId,
      this.remarkForBlock,
      this.withDealer as 'Yes' | 'No',
      this.blockUnblock as 'block' | 'unblock'
    ).subscribe({
      next: (response) => {
        if (response.status) {
          this.successMessage = response.entity || 'Operation completed successfully';
          if (response.entity?.includes('Successfully')) {
            this.loadVendors();
            this.closeBlockModal();
          }
        } else {
          this.errorMessage = 'Operation failed';
        }
      },
      error: (error) => {
        this.errorMessage = error;
      }
    });
  }

  vendorApprove() {
    if (confirm('Are you sure you want to approve this vendor?')) {
      this.vendorService.approveVendor(this.vendorId).subscribe({
        next: (response) => {
          if (response.status) {
            this.successMessage = response.entity || 'Vendor approved successfully';
            this.loadVendors();
            this.closeApproveModal();
          } else {
            this.errorMessage = 'Failed to approve vendor';
          }
        },
        error: (error) => {
          this.errorMessage = 'Error approving vendor. Please try again.';
        }
      });
    }
  }

  goHome() {
    this.router.navigate(['/dashboard']);
  }

  getPaginatedVendors(): Vendor[] {
    // API already returns paginated data, so just sort if needed
    // Note: In a production app, sorting should be done server-side
    // For now, we do client-side sorting on the current page
    let sorted = [...this.vendors];
    if (this.sortKey) {
      sorted.sort((a: any, b: any) => {
        const aVal = String(a[this.sortKey] || '').toLowerCase();
        const bVal = String(b[this.sortKey] || '').toLowerCase();
        if (this.reverse) {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });
    }
    return sorted;
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
        pages.push(-1); // Ellipsis
        pages.push(total);
      } else if (this.currentPage >= total - 3) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(total);
      }
    }
    return pages;
  }

  shouldShowPage(page: number): boolean {
    return page !== -1;
  }

   onMfgCodeInput(event: any) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.mfgCode = input.value;
  }

  onAlphaNumericInput(event: any, fieldName: string) {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    input.value = sanitizedValue;
    
    if (fieldName === 'cinNumber') this.cinNumber = sanitizedValue;
    else if (fieldName === 'gstNo') this.gstNo = sanitizedValue;
    else if (fieldName === 'panno') this.panno = sanitizedValue;
  }

  allowAlphaNumericSpace(event: any) {
  const initialValue = event.target.value;

  // allow only alphabets, numbers and space
  event.target.value = initialValue.replace(/[^a-zA-Z0-9 ]/g, '');

  // update ngModel value
  this.vendorName = event.target.value;
}

  allowOnlyNumbers(event: any, fieldName: string) {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/[^0-9]/g, '');
    input.value = sanitizedValue;
    
    if (fieldName === 'contactNo') this.contactNo = sanitizedValue;
    else if (fieldName === 'mobileNo') this.mobileNo = sanitizedValue;
    else if (fieldName === 'pincode') this.pincode = sanitizedValue;
  }

  getFieldError(fieldName: string): boolean {
    return this.formErrors[fieldName] || false;
  }

  validateEmail() {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (this.emailId && !emailRegex.test(this.emailId)) {
      this.emailMessage = 'Invalid email format';
      this.formErrors['emailId'] = true;
    } else {
      this.emailMessage = '';
      this.formErrors['emailId'] = false;
    }
  }

  validateContactPersonEmail() {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (this.contactpersonemail && !emailRegex.test(this.contactpersonemail)) {
      this.contactPersonEmailMessage = 'Invalid email format';
      this.formErrors['contactpersonemail'] = true;
    } else {
      this.contactPersonEmailMessage = '';
      this.formErrors['contactpersonemail'] = false;
    }
  }

  validateMobileNo() {
    const mobileRegex = /^[6-9][0-9]{9}$/;
    if (this.mobileNo && !mobileRegex.test(this.mobileNo)) {
      this.formErrors['mobileNo'] = true;
    } else {
      this.formErrors['mobileNo'] = false;
    }
  }
}

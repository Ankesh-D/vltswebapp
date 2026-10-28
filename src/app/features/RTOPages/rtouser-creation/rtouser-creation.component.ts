import { Component, OnInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService, UserEntryRequest, User, UserRequest } from '../../../core/services/user.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import * as CryptoJS from 'crypto-js';
import Swal from 'sweetalert2';
import { ToastService } from '../../../core/services/toast.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;

@Component({
    selector: 'app-rtouser-creation',
    imports: [CommonModule, FormsModule, RouterModule, ToastComponent, CommonTableComponent],
    templateUrl: './rtouser-creation.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './rtouser-creation.component.scss'
})
export class RTOUserCreationComponent implements OnInit {
  // Form fields
  selectedRoleId: string = '';
  selectedRTOId: string = '';
  organizationName: string = '';
  organizationCode: string = '';
  contactPerson: string = '';
  mobileNo: string = '';
  alternateMobileNo: string = '';
  emailId: string = '';
  address: string = '';
  selectedDistrictId: string = '';
  selectedStateId: string = '';
  stateName: string = '';
  selectedCityId: string = '';
  cityName: string = '';
  pincode: string = '';
  loginName: string = '';
  password: string = '';
  confirmPassword: string = '';
  roleId: any;
  // Enforcement Location (conditional fields)
  poiIcon: string = '';
  latitude: string = '';
  longitude: string = '';
  range: string = '';
  showEnforcementLocation: boolean = false;
  showRTOList: boolean = false;
  poiIconImageUrl: string = '';
  passwordMessageStyle: any = {};

  // Dropdowns
  roleList: any[] = [];
  rtoList: any[] = [];
  stateList: any[] = [];
  districtList: any[] = [];
  cityList: any[] = [];

  // Validation
  loading = false;
  emailMessage = '';
  passwordMessage = '';
  confirmPasswordMessage = '';
  errorMessage: string | null = null;

  // Form validation flags
  formErrors: { [key: string]: boolean } = {};
  users: User[] = [];
  readonly tableColumns: CommonTableColumn<User>[] = [
    { key: 'index', label: '#', sortable: false },
    { key: 'param11', label: 'RTO Name', sortable: true },
    { key: 'param4', label: 'Contact Person', sortable: true },
    { key: 'param5', label: 'Mobile No.', sortable: true },
    { key: 'param6', label: 'Email ID', sortable: true },
    { key: 'param7', label: 'Address', sortable: true, width: '180px' },
    { key: 'param8', label: 'Pincode', sortable: true },
    { key: 'param10', label: 'Login Name', sortable: true },
    { key: 'param9', label: 'Created At', sortable: true },
    { key: 'param12', label: 'Action' }
  ];
  showEntryForm: boolean = false;

  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20];
  totalCount = 0;
  pageCount = 0;

  // Route parameters
  type: string = '';
  counttype: string = '';

  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  task: any | null = sessionStorage.getItem('roleid');

  constructor(
    private userService: UserService,
    private encryptionService: EncryptionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {
    this.toastService.pageName = 'User Creation';
  }

  ngOnInit() {
      this.roleId = sessionStorage.getItem('roleid');
      this.loadUsers();
      this.loadInitialData();
  }

  loadInitialData() {
    
    this.loadRoleList();
    this.loadStateList();
    this.loadRTORoster();
   
  }

  loadRoleList() {
    this.userService.getRoleListForUserEntry().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.roleList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading role list:', error);
      }
    });
  }

  loadRTORoster() {
    this.userService.getRTORoster().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.rtoList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading RTO list:', error);
      }
    });
  }

  loadStateList() {
    this.userService.getStateList().subscribe({
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

  onRoleChange() {
    // Show/hide RTO dropdown based on role
    // Show/hide enforcement location based on role
    // This logic depends on which roles require RTO or enforcement location
    const role = this.roleList.find(r => r.param1 === this.selectedRoleId);
    if (role) {
      // Show RTO if role requires it (adjust condition based on your requirements)
      // You may need to check role.param2 or role.param3 to determine if RTO is needed
      this.showRTOList = false; // Set to true for roles that need RTO

      // Show enforcement location for specific roles
      if (role.param2 && role.param2.toLowerCase().includes('enforcement')) {
        this.showEnforcementLocation = true;
      } else {
        this.showEnforcementLocation = false;
        this.poiIcon = '';
        this.latitude = '';
        this.longitude = '';
        this.range = '';
        this.poiIconImageUrl = '';
      }
    } else {
      this.showRTOList = false;
      this.showEnforcementLocation = false;
    }
  }

  onStateChange() {
    this.cityName = '';
    this.selectedCityId = '';
    this.cityList = [];
    this.districtList = [];
    this.selectedDistrictId = '';

    if (this.selectedStateId) {
      const state = this.stateList.find(s => s.param1 === this.selectedStateId);
      if (state) {
        this.stateName = state.param2;
      }
      this.loadDistrictList(this.selectedStateId);
    }
  }

  loadDistrictList(stateId: string) {
    this.userService.getDistrictList(stateId).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.districtList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading district list:', error);
      }
    });
  }

  onDistrictChange() {
    this.cityName = '';
    this.selectedCityId = '';
    this.cityList = [];

    if (this.selectedDistrictId && this.selectedStateId) {
      this.loadCityList(this.selectedStateId, this.selectedDistrictId);
    }
  }

  loadCityList(stateId: string, districtId: string) {
    this.userService.getCityList(stateId, districtId).subscribe({
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

  onCityChange() {
    if (this.selectedCityId) {
      const city = this.cityList.find(c => c.param1 === this.selectedCityId);
      if (city) {
        this.cityName = city.param2;
      }
    }
  }

  onRTOChange() {
    // Handle RTO selection if needed
  }

  onPoiIconChange() {
    // Handle POI icon selection - update image URL
    if (this.poiIcon) {
      // Construct image path based on POI icon name
      this.poiIconImageUrl = `/assets/images/poi/${this.poiIcon}.png`;
    } else {
      this.poiIconImageUrl = '';
    }
  }

  validatePassword() {
    // Password validation: minimum 8 characters, at least one letter and one number
    if (this.password && this.password.length < 8) {
      this.passwordMessage = 'Password must be at least 8 characters';
      this.passwordMessageStyle = { color: 'red' };
      this.formErrors['password'] = true;
    } else if (this.password && !/(?=.*[A-Za-z])(?=.*\d)/.test(this.password)) {
      this.passwordMessage = 'Password must contain at least one letter and one number';
      this.passwordMessageStyle = { color: 'red' };
      this.formErrors['password'] = true;
    } else if (this.password) {
      this.passwordMessage = 'Password is valid';
      this.passwordMessageStyle = { color: 'green' };
      this.formErrors['password'] = false;
    } else {
      this.passwordMessage = '';
      this.passwordMessageStyle = {};
      this.formErrors['password'] = false;
    }

    // Also validate confirm password
    this.validateConfirmPassword();
  }

  validateEmail() {
    const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    if (this.emailId && !emailRegex.test(this.emailId)) {
      this.emailMessage = 'Invalid email format';
      this.formErrors['emailId'] = true;
    } else {
      this.emailMessage = '';
      this.formErrors['emailId'] = false;
    }
  }

  validateConfirmPassword() {
    if (this.confirmPassword && this.password !== this.confirmPassword) {
      this.confirmPasswordMessage = 'Passwords do not match';
      this.formErrors['confirmPassword'] = true;
    } else {
      this.confirmPasswordMessage = '';
      this.formErrors['confirmPassword'] = false;
    }
  }

  validateMobileNo() {
    if (this.mobileNo && this.mobileNo.length !== 10) {
      this.formErrors['mobileNo'] = true;
    } else {
      this.formErrors['mobileNo'] = false;
    }
  }


  validatePincode() {
    // Pincode: exactly 6 digits
    if (this.pincode && (this.pincode.length !== 6 || !/^\d+$/.test(this.pincode))) {
      this.formErrors['pincode'] = true;
    } else {
      this.formErrors['pincode'] = false;
    }
  }

  validateForm(): boolean {
    this.formErrors = {};
    let isValid = true;

    // // Required field validations
    // if (!this.selectedRoleId || this.selectedRoleId === '') {
    //   this.formErrors['role'] = true;
    //   isValid = false;
    // // }

    // if (!this.organizationName || this.organizationName.trim() === '') {
    //   this.formErrors['organizationName'] = true;
    //   isValid = false;
    // }


    if (!this.contactPerson || this.contactPerson.trim() === '') {
      this.formErrors['contactPerson'] = true;
      isValid = false;
    }

    this.validateMobileNo();
    if (!this.mobileNo || this.mobileNo.trim() === '' || this.formErrors['mobileNo']) {
      this.formErrors['mobileNo'] = true;
      isValid = false;
    }

    // this.validatePincode();
    // if (!this.pincode || this.pincode.trim() === '' || this.formErrors['pincode']) {
    //   isValid = false;
    // }

    // Login details validation
    if (!this.loginName || this.loginName.trim() === '') {
      this.formErrors['loginName'] = true;
      isValid = false;
    }

    this.validatePassword();
    if (!this.password || this.password.trim() === '' || this.formErrors['password']) {
      this.formErrors['password'] = true;
      isValid = false;
    }

    this.validateConfirmPassword();
    if (!this.confirmPassword || this.confirmPassword.trim() === '' || this.formErrors['confirmPassword']) {
      this.formErrors['confirmPassword'] = true;
      isValid = false;
    }

    return isValid;
  }

  comparePasswords(): boolean {
    return this.password === this.confirmPassword;
  }

  clearFormErrors() {
    this.formErrors = {};
    this.emailMessage = '';
    this.passwordMessage = '';
    this.confirmPasswordMessage = '';
  }

  userEntry() {
    this.clearFormErrors();

    if (!this.validateForm()) {
      let msg = 'Please fill all required fields correctly.';
      this.errorMessage = msg;
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to submit this user entry?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, submit it!'
    }).then((result) => {
      if (result.isConfirmed) {
      this.loading = true;
      this.errorMessage = '';
      let userData: any = {};
      
      
      if(this.selectedRTOId == null || this.selectedRTOId == ''){ 
        // Encrypt
        const encryptedPassword =  this.encryptionService.encryptId(this.password).toString();
        const encryptedConfirmPassword =  this.encryptionService.encryptId(this.confirmPassword).toString();

      // Prepare user data matching API format
      userData = {
        "rtouserid": "",
        "rtoid": this.task || "",
        "contpersname": this.contactPerson || "",
        "contpersmobile": this.mobileNo || "",
        "contpersemailid": this.emailId || "",
        "contpersaddress": this.address || "",
        "pincode": this.pincode || "",
        "loginname": this.loginName || "",
        "password": encryptedPassword || "",
        "confirmpassword": encryptedConfirmPassword || ""
      };
    }
    else{
      // Encrypt role ID
      //const encryptedRoleId = this.encryptionService.encryptAccountId(this.selectedRoleId);
     const encryptedPassword =  this.encryptionService.encryptId(this.password).toString();;
        const encryptedConfirmPassword =  this.encryptionService.encryptId(this.confirmPassword).toString();

      // Prepare user data matching API format
      userData = {
        "rtouserid": "",
        "rtoid": this.selectedRoleId || "",
        "contpersname": this.contactPerson || "",
        "contpersmobile": this.mobileNo || "",
        "contpersemailid": this.emailId || "",
        "contpersaddress": this.address || "",
        "pincode": this.pincode || "",
        "loginname": this.loginName || "",
        "password": encryptedPassword || "",
        "confirmpassword": encryptedConfirmPassword || ""
      };
    }

      this.userService.putRTOUser(userData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status) {
            const message = typeof response.entity === 'string' ? response.entity : 'User created successfully';
            this.errorMessage = message;
            if (message === 'Successfully Saved.' || message.includes('Successfully')) {
              Swal.fire(
                'Submitted!',
                'User entry has been submitted.',
                'success'
              );
              this.resetForm();
              this.showEntryForm = false;
              this.loadUsers();
            }
          } else {
            this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Failed to create user';
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.entity || 'Error creating user';
          console.error('Error creating user:', error);
        }
      });
      }
    });
  }

  resetForm() {
    this.selectedRoleId = '';
    this.selectedRTOId = '';
    this.organizationName = '';
    this.organizationCode = '';
    this.contactPerson = '';
    this.mobileNo = '';
    this.alternateMobileNo = '';
    this.emailId = '';
    this.address = '';
    this.selectedDistrictId = '';
    this.selectedStateId = '';
    this.stateName = '';
    this.selectedCityId = '';
    this.cityName = '';
    this.pincode = '';
    this.loginName = '';
    this.password = '';
    this.confirmPassword = '';
    this.poiIcon = '';
    this.latitude = '';
    this.longitude = '';
    this.range = '';
    this.showEnforcementLocation = false;
    this.clearFormErrors();
  }

  getFieldError(fieldName: string): boolean {
    return this.formErrors[fieldName] || false;
  }

  goBack() {
    this.router.navigate(['/rtouser']);
  }

  loadUsers() { 
    this.loading = true;
    this.errorMessage = '';

    let request = {
      param1: this.searchText || '',
      param2: this.currentPage.toString(),
      param3: this.pageSize === this.totalCount ? 'All' : this.pageSize.toString(),
      param4: ''
    };

    this.userService.getRTOUserDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.users = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.users.length;
        } else {
          this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Failed to load users';
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error loading users';
        console.error('Error loading users:', error);
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.loadUsers();
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.loadUsers();
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }

    // Sort the users array
    this.users.sort((a, b) => {
      const aVal = (a as any)[key] || '';
      const bVal = (b as any)[key] || '';
      return this.reverse
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal));
    });
  }

  onPageSizeChange(size: any) {
    if (size === 'All') {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = parseInt(size, 10);
    }
    this.currentPage = 1;
    this.loadUsers();
  }

  getPaginatedUsers(): User[] {
    if (this.pageSize === this.totalCount || this.pageSize >= this.users.length) {
      return this.users;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.users.slice(start, end);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadUsers();
  }

  goHome() {
    this.router.navigate(['/dashboard']);
  }

  getTotalPages(): number {
    if (this.pageSize === 0 || this.totalCount === 0) return 0;
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  toggleView(showEntry: boolean) {
    this.showEntryForm = showEntry;
    if (showEntry) {
      this.resetForm();
    }
  }
  recordData: any;
  userName: any = "";
  activeSuspend: string = "";
  contactName: string = "";
  openStatusModal(data: any) {
      this.recordData = data;
      this.userName = data.param10;
      this.contactName = data.param4;
      this.activeSuspend = "Active";
      this.blockForm.resetForm();
      this.statusAction = (data.param12=='Deactivate' || data.param12=='Deleted') ? 'Activate' : 'Deactivate';
      $('#changeStatusModal').modal('show');
    }
  closeStatusModal() {
    $('#changeStatusModal').modal('hide');
  }
  remarkForStatus: string = "";
  statusAction: any;
  @ViewChild('blockForm') blockForm!: NgForm;
  activeDeactiveUser() {
    
    this.blockForm?.control.markAllAsTouched();
    if (this.remarkForStatus.length < 10) {
      this.errorMessage = 'Remark should be at least 10 characters';
      return;
    }
    let request = {
        param1: this.recordData.param2, // rtouserid
        param2: this.recordData.param3, // rtoid
        param3: this.statusAction, // status
        param4: this.remarkForStatus
    }
    this.userService.activeInactiveUSERs(request).subscribe({
      next: (response: any) => {
        if (response.statuscode==200) {
          // this.successMessage = response.entity || 'Operation completed successfully';
            this.loadUsers();
            this.closeStatusModal();
          
        } else {
          this.errorMessage = 'Operation failed';
        }
      }
    });
  }
}

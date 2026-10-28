import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService, UserEntryRequest } from '../../../core/services/user.service';
import { EncryptionService } from '../../../core/services/encryption.service';

@Component({
    selector: 'app-user-entry',
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './user-entry.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./user-entry.component.scss']
})
export class UserEntryComponent implements OnInit {
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
  errorMessage = '';
  emailMessage = '';
  passwordMessage = '';
  confirmPasswordMessage = '';
  
  // Form validation flags
  formErrors: { [key: string]: boolean } = {};
  
  constructor(
    private userService: UserService,
    private encryptionService: EncryptionService,
    private router: Router
  ) {}
  
  ngOnInit() {
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
  
  validateAlternateMobileNo() {
    if (this.alternateMobileNo && this.alternateMobileNo.length !== 10) {
      this.formErrors['alternateMobileNo'] = true;
    } else {
      this.formErrors['alternateMobileNo'] = false;
    }
  }
  
  validateOrganizationCode() {
    // Organization code: exactly 4 characters
    if (this.organizationCode && this.organizationCode.length !== 4) {
      this.formErrors['organizationCode'] = true;
    } else {
      this.formErrors['organizationCode'] = false;
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
    
    // Required field validations
    if (!this.selectedRoleId || this.selectedRoleId === '') {
      this.formErrors['role'] = true;
      isValid = false;
    }
    
    if (!this.organizationName || this.organizationName.trim() === '') {
      this.formErrors['organizationName'] = true;
      isValid = false;
    }
    
    this.validateOrganizationCode();
    if (!this.organizationCode || this.organizationCode.trim() === '' || this.formErrors['organizationCode']) {
      isValid = false;
    }
    
    if (!this.contactPerson || this.contactPerson.trim() === '') {
      this.formErrors['contactPerson'] = true;
      isValid = false;
    }
    
    this.validateMobileNo();
    if (!this.mobileNo || this.mobileNo.trim() === '' || this.formErrors['mobileNo']) {
      isValid = false;
    }
    
    this.validateAlternateMobileNo();
    if (!this.alternateMobileNo || this.alternateMobileNo.trim() === '' || this.formErrors['alternateMobileNo']) {
      isValid = false;
    }
    
    this.validateEmail();
    if (!this.emailId || this.emailId.trim() === '' || this.formErrors['emailId']) {
      isValid = false;
    }
    
    if (!this.address || this.address.trim() === '') {
      this.formErrors['address'] = true;
      isValid = false;
    }
    
    if (!this.selectedStateId || this.selectedStateId === '') {
      this.formErrors['state'] = true;
      isValid = false;
    }
    
    if (!this.selectedDistrictId || this.selectedDistrictId === '') {
      this.formErrors['district'] = true;
      isValid = false;
    }
    
    if (!this.selectedCityId || this.selectedCityId === '') {
      this.formErrors['city'] = true;
      isValid = false;
    }
    
    this.validatePincode();
    if (!this.pincode || this.pincode.trim() === '' || this.formErrors['pincode']) {
      isValid = false;
    }
    
    // Login details validation
    if (!this.loginName || this.loginName.trim() === '') {
      this.formErrors['loginName'] = true;
      isValid = false;
    }
    
    this.validatePassword();
    if (!this.password || this.password.trim() === '' || this.formErrors['password']) {
      isValid = false;
    }
    
    this.validateConfirmPassword();
    if (!this.confirmPassword || this.confirmPassword.trim() === '' || this.formErrors['confirmPassword']) {
      isValid = false;
    }
    
    // Enforcement location validation (if shown)
    if (this.showEnforcementLocation) {
      if (!this.poiIcon || this.poiIcon === '') {
        this.formErrors['poiIcon'] = true;
        isValid = false;
      }
      if (!this.latitude || this.latitude.trim() === '') {
        this.formErrors['latitude'] = true;
        isValid = false;
      }
      if (!this.longitude || this.longitude.trim() === '') {
        this.formErrors['longitude'] = true;
        isValid = false;
      }
      if (!this.range || this.range.trim() === '') {
        this.formErrors['range'] = true;
        isValid = false;
      }
    }
    
    return isValid;
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
      alert('Please fill all required fields correctly.');
      return;
    }
    
    if (confirm('Are you sure you want to submit this user entry?')) {
      this.loading = true;
      this.errorMessage = '';
      
      // Get RTO name if RTO is selected
      let rtoName = '';
      if (this.selectedRTOId) {
        const rto = this.rtoList.find(r => r.param1 === this.selectedRTOId);
        if (rto) {
          rtoName = rto.param2 || '';
        }
      }
      
      // Get district name
      let districtName = '';
      if (this.selectedDistrictId) {
        const district = this.districtList.find(d => d.param1 === this.selectedDistrictId);
        if (district) {
          districtName = district.param2 || '';
        }
      }
      
      // Encrypt role ID
      const encryptedRoleId = this.encryptionService.encryptAccountId(this.selectedRoleId);
      
      // Prepare user data matching API format
      const userData: UserEntryRequest = {
        param1: encryptedRoleId,  // roleId (encrypted)
        param2: this.organizationName || '',
        param3: this.organizationCode || '',
        param4: this.contactPerson || '',
        param5: this.emailId || '',
        param6: this.mobileNo || '',
        param7: this.alternateMobileNo || '',
        param8: this.address || '',
        param9: this.pincode || '',
        param10: this.loginName || '',
        param11: this.password || '',
        param12: this.selectedStateId || '',
        param13: this.selectedCityId || '',
        param14: this.cityName || '',
        param15: this.stateName || '',
        param16: districtName,
        param17: this.poiIcon || '',
        param18: this.range || '',
        param22: rtoName
      };
      
      this.userService.putUser(userData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status) {
            const message = typeof response.entity === 'string' ? response.entity : 'User created successfully';
            alert(message);
            if (message === 'Successfully Saved.' || message.includes('Successfully')) {
              this.resetForm();
              this.router.navigate(['/user']);
            }
          } else {
            this.errorMessage = typeof response.entity === 'string' ? response.entity : 'Failed to create user';
            alert(this.errorMessage);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.entity || 'Error creating user';
          alert('Error creating user: ' + this.errorMessage);
          console.error('Error creating user:', error);
        }
      });
    }
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
    this.router.navigate(['/user']);
  }
}

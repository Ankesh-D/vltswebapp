import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { VendorService } from '../../../core/services/vendor.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { HttpHeaders } from '@angular/common/http';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastService } from '../../../core/services/toast.service';

export interface VendorEntryRequest {
        param1:string; // Empty for new entry
        param2:string;
        param3:string;
        param4:string;
        param5:string;
        param6:string;
        param7:string;
        param8:string;
        param9:string;
        param10:string;
        param11:string;
        param12:number; // pincode (not in form)
        param13:string;
        param14:string;
        param15:string;
        param16:string; // contact person email (not in form)
        param17:string;
        param18:string; // status flag
        param19:string; // empty
        param20:string; // empty
        param21:string; // empty
        param22:string;
        param23:string;
        param24:string;
        param25:string; // empty
        param26:string; // empty
        param27:string; // empty
        param28:string; // empty
        param29:string; // empty
        param30:string; // empty
        param31:string; // empty
        param32:string; // empty
        param33:string;
        param34:string;
        param35:string;
        param36:string;
        param37:string;
}


@Component({
    selector: 'app-vendor-entry',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, ToastComponent],
    templateUrl: './vendor-entry.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./vendor-entry.component.scss']
})
export class VendorEntryComponent implements OnInit {
  // Form fields
  vendorName: string = '';
  mfgCode: string = '';
  cinNumber: string = '';
  gstNo: string = '';
  panNo: string = '';
  address: string = '';
  contactNo: string = '';
  emailId: string = '';
  selectedStateId: string | null = null;
  stateName: string = '';
  selectedCityId: string | null = null;
  cityName: string = '';
  contactPerson: string = '';
  mobileNo: string = '';
  tdsAllowance: string = 'No';
  isMobility: string = 'No';
  membershipNo: string = '';
  membershipDate: string = '';
  
  // Model Details
  modelName: string = '';
  modelCode: string = '';
  productionMonth: string = '';
  productionYear: string = '';
  certificateDate: string = '';
  certifiedAuthority: string = '';
  modelAuthorityList: any[] = [];
  certificateType: string = 'Type Approval Certificate';
  certificateFile: File | null = null;
  brochureFile: File | null = null;
  protocolFile: File | null = null;
  
  // State and City lists
  statelist: any[] = [];
  citylist: any[] = [];
  
  // Validation
  loading = false;
  
  gstMessage = '';
  emailMessage = '';
  contactPersonEmailMessage = '';
  usernameMessage = '';
  
  // Form validation flags
  formErrors: { [key: string]: boolean } = {};
  errorMessage: string | null = null;
  successMessage: string | null = null;
  username:string = "";
  password:string = "";
  confirmPassword = "";
  
  // Properties for password visibility and validation
  passwordFieldType: string = 'password';
  confirmPasswordFieldType: string = 'password';
  passwordMatchMessage: string = '';
  passwordValid = false;
  passwordsMatch = false;
  isDisable = true;
  pincode: string = '';
  contactpersonemail: string = "";
  submitted = false;
  @ViewChild('vendorForm') vendorForm!: NgForm;
  

  
  constructor(
    private vendorService: VendorService,
    private errorHandler: ErrorHandlerService,
    private router: Router, public encryptionService: EncryptionService,
    public toastService: ToastService
  ) {
    this.toastService.pageName = 'Vendor Entry'; // Set page name for toast service
  }

  ngOnInit() {
    this.loadStateList();
    
  }

  loadStateList() {
    this.vendorService.getStateList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.statelist = response.entity;
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to load state list';
      }
    });
  }
  resetForm() {
    //console.log('Resetting form and clearing all fields');
    this.vendorForm.resetForm();
    this.submitted = false;
    this.selectedStateId = null;
    this.selectedCityId = null;
    this.citylist = [];
    this.stateName = '';
    this.cityName = '';
    this.clearFormErrors();
  }

  onStateChange() {
    this.cityName = '';
    this.selectedCityId = null;
    this.citylist = [];
    this.stateName = '';
    
    if (this.selectedStateId) {
      // Find state name from state list
      const state = this.statelist.find(s => s.param1 === this.selectedStateId);
      if (state) {
        this.stateName = state.param2;
      }
      this.loadCityList(this.selectedStateId);
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
       this.errorMessage = 'Failed to load city list';
      }
    });
  }

  onCityChange() {
    this.cityName = '';
    if (this.selectedCityId) {
      const city = this.citylist.find(c => c.param1 === this.selectedCityId);
      if (city) {
        this.cityName = city.param2;
      }
    }
  }

  validateGST() {
    // GST validation: 15 characters, alphanumeric
    const gstRegex = /^[0-9A-Z]{15}$/;
    if (this.gstNo && !gstRegex.test(this.gstNo)) {
      this.gstMessage = 'Invalid GST format (15 alphanumeric characters)';
      this.formErrors['gstNo'] = true;
    } else {
      this.gstMessage = '';
      this.formErrors['gstNo'] = false;
    }
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

  validateUsername() {
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!this.username || this.username.trim() === '') {
      this.usernameMessage = 'Username is required';
      this.formErrors['username'] = true;
    } else if (this.username.length < 4) {
      this.usernameMessage = 'Min 4 characters required';
      this.formErrors['username'] = true;
    } else if (!usernameRegex.test(this.username)) {
      this.usernameMessage = 'Only alphanumeric allowed (no spaces)';
      this.formErrors['username'] = true;
    } else {
      this.usernameMessage = '';
      this.formErrors['username'] = false;
    }
  }

  validatePAN() {
    // PAN validation: 10 characters, alphanumeric
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (this.panNo && this.panNo.length < 10) {
      this.formErrors['panNo'] = true;
    } else if (this.panNo && !panRegex.test(this.panNo)) {
      this.formErrors['panNo'] = true;
    } else {
      this.formErrors['panNo'] = false;
    }
  }

  validateContactNo() {
    // Contact number: 10-12 digits
    if (this.contactNo && (this.contactNo.length < 10 || this.contactNo.length > 12)) {
      this.formErrors['contactNo'] = true;
    } else {
      this.formErrors['contactNo'] = false;
    }
  }

  validateMobileNo() {
    // Mobile number: exactly 10 digits, starts with 6-9
    const mobileRegex = /^[6-9][0-9]{9}$/;
    if (this.mobileNo && !mobileRegex.test(this.mobileNo)) {
      this.formErrors['mobileNo'] = true;
    } else {
      this.formErrors['mobileNo'] = false;
    }
  }

  validateAddress() {
    // Address: minimum 10 characters
    if (this.address && this.address.length < 10) {
      this.formErrors['address'] = true;
    } else {
      this.formErrors['address'] = false;
    }
  }

  validateMFGCode() {
    // MFG Code: exactly 4 alphanumeric characters, no spaces
    const mfgRegex = /^[A-Z0-9]{4}$/;
    if (this.mfgCode && !mfgRegex.test(this.mfgCode)) {
      this.formErrors['mfgCode'] = true;
    } else {
      this.formErrors['mfgCode'] = false;
    }
  }

  onMobilityChange() {
    if (this.isMobility === 'No') {
      this.membershipNo = '';
      this.membershipDate = '';
    }
  }

  verifyPassword() {
    const password = this.password;
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    this.passwordValid = hasMinLength && hasUpperCase && hasSpecialChar && hasNumber;
    
    if (!this.passwordValid) {
      this.errorMessage = 'Password must have at least 8 characters, 1 uppercase, 1 special character & 1 number';
      this.isDisable = true;
    } else {
      this.errorMessage = '';
      this.validatePasswordMatch();
    }
  }

  /**
   * Toggles the visibility of password fields.
   * @param field The field to toggle ('password' or 'confirm').
   */
  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    } else {
      this.confirmPasswordFieldType = this.confirmPasswordFieldType === 'password' ? 'text' : 'password';
    }
  }

  /**
   * Validates if the password and confirm password fields match.
   */
  validatePasswordMatch(): void {
    if (this.password && this.confirmPassword && this.password !== this.confirmPassword) {
      this.passwordMatchMessage = 'Passwords do not match.';
    } else {
      this.passwordMatchMessage = '';
    }
  }

  onFileSelected(event: Event, fileType: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        this.errorMessage = 'Only PDF files are allowed.';
        input.value = '';
        return;
      }
      if (fileType === 'certificate') {
        this.certificateFile = file;
      } else if (fileType === 'brochure') {
        this.brochureFile = file;
      } else if (fileType === 'protocol') {
        this.protocolFile = file;
      }
    }
  }

  // validateForm(): boolean {
  //   this.formErrors = {};
  //   let isValid = true;

  //   // Required field validations
  //   if (!this.vendorName || this.vendorName.trim() === '') {
  //     this.formErrors['vendorName'] = true;
  //     isValid = false;
  //   }

  //   if (!this.mfgCode || this.mfgCode.trim() === '') {
  //     this.formErrors['mfgCode'] = true;
  //     isValid = false;
  //   } else {
  //     this.validateMFGCode();
  //     if (this.formErrors['mfgCode']) isValid = false;
  //   }

  //   if (!this.cinNumber || this.cinNumber.trim() === '') {
  //     this.formErrors['cinNumber'] = true;
  //     isValid = false;
  //   }

  //   if (!this.gstNo || this.gstNo.trim() === '') {
  //     this.formErrors['gstNo'] = true;
  //     isValid = false;
  //   } else {
  //     this.validateGST();
  //     if (this.formErrors['gstNo']) isValid = false;
  //   }

  //   if (!this.panNo || this.panNo.trim() === '') {
  //     this.formErrors['panNo'] = true;
  //     isValid = false;
  //   } else {
  //     this.validatePAN();
  //     if (this.formErrors['panNo']) isValid = false;
  //   }

  //   this.validateAddress();
  //   if (this.formErrors['address']) isValid = false;

  //   this.validateContactNo();
  //   if (this.formErrors['contactNo']) isValid = false;

  //   if (!this.emailId || this.emailId.trim() === '') {
  //     this.formErrors['emailId'] = true;
  //     isValid = false;
  //   } else {
  //     this.validateEmail();
  //     if (this.formErrors['emailId']) isValid = false;
  //   }

  //   if (!this.selectedStateId || this.selectedStateId.trim() === '') {
  //     this.formErrors['stateName'] = true;
  //     isValid = false;
  //   }

  //   if (!this.selectedCityId || this.selectedCityId.trim() === '') {
  //     this.formErrors['cityName'] = true;
  //     isValid = false;
  //   }

  //   if (!this.contactPerson || this.contactPerson.trim() === '') {
  //     this.formErrors['contactPerson'] = true;
  //     isValid = false;
  //   }

  //   this.validateMobileNo();
  //   if (this.formErrors['mobileNo']) isValid = false;

  //   if (!this.contactpersonemail || this.contactpersonemail.trim() === '') {
  //     this.formErrors['contactpersonemail'] = true;
  //     isValid = false;
  //   } else {
  //     this.validateContactPersonEmail();
  //     if (this.formErrors['contactpersonemail']) isValid = false;
  //   }

  //   // Smart Mobility validation
  //   if (this.isMobility === 'Yes') {
  //     if (!this.membershipNo || this.membershipNo.trim() === '') {
  //       this.formErrors['membershipNo'] = true;
  //       isValid = false;
  //     }
  //     if (!this.membershipDate || this.membershipDate.trim() === '') {
  //       this.formErrors['membershipDate'] = true;
  //       isValid = false;
  //     }
  //   }

  //   this.validateUsername();
  //   if (this.formErrors['username']) isValid = false;

  //   if (!this.password || this.password.trim() === '') {
  //     this.formErrors['password'] = true;
  //     isValid = false;
  //   }

  //   if (!this.confirmPassword || this.confirmPassword.trim() === '') {
  //     this.formErrors['confirmPassword'] = true;
  //     isValid = false;
  //   }

  //   this.validatePasswordMatch();
  //   if (this.passwordMatchMessage) {
  //     isValid = false;
  //   }

  //   return isValid;
  // }

  clearFormErrors() {
    this.formErrors = {};
    this.gstMessage = '';
    this.emailMessage = '';
    this.contactPersonEmailMessage = '';
    this.usernameMessage = '';
    this.passwordMatchMessage = '';
  }

  vendorEntry() {
    // this.submitted = true;
    // this.clearFormErrors();
    // this.vendorForm?.control.markAllAsTouched();
    
    // if (!this.validateForm()) {
    //   this.errorMessage = 'Please fill all required fields correctly.';
    //   return;
    // }
    if(this.vendorForm.invalid) {
      this.submitted = false;
      return;
    }

    if (confirm('Are you sure you want to submit this vendor entry?')) {
      this.loading = true;
      this.errorMessage = '';
      const principalkey = sessionStorage.getItem('principalKey') || '';

       // Encrypt credentials: username::password::sessionid::authToken
    const authData = this.encryptionService.encryptId(
      this.username + '::' + this.password
    );

      // Prepare vendor data matching API format
      const vendorData: VendorEntryRequest = {
        param1: '', // Empty for new entry
        param2: this.mfgCode,
        param3: this.vendorName,
        param4: this.mfgCode,
        param5: this.address,
        param6: this.address,
        param7: this.cityName,
        param8: this.stateName,
        param9: this.cinNumber,
        param10: this.gstNo,
        param11: this.panNo,
        param12: this.pincode ? Number(this.pincode) : 0, // pincode
        param13: this.emailId,
        param14: this.contactNo,
        param15: this.contactPerson,
        param16: this.contactpersonemail, // contact person email (not in form)
        param17: this.mobileNo,
        param18: '', // status flag
        param19: '', // empty
        param20: '', // empty
        param21: '', // empty
        param22: this.isMobility === 'Yes' ? 'Yes' : 'No',
        param23: this.isMobility === 'Yes' ? this.membershipNo : '',
        param24: this.isMobility === 'Yes' ? this.membershipDate : '',
        param25: '', // empty
        param26: '', // empty
        param27: '', // empty
        param28: '', // empty
        param29: '', // empty
        param30: '', // empty
        param31: '', // empty
        param32: '', // empty
        param33: this.isMobility === 'Yes' ? 'true' : 'false',
        param34: this.isMobility === 'Yes' ? this.membershipNo : '',
        param35: this.isMobility === 'Yes' ? this.membershipDate : '',
        param36: this.tdsAllowance === 'Yes' ? '1' : '0',
        param37: '' // remark (not required for new entry)
      };

       const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authentication': authData,
            'headerkey': principalkey
          });
      
          this.vendorService.post<any>('/psv_put_vendor', vendorData, headers).subscribe({
            next: (response) => {
          this.loading = false;
          if (response.statuscode==200) {

            this.successMessage = response.entity;
            setTimeout(() => {              
              this.router.navigate(['/VendorDetails/dashboard/Total']);
            }, 3000);
          } else {
            this.errorMessage = response.entity || 'Failed to create vendor';
            // alert(this.errorMessage);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = this.errorHandler.getErrorMessage(error);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['VendorDetails/:type/:counttype']);
  }

  getFieldError(fieldName: string): boolean {
    return this.formErrors[fieldName] || false;
  }

  onMfgCodeInput(event: any) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    this.mfgCode = input.value;
  }

  onAlphaNumericInput(event: any, fieldName: string) {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    input.value = sanitizedValue;
    
    if (fieldName === 'cinNumber') this.cinNumber = sanitizedValue;
    else if (fieldName === 'gstNo') this.gstNo = sanitizedValue;
    else if (fieldName === 'panNo') this.panNo = sanitizedValue;
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
}

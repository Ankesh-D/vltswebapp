import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { DealerService } from '../../../core/services/dealer.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { NgSelectModule } from '@ng-select/ng-select';

declare var $: any;
declare var jAlert: any;

@Component({
  selector: 'app-vendor-user-creation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingComponent, ErrorMessageComponent, NgSelectModule],
  templateUrl: './vendor-user-creation.component.html',
  styleUrls: ['./vendor-user-creation.component.scss']
})
export class VendorUserCreationComponent implements OnInit, AfterViewInit {
  selectedRole: any = null;
  selectedDealer: any = null;
  selectedRoleId: string = '';
  selectedDealerId: string = '';
  userName: string = '';
  contactNo: string = '';
  alternateContactNo: string = '';
  emailId: string = '';
  address: string = '';
  stateId: string = '';
  cityId: string = '';
  loginName: string = '';
  password: string = '';
  confirmPassword: string = '';
  
  roleList: any[] = [];
  dealerList: any[] = [];
  stateList: any[] = [];
  cityList: any[] = [];
  
  dealerInfo: any = null;
  showDealerInfo: boolean = false;
  showUserForm: boolean = false;
  showLoginForm: boolean = false;
  
  loading = false;
  errorMessage = '';
  passwordMessage = '';
  confirmPasswordMessage = '';
  
  passwordValid = false;
  passwordsMatch = false;
  isDisable = true;
  
  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private dealerService: DealerService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.loadRoleList();
    this.loadStateList();
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
        $('#rolelist').on('change', (e: any) => {
          this.selectedRoleId = e.target.value;
          this.onRoleChange();
        });
        $('#dealerlist').on('change', (e: any) => {
          this.selectedDealerId = e.target.value;
          this.onDealerChange();
        });
        $('#statelist').on('change', (e: any) => {
          this.stateId = e.target.value;
          this.loadCityList(this.stateId);
        });
        $('#cityname').on('change', (e: any) => {
          this.cityId = e.target.value;
        });
      }
    }, 200);
  }
  
  loadRoleList() {
    this.loading = true;
    this.roleService.getRoleDetails({ param1: '', param2: '1', param3: '1000' }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.roleList = response.entity.listData || [];
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#rolelist').select2();
          }
        }, 100);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading role list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  onRoleChange() {
    if (this.selectedRole) {
      // Check if role requires dealer selection
      const role = this.roleList.find(r => r.param1 === this.selectedRole);
      if (role && (role.param2 =='13')) {
        this.showUserForm = true;
        
        this.loadDealerList();
      } else {
        this.showUserForm = true;
        this.showDealerInfo = false;
      }
    } else {
      this.showUserForm = false;
      this.showLoginForm = false;
      this.showDealerInfo = false;
    }
  }
  
  loadDealerList() {
    this.loading = true;
    this.dealerService.getDealerDetails({ param1: '', param2: '1', param3: '1000', param4: '' }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.dealerList = response.entity.listData || [];
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#dealerlist').select2();
          }
        }, 100);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading dealer list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  onDealerChange() {
    if (this.selectedDealer) {
      //console.log('Selected Dealer ID:', this.selectedDealer);
      const dealer = this.dealerList.find(d => d.param2 == this.selectedDealer.param2);
      //console.log('Selected Dealer:', dealer);
      if (dealer) {
        this.dealerInfo = {
          dealername: dealer.param3 || '',
          contactperson: dealer.param5 || '',
          mobileno: dealer.param6 || '',
          alternateno: dealer.param7 || '',
          emailid: dealer.param8 || '',
          address: dealer.param9 || '',
          city: dealer.param11 || '',
          state: dealer.param12 || ''
        };
        this.showDealerInfo = true;
        this.showLoginForm = true;
      }
    } else {
      this.showDealerInfo = false;
      this.showLoginForm = false;
    }
  }
  
  loadStateList() {
    this.userService.getStateList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.stateList = response.entity;
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#statelist').select2();
          }
        }, 100);
      },
      error: (error) => {
        console.error('Error loading state list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  loadCityList(stateId: string) {
    if (!stateId) return;
    
    this.loading = true;
    this.userService.getCityList(stateId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.cityList = response.entity;
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#cityname').select2();
          }
        }, 100);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading city list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  blurExpression() {
    // Validation on blur
  }
  
  checkAlternumber() {
    // Alternate number validation
  }
  
  validateMail() {
    // Email validation
  }
  
  verifyPassword() {
    const password = this.password;
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    this.passwordValid = hasMinLength && hasUpperCase && hasSpecialChar && hasNumber;
    
    if (!this.passwordValid) {
      this.passwordMessage = 'Password must have at least 8 characters, 1 uppercase, 1 special character & 1 number';
      this.isDisable = true;
    } else {
      this.passwordMessage = '';
      this.checkPasswordsMatch();
    }
  }
  
  checkPasswordsMatch() {
    if (this.confirmPassword) {
      this.passwordsMatch = this.password === this.confirmPassword;
      this.confirmPasswordMessage = this.passwordsMatch ? '' : 'Passwords do not match';
      this.checkFormValid();
    }
  }
  
  checkFormValid() {
    this.isDisable = !(
      this.selectedRoleId &&
      this.userName &&
      this.contactNo &&
      this.emailId &&
      this.address &&
      this.stateId &&
      this.cityId &&
      this.loginName &&
      this.passwordValid &&
      this.passwordsMatch
    );
  }
  
  submit() {
    if (!this.selectedRoleId || !this.userName || !this.contactNo || !this.emailId || !this.address || !this.stateId || !this.cityId) {
      jAlert('Please fill all required user fields');
      return;
    }
    
    if (!this.loginName || !this.password || !this.confirmPassword) {
      jAlert('Please fill all required login fields');
      return;
    }
    
    if (!this.passwordValid) {
      jAlert('Please enter a valid password');
      return;
    }
    
    if (!this.passwordsMatch) {
      jAlert('Passwords do not match');
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    const encryptedRoleId = this.encryptionService.encryptAccountId(this.selectedRoleId);
    const encryptedDealerId = this.selectedDealerId ? this.encryptionService.encryptAccountId(this.selectedDealerId) : '';
    const encryptedStateId = this.encryptionService.encryptAccountId(this.stateId);
    const encryptedCityId = this.encryptionService.encryptAccountId(this.cityId);
    
    const request = {
      param1: encryptedRoleId,
      param2: encryptedDealerId,
      param3: this.userName.trim(),
      param4: this.contactNo.trim(),
      param5: this.alternateContactNo.trim(),
      param6: this.emailId.trim(),
      param7: this.address.trim(),
      param8: encryptedStateId,
      param9: encryptedCityId,
      param10: this.loginName.trim(),
      param11: this.password
    };
    
    this.userService.createVendorUser(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          jAlert('Vendor user created successfully.');
          this.resetForm();
        } else {
          this.errorMessage = typeof response?.entity === 'string' ? response.entity : 'Failed to create vendor user';
          jAlert(this.errorMessage);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity || 'Error creating vendor user';
        jAlert(this.errorMessage);
        console.error('Error creating vendor user:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  resetForm() {
    this.selectedRoleId = '';
    this.selectedDealerId = '';
    this.userName = '';
    this.contactNo = '';
    this.alternateContactNo = '';
    this.emailId = '';
    this.address = '';
    this.stateId = '';
    this.cityId = '';
    this.loginName = '';
    this.password = '';
    this.confirmPassword = '';
    this.passwordMessage = '';
    this.confirmPasswordMessage = '';
    this.passwordValid = false;
    this.passwordsMatch = false;
    this.isDisable = true;
    this.dealerInfo = null;
    this.showDealerInfo = false;
    this.showUserForm = false;
    this.showLoginForm = false;
    
    if (typeof $ !== 'undefined') {
      $('#rolelist').val('').trigger('change');
      $('#dealerlist').val('').trigger('change');
      $('#statelist').val('').trigger('change');
      $('#cityname').val('').trigger('change');
    }
  }
}

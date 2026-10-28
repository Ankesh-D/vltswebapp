import { VahanService } from './../../../core/services/vahan.service';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { RoleService } from '../../../core/services/role.service';
import { UserService } from '../../../core/services/user.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { HttpClient } from '@angular/common/http';

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-reset-password',
    imports: [CommonModule, FormsModule, LoadingComponent, ErrorMessageComponent, NgSelectModule, ToastComponent],
    templateUrl: './reset-password.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, AfterViewInit {

selectedRtoId: string | null = null;
rtoList: any[] = [];

  selectedRoleId: string | null = null;
  selectedLoginName: string | null = null;
  oldPassword: string = '';
  newPassword: string = '';
  reEnterPassword: string = '';
  
  roleList: any[] = [];
  loginNameList: any[] = [];
  
  loading = false;
  passwordMessage = '';
  changePasswordMessage: string = '';
  
  passwordValid = false;
  passwordsMatch = false;
  isDisable = true;
   errorMessage: string | null = null;
  successMessage: string | null = null;

  showOtpPopup = false;
  otp = '';
  otpError = false;
  verifyingOtp = false;

  showNewPassword = false;
  showReEnterPassword = false;
  roleId: any;

  constructor(private http: HttpClient,
    private VahanService: VahanService,
    private authService: AuthService,
    private roleService: RoleService,
    private userService: UserService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {
    this.toastService.pageName = 'Reset Password'; // Set page name for toast service
  }
  
  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleid');
    this.loadRoleList();
    if(this.roleId=='19') {
      this.selectedRoleId = '19';
      this.loadUserList('');
    }
    
  }
  
  ngAfterViewInit() {
    // ng-select handles its own initialization. jQuery and select2 are no longer needed.
  }
  roleName: string = "";
  onRoleChange(event: any) {
  this.newPassword = '';
  this.reEnterPassword = '';
  this.changePasswordMessage = '';
  this.loginNameList = [];
  this.rtoList = [];
  this.selectedLoginName = null;
  this.selectedRtoId = null;
  if (!this.selectedRoleId) return;
  this.roleName = event.param3;
  if(this.selectedRoleId === '19' || this.selectedRoleId === '191') {
    this.loadRtoList();
  } else {
    this.loadUserList('');
  }

  // if(this.roleId=='19') {
  //   this.loadUserList('');
  //   return;
  // }

  


  // 👇 Only if role = MVI (check your roleId)
  // if (this.selectedRoleId === '191') {//mvi
  //   this.loadRtoList();
  // } else  if(this.selectedRoleId === '1') {

  // } else {
  //   // direct user list
  //   // this.loadUserList('');
  // }
  
}
loadVendorList() {}
loadDealerList() {}
loadOEMList() {

}


loadRtoList() {
  this.loading = true;

  this.VahanService.getSubRTORoster('')   // ✅ correct
    .subscribe({
      next: (res) => {
        this.loading = false;

        if (res.status) {
          this.rtoList = res.entity;
        } else {
          this.rtoList = [];
        }
      },
      error: () => {
        this.loading = false;
      }
    });
}
onRtoChange() {
  if (!this.selectedRtoId) return;
  console.log('Selected RTO ID:', this.selectedRtoId);
  this.loadUserList(this.selectedRtoId);
}
loadUserList(filterId: string) {
  this.loading = true;

  this.userService.getUserRoster({
    param1: this.selectedRoleId ? this.selectedRoleId : '',
    param2: '',
    param3: filterId   // 🔥 yahi main change hai
  }).subscribe({
    next: (res) => {
      this.loading = false;

      if (res.statuscode==200) {
        this.loginNameList = res.entity;
        // this.toastService.show('Users loaded successfully', 'success');
      } else {
        this.toastService.show('No users found', 'error');
        this.loginNameList = [];
      }
    },
    error: () => {
      this.loading = false;
    }
  });
}
  loadRoleList() {
    this.loading = true;
    let filter = "";
    if(this.roleId=='19') {
      filter = 'resetpasswordbyrto'
    } else {
      filter = "";
    }
    this.roleService.getRoleDetails({ param1: filter, param2: '', param3: '' }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          let roleList = response.entity.listData || [];

          if(this.roleId=='18' || this.roleId=='17') {
            this.roleList = roleList.filter((item: any) => item.param2 == '191' || item.param2 == '19');
          }
          // if(this.roleId=='17') {
          //   this.roleList = roleList.filter((item: any) => item.param2 == '191' || item.param2 == '19' || item.param2 == '61' ||  item.param2 == '13' ||  item.param2 == '11');
          // }
          if(this.roleId=='19') {
            this.roleList = roleList.filter((item: any) => item.param2 == '191');
          }
          if(this.roleId=='10') {
            this.roleList = roleList;
          }
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
  
//  onRoleChange() {
//     this. loginNameList = [];
//   if (!this.selectedRoleId) {
//     this.loginNameList = [];
//     this.selectedLoginName = null;
//     this.isDisable = true;
//     return;
//   }

//   this.loading = true;

//  this.userService.getUserRoster({
//   param1: this.selectedRoleId,
//   param2: ''
// }).subscribe({
//     next: (res) => {
  
//       this.loading = false;

//       if (res.status && res.entity) {
//         this.loginNameList = res.entity;
//       } else {
//         this.loginNameList = [];
//         this.toastService.show('No users found', 'error');
//       }
//     },
//     error: () => {
//       this.loading = false;
//       this.toastService.show('Error loading users', 'error');
//     }
//   });
// }
  
  verifyPassword() {
    const password = this.newPassword;
    // Password must be at least 8 characters, 1 uppercase, 1 special character, 1 number
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
    if (this.reEnterPassword) {
      this.passwordsMatch = this.newPassword === this.reEnterPassword;
      this.changePasswordMessage = this.passwordsMatch ? '' : 'Passwords do not match';
      this.checkFormValid();
    }
  }
  
  checkFormValid() {
    this.isDisable = !(
      this.selectedRoleId &&
      this.selectedLoginName &&
      // this.oldPassword && // Field is commented out in HTML
      this.passwordValid &&
      this.passwordsMatch
    );
  }
  
changePassword() {
  if (!this.selectedRoleId || !this.selectedLoginName) {
    this.toastService.show('Please select Role and Login Name', 'error');
    return;
  }

  if (!this.newPassword || !this.reEnterPassword) {
    this.toastService.show('Please enter password', 'error');
    return;
  }

  if (this.newPassword !== this.reEnterPassword) {
    this.toastService.show('Passwords do not match', 'error');
    return;
  }

  const selectedUser = this.loginNameList.find(
    u => u.param1 === this.selectedLoginName
  );

  const loginId = selectedUser?.param1;
  const ownerSid = selectedUser?.param3;

  this.loading = true;
 this.userService.resetPassword({param1: loginId, param2: ownerSid, param3: this.encryptionService.encryptPassword(this.newPassword)}).subscribe({
    next: (res) => {
      this.loading = false;

      if (res.statuscode==200) {
        this.toastService.show(
          res.entity || 'Password reset successfully',
          'success'
        );
        this.resetForm();
      } else {
        this.toastService.show(
          res.entity || 'Failed to reset password',
          'error'
        );
      }
    },
    error: (err) => {
      this.loading = false;
      this.toastService.show(
        err?.error?.entity || 'Server error',
        'error'
      );
    }
  });
}

 
  resetForm() {
    this.selectedRoleId = null;
    this.selectedLoginName = null;
    this.oldPassword = '';
    this.newPassword = '';
    this.reEnterPassword = '';
    this.passwordMessage = '';
    this.changePasswordMessage = '';
    this.passwordValid = false;
    this.passwordsMatch = false;
    this.isDisable = true;
    this.showOtpPopup = false;
    this.showNewPassword = false;
    this.showReEnterPassword = false;
    if(this.roleId=='19') {
      this.selectedRoleId = '19';
      this.loadUserList('');
    }
    
    // With ngModel binding, simply resetting the properties is enough.
  }
}

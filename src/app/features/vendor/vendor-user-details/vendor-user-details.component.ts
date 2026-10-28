import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { UserService as UserServiceForState } from '../../../core/services/user.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-vendor-user-details',
    imports: [CommonModule, FormsModule, RouterModule, LoadingComponent, ErrorMessageComponent, CommonTableComponent],
    templateUrl: './vendor-user-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./vendor-user-details.component.scss']
})
export class VendorUserDetailsComponent implements OnInit, AfterViewInit {
  vendorUserList: any[] = [];
  loading = false;
  errorMessage = '';
  searchText = '';
  
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  
  sortKey: string = '';
  reverse: boolean = false;
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#', width: '20px', value: user => user.param1?.length > 0 ? user.param1 : 'NA' },
    { key: 'param5', label: 'User Name', sortable: true, value: user => user.param5?.length > 0 ? user.param5 : 'NA' },
    { key: 'param7', headers: ['Mobile No.', 'Alternate No.'], sortable: true, value: user => user.param7?.length > 0 ? user.param7 : 'NA' },
    { key: 'param6', label: 'Email Id', sortable: true, value: user => user.param6?.length > 0 ? user.param6 : 'NA' },
    { key: 'param9', label: 'Address', sortable: true, value: user => user.param9?.length > 0 ? user.param9 : 'NA' },
    { key: 'location', headers: ['State', 'City'], sortable: true, sortKey: 'param19' },
    { key: 'statusActivity', label: 'Status', subLabel: 'Activity', sortable: true, sortKey: 'param20' }
  ];
  
  // Edit modal
  editUserId: string = '';
  editRoleId: string = '';
  editUserName: string = '';
  editContactNo: string = '';
  editAlternateContactNo: string = '';
  editEmailId: string = '';
  editAddress: string = '';
  editStateId: string = '';
  editCityId: string = '';
  roleList: any[] = [];
  stateList: any[] = [];
  cityList: any[] = [];
  
  // Delete modal
  deleteUserId: string = '';
  deleteUserName: string = '';
  deleteContactNo: string = '';
  deleteRemark: string = '';
  
  // Block/Unblock modal
  blockUserId: string = '';
  blockUserName: string = '';
  blockStatus: string = '';
  blockRemark: string = '';
  activeSuspend: string = '';
  
  // Reset password modal
  resetUserId: string = '';
  resetUserName: string = '';
  currentPassword: string = '';
  newPassword: string = '';
  reNewPassword: string = '';
  passwordMessage: string = '';
  changePasswordMessage: string = '';
  passwordValid = false;
  passwordsMatch = false;
  isDisable = true;
  
  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private userServiceForState: UserServiceForState,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.getVendorUserDetails(1);
    this.loadRoleList();
    this.loadStateList();
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
        $('#rolelist').on('change', (e: any) => {
          this.editRoleId = e.target.value;
        });
        $('#statename').on('change', (e: any) => {
          this.editStateId = e.target.value;
          this.loadCityList(this.editStateId);
        });
        $('#cityname').on('change', (e: any) => {
          this.editCityId = e.target.value;
        });
      }
    }, 200);
  }
  
  getVendorUserDetails(page: number = 1) {
    this.currentPage = page;
    this.loading = true;
    this.errorMessage = '';
    
    const request = {
      param1: this.searchText.trim(),
      param2: this.currentPage.toString(),
      param3: this.pageSize.toString()
    };
    
    this.userService.getVendorUserDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          if (response.entity.listData !== undefined) {
            this.vendorUserList = response.entity.listData || [];
            this.totalCount = response.entity.param1 || 0;
          } else if (Array.isArray(response.entity)) {
            this.vendorUserList = response.entity;
            this.totalCount = response.entity.length;
          } else {
            this.vendorUserList = [];
          }
        } else {
          this.errorMessage = typeof response?.entity === 'string' ? response.entity : 'Failed to load vendor user details';
          this.vendorUserList = [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error loading vendor user details. Please try again.';
        this.vendorUserList = [];
        console.error('Error loading vendor user details:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  loadRoleList() {
    this.roleService.getRoleDetails({ param1: '', param2: '1', param3: '1000' }).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.roleList = response.entity.listData || [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading role list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  loadStateList() {
    this.userServiceForState.getStateList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.stateList = response.entity;
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#statename').select2();
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
    
    this.userServiceForState.getCityList(stateId).subscribe({
      next: (response) => {
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
        console.error('Error loading city list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  editUserData(user: any) {
    this.editUserId = user.param1 || '';
    this.editRoleId = user.param2 || '';
    this.editUserName = user.param5 || '';
    this.editContactNo = user.param7 || '';
    this.editAlternateContactNo = user.param8 || '';
    this.editEmailId = user.param6 || '';
    this.editAddress = user.param9 || '';
    this.editStateId = user.param12 || '';
    this.editCityId = user.param11 || '';
    
    if (this.editStateId) {
      this.loadCityList(this.editStateId);
    }
    
    setTimeout(() => {
      if (typeof $ !== 'undefined') {
        if ($.fn.select2) {
          $('#rolelist').val(this.editRoleId).trigger('change');
          $('#statename').val(this.editStateId).trigger('change');
          setTimeout(() => {
            $('#cityname').val(this.editCityId).trigger('change');
          }, 500);
        }
        // Open modal after data is loaded
        $('#updateUserDetails').modal('show');
      }
    }, 300);
  }
  
  getUpdatedetails() {
    if (!this.editUserName || !this.editContactNo || !this.editEmailId || !this.editAddress || !this.editStateId || !this.editCityId) {
      jAlert('Please fill all required fields');
      return;
    }
    
    this.loading = true;
    const encryptedUserId = this.encryptionService.encryptAccountId(this.editUserId);
    const encryptedRoleId = this.encryptionService.encryptAccountId(this.editRoleId);
    const encryptedStateId = this.encryptionService.encryptAccountId(this.editStateId);
    const encryptedCityId = this.encryptionService.encryptAccountId(this.editCityId);
    
    const request = {
      param1: encryptedUserId,
      param2: encryptedRoleId,
      param3: this.editUserName.trim(),
      param4: this.editContactNo.trim(),
      param5: this.editAlternateContactNo.trim(),
      param6: this.editEmailId.trim(),
      param7: this.editAddress.trim(),
      param8: encryptedStateId,
      param9: encryptedCityId
    };
    
    this.userService.updateVendorUser(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          jAlert('User updated successfully.');
          $('#updateUserDetails').modal('hide');
          this.getVendorUserDetails(this.currentPage);
        } else {
          jAlert(typeof response?.entity === 'string' ? response.entity : 'Failed to update user');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        jAlert('Error updating user');
        console.error('Error updating user:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  deleteData(user: any) {
    this.deleteUserId = user.param1 || '';
    this.deleteUserName = user.param5 || '';
    this.deleteContactNo = user.param7 || '';
    this.deleteRemark = '';
    setTimeout(() => {
      if (typeof $ !== 'undefined') {
        $('#deleteUserDetails').modal('show');
      }
    }, 100);
  }
  
  deleteUser() {
    if (!this.deleteRemark) {
      jAlert('Please enter a remark');
      return;
    }
    
    this.loading = true;
    const encryptedUserId = this.encryptionService.encryptAccountId(this.deleteUserId);
    
    this.userService.deleteVendorUser(encryptedUserId, this.deleteRemark.trim()).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          jAlert('User deleted successfully.');
          $('#deleteUserDetails').modal('hide');
          this.getVendorUserDetails(this.currentPage);
        } else {
          jAlert(typeof response?.entity === 'string' ? response.entity : 'Failed to delete user');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        jAlert('Error deleting user');
        console.error('Error deleting user:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  blockUnblockUserData(user: any) {
    this.blockUserId = user.param1 || '';
    this.blockUserName = user.param5 || '';
    this.blockStatus = user.param20 || '';
    this.blockRemark = '';
    this.activeSuspend = this.blockStatus === 'Active' ? 'Suspend' : 'Active';
    setTimeout(() => {
      if (typeof $ !== 'undefined') {
        $('#blockunblock').modal('show');
      }
    }, 100);
  }
  
  blockUnblockUser() {
    if (!this.blockRemark) {
      jAlert('Please enter a remark');
      return;
    }
    
    this.loading = true;
    const encryptedUserId = this.encryptionService.encryptAccountId(this.blockUserId);
    const action = this.blockStatus === 'Active' ? 'block' : 'unblock';
    
    this.userService.blockUnblockUser(encryptedUserId, this.blockRemark.trim(), action).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status) {
          jAlert('User status updated successfully.');
          $('#blockunblock').modal('hide');
          this.getVendorUserDetails(this.currentPage);
        } else {
          jAlert(typeof response?.entity === 'string' ? response.entity : 'Failed to update user status');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        jAlert('Error updating user status');
        console.error('Error updating user status:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  resetPasswordData(user: any) {
    this.resetUserId = user.param1 || '';
    this.resetUserName = user.param5 || '';
    this.currentPassword = '';
    this.newPassword = '';
    this.reNewPassword = '';
    this.passwordMessage = '';
    this.changePasswordMessage = '';
    this.passwordValid = false;
    this.passwordsMatch = false;
    this.isDisable = true;
    setTimeout(() => {
      if (typeof $ !== 'undefined') {
        $('#changepassword').modal('show');
      }
    }, 100);
  }
  
  verifyPassword() {
    const password = this.newPassword;
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
    if (this.reNewPassword) {
      this.passwordsMatch = this.newPassword === this.reNewPassword;
      this.changePasswordMessage = this.passwordsMatch ? '' : 'Passwords do not match';
      this.isDisable = !(this.passwordValid && this.passwordsMatch);
    }
  }
  
  changePass() {
    if (!this.currentPassword || !this.newPassword || !this.reNewPassword) {
      jAlert('Please fill all password fields');
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
    
    // Implementation for password change - need to check API endpoint
    jAlert('Password reset functionality - API endpoint needs to be implemented');
  }
  
  getSearchDetails() {
    this.getVendorUserDetails(1);
  }
  
  reloadData() {
    this.searchText = '';
    this.getVendorUserDetails(1);
  }
  
  sort(column: string) {
    if (this.sortKey === column) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = column;
      this.reverse = false;
    }
  }
  
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = 8;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }
  
  onPageChange(page: number) {
    this.getVendorUserDetails(page);
  }
}

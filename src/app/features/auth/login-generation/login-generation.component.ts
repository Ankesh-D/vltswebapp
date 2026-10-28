import { ToastService } from './../../../core/services/toast.service';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { RoleService } from '../../../core/services/role.service';
import { UserService } from '../../../core/services/user.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { RtoService } from '../../../core/services/rto.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { HttpHeaders } from '@angular/common/http';
import { DeviceService } from '../../../core/services/device.service';

declare var $: any;
declare var jAlert: any;

@Component({
    selector: 'app-login-generation',
    imports: [CommonModule, FormsModule, ToastComponent, NgSelectModule],
    templateUrl: './login-generation.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./login-generation.component.scss']
})
export class LoginGenerationComponent implements OnInit, AfterViewInit {
  selectedRoleId: any = null;
  selectedCompanyId: string = '';
  selectedDistrictId: string = '';
  selectedCityId: string = '';
  selectedUserId: string = '';
  loginName: string = '';
  password: string = '';
  confirmPassword: string = '';
  
  roleList: any[] = [];
  companyList: any[] = [];
  districtList: any[] = [];
  cityList: any[] = [];
  userList: any[] = [];
  
  filterForName: string = '';
  rolewiseuserFlag: boolean = false;
  showDistrictList: boolean = false;
  showCityList: boolean = false;
  
  loading = false;
  passwordMessage = '';
  confirmPasswordMessage = '';
  
  passwordValid = false;
  passwordsMatch = false;
  isDisable = true;
  passwordShow: boolean = false;
  confirmPasswordShow: boolean = false;

  selectedRoleWiseUserObj: any = null;
  roleWiseUserList: any[] = [];
  subRoleList: any[] = [];
  subroleObj: any = null;
  subRoleName: string = '';
  subrolelistflag: boolean = false;
  errorMessage: any = '';
  msgType: any = 'error';
  welcomeName: string = '';
  showDistributorList: boolean = false;
  selectedDistributorId: any = null;
  distributorList: any[] = [];
  constructor(
    private toast:ToastService,
    private authService: AuthService,
    private roleService: RoleService,
    private userService: UserService,
    private dashboardService: DashboardService,
    private rtoService: RtoService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    private deviceService: DeviceService
  ) {
    this.toast.pageName = 'Login Generation'; // Set page name for toast service
  }
  
  ngOnInit() {
    this.loadRoleList();
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
        $('#roleselector').on('change', (e: any) => {
          this.selectedRoleId = e.target.value;
          this.onRoleChange();
        });
        $('#companySel').on('change', (e: any) => {
          this.selectedCompanyId = e.target.value;
          this.onCompanyChange();
        });
        $('#districtlist').on('change', (e: any) => {
          this.selectedDistrictId = e.target.value;
          this.onDistrictChange();
        });
        $('#citylist').on('change', (e: any) => {
          this.selectedCityId = e.target.value;
          this.loadUserList();
        });
        $('#selectUser').on('change', (e: any) => {
          this.selectedUserId = e.target.value;
          this.onUserChange();
          this.checkFormValid();
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
      },
      error: (error) => {
        this.loading = false;
       this.toast.show('Error loading role list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  ownersId: string = '';
  getRoleWiseUserList() {
    if(this.ownersId==''){
      this.ownersId = this.encryptionService.encryptAccountId("0");
    } else {
      this.ownersId = this.encryptionService.encryptAccountId(this.ownersId);
    }
    const ownersId = this.ownersId;
    this.userService.getUserWiseLoginRoster({}, ownersId, this.selectedRoleId).subscribe({
      next: (response:any) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.roleWiseUserList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.toast.show('Error loading role wise user list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  getRTOList() {
    this.userService.getRTOListApi({}, 'rto').subscribe({
      next: (response:any) => {
        if (response.status && response.entity) {
          this.subRoleList = response.entity;
        }
        this.cdr.detectChanges();
       
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading RTO list:', error);
        this.cdr.detectChanges();
      }
    });
  }

  onRoleChange() {
    this.selectedCompanyId = '';
    this.selectedDistrictId = '';
    this.selectedCityId = '';
    this.selectedUserId = '';
    this.loginName = '';
    this.userList = [];
    this.rolewiseuserFlag = true;
    this.subrolelistflag = false;
    
    if (!this.selectedRoleId) return;
    
    // Determine which filter to show based on role
    const role = this.roleList.find(r => r.param2 == this.selectedRoleId);
    
    this.ownersId = role ? role.param1 : ''; 
    if (role) {
      const roleName = role ? role.param3.toLowerCase() : '';
      this.filterForName = roleName;
      
      if (role.param2==13 || role.param2==12) { //dealer
        
        this.subrolelistflag = true;
        this.subRoleName = 'Device Manufacturer';
        this.loadVendorList();
      } else if (role.param2==19) { //RTO
        this.subrolelistflag = true;
        this.subRoleName = 'RTO';
        this.getRTOList();        
      } else if (role.param2==20 || role.param2==21) { //police and city polce
        this.subrolelistflag = true;
        this.subRoleName = 'District';
        this.loadDistrictList();      
      }
       else {
        this.getRoleWiseUserList();
        this.filterForName = 'User';
      } 
    }
  }

  onSubRoleChange() {
    if(this.selectedRoleId=='20' || this.selectedRoleId=='21') {
      this.showCityList = true;
      this.loadCityList();
    } else if(this.selectedRoleId=='19') {
      this.ownersId = this.subroleObj;
      this.getRoleWiseUserList(); 
    } else if(this.selectedRoleId=='13') {
      this.ownersId = this.subroleObj;
      this.getRoleWiseUserList(); 
    } else if(this.selectedRoleId=='12') {
      // this.showDistributorList = true;
      this.ownersId = this.subroleObj;
      this.getRoleWiseUserList();
    }
    // this.getRoleWiseUserList();
    // this.filterForName = 'User';
  }
  
  loadDistributorList() {
    this.deviceService.getDistributorList({vendorid: ''}).subscribe({
      next: (response:any) => {
        if (response.status && response.entity) {
          this.distributorList = response.entity;
        }
        this.cdr.detectChanges();
       
      },
      error: (error) => {
        this.loading = false;
       this.toast.show('Error loading distributor list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  loadVendorList() {
    this.loading = true;
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.subRoleList = response.entity;
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#companySel').select2();
          }
        }, 100);
      },
      error: (error) => {
        this.loading = false;
        this.toast.show('Error loading vendor list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  onCompanyChange() {
    if (this.selectedCompanyId) {
      this.loadUserList();
    }
  }
  
  loadDistrictList() {
    this.loading = true;
    this.userService.getStateList().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          // Get districts for first state or all states
          this.subRoleList = response.entity.map((state: any) => ({
            param1: state.param1,
            param2: state.param2
          }));
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#districtlist').select2();
          }
        }, 100);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading district list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  onDistrictChange() {
    if (this.selectedDistrictId) {
      this.loadCityList();
    }
  }
  
  loadCityList() {
    if (!this.subroleObj) return;
    
    this.loading = true;
    this.userService.getCityList(this.subroleObj).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.cityList = response.entity;
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#citylist').select2();
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
  
  loadUserList() {
    if (!this.selectedRoleId) return;
    
    this.loading = true;
    const encryptedRoleId = this.encryptionService.encryptAccountId(this.selectedRoleId);
    let filterId = '';
    
    if (this.selectedCompanyId) {
      filterId = this.encryptionService.encryptAccountId(this.selectedCompanyId);
    } else if (this.selectedCityId) {
      filterId = this.encryptionService.encryptAccountId(this.selectedCityId);
    }
    
    this.userService.getUsersByRole(encryptedRoleId, filterId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.userList = response.entity;
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#selectUser').select2();
          }
        }, 100);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading user list:', error);
        this.cdr.detectChanges();
      }
    });
  }
  
  onUserChange() {
    // Auto-generate login name from user selection
    const selectedUser = this.userList.find(u => u.param1 === this.selectedUserId);
    if (selectedUser && selectedUser.param2) {
      this.loginName = selectedUser.param2.toLowerCase().replace(/\s+/g, '');
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
      this.selectedUserId &&
      this.loginName &&
      this.passwordValid &&
      this.passwordsMatch
    );
  }
  @ViewChild('loginForm') loginForm: any;
  createLogin() {
    this.msgType = 'error';
    // if (!this.selectedRoleId || !this.selectedUserId || !this.loginName || !this.password) {
    //   this.errorMessage = 'Please fill all required fields';
    //   return;
    // }
    
    // if (!this.passwordValid) {
    //   this.errorMessage = 'Please enter a valid password';
    //   return;
    // }
    
    // if (!this.passwordsMatch) {
    //   this.errorMessage = 'Passwords do not match';
    //   return;
    // }
    
    if(this.loginForm.valid) {

      this.loading = true;
      this.errorMessage = '';
      
      
      if(this.password!=this.confirmPassword){
        this.msgType = 'error';
        this.errorMessage = 'Password does not match with Confirm Password';
        this.cdr.detectChanges();
        return;
      }
      const encryptedRoleId = this.encryptionService.encryptAccountId(this.selectedRoleId);
      const encryptedUserId = this.encryptionService.encryptAccountId(this.selectedRoleWiseUserObj);
      //console.log(this.selectedRoleWiseUserObj)
      const request = {
        param2: encryptedRoleId,
        param3: encryptedUserId,
        param4: "",//this.loginName.trim(),
        param5: "",//this.loginName.trim(),
        param6: "",//this.password,
        param7: this.welcomeName, 
        param8: "",//this.encryptionService.encryptAccountId('welcomeUser'), // Placeholder
      };
      const authData = this.encryptionService.encryptId(this.loginName.trim()+":"+this.password+":"+this.confirmPassword);
      const headerkey = sessionStorage.getItem('headerkey') || sessionStorage.getItem('principalKey') || '';
      const headers = new HttpHeaders({
                    'Content-Type': 'application/json',
                    'Authentication': authData,
                    'headerkey': headerkey
                  });
      this.authService.createLogin(request, headers).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.status) {
              this.toast.show('Login created successfully.', 'success');
            this.msgType = 'success';
            this.errorMessage = 'Login created successfully.';
            this.resetForm();
          } else {
            this.msgType = 'error';
            this.errorMessage = typeof response?.entity === 'string' ? response.entity : 'Failed to create login';
            // jAlert(this.errorMessage);
              this.toast.show(this.errorMessage, 'error');
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.entity || 'Error creating login';
          // jAlert(this.errorMessage);
           this.toast.show(this.errorMessage, 'error');
          this.errorMessage = 'Error in creating login';
          // console.error('Error creating login:', error);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.msgType = 'error';
      this.errorMessage = 'Please fill all required fields correctly.';
      this.cdr.detectChanges();
    }
  }
  
    resetForm() {
    this.selectedRoleId = '';
    this.selectedCompanyId = '';
    this.selectedDistrictId = '';
    this.selectedCityId = '';
    this.selectedUserId = '';
    this.loginName = '';
    this.password = '';
    this.confirmPassword = '';
    this.passwordMessage = '';
    this.confirmPasswordMessage = '';
    this.passwordValid = false;
    this.passwordsMatch = false;
    this.isDisable = true;
    this.userList = [];
    this.errorMessage = '';
    this.msgType = 'success';
    this.rolewiseuserFlag = false;
    this.showCityList = false;
    this.subrolelistflag = false;
    this.subroleObj = null;
    this.ownersId = '';
    
    this.cdr.detectChanges();
    
    
    if (typeof $ !== 'undefined') {
      $('#roleselector').val('').trigger('change');
      $('#companySel').val('').trigger('change');
      $('#districtlist').val('').trigger('change');
      $('#citylist').val('').trigger('change');
      $('#selectUser').val('').trigger('change');
      $('#loginname').val('');
      $('#password').val('');
      $('#confirmpassword').val('');
    }
    setTimeout(() => {
      this.loginForm.resetForm();
    }, 300);
  }
}

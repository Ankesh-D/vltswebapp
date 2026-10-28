import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RoleService } from '../../../core/services/role.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ListService } from '../../../core/services/list.service';
import { UserService } from '../../../core/services/user.service';
import { UserCreationRequest } from '../../../core/model/request.model';
import { ToastService } from '../../../core/services/toast.service';
import { ValidationsService } from '../../../core/services/validations.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-user-creation',
    imports: [FormsModule, CommonModule, NgSelectModule],
    templateUrl: './user-creation.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './user-creation.component.scss'
})
export class UserCreationComponent implements OnInit {
  loading: boolean = false;
  roleList: any[]=[];
  roleNameObj: any = null;
  roleType:any = null;
  roleTypeObj: any = null;
  roleTypeList: any[]=[];

  distributorFlag: boolean= false;
  dealerFlag: boolean = false;
  cityRTOFlag: boolean = false;
  mviFlag: boolean = false;
  selectedRoleId: any = ""; 

  vendorObj: any = null;
  vendorList: any[]=[];
  distributorObj: any = null;
  distributorList: any[]=[];
  MVIList: any[]=[];
  OEMList: any[]=[];

  selectedCityId: any=null;
  cityList: any[]=[];
  stateList: any[]=[];
  selectedStateId: any = null;
  address: string = "";
  emailId: string = "";
  mobileNo: any = "";
  alternateMobileNo: any = "";
  contactPerson: any = "";
  
  passwordMatchMessage:string = "";
  confirmPasswordFieldType: string = "";
  passwordFieldType: string = ""
  
  // Form validation flags
  formErrors: { [key: string]: boolean } = {};
  errorMessage: string | null = null;
  successMessage: string | null = null;
  username:string = "";
  password:string = "";
  confirmPassword = "";
  usernameMessage = '';
  cityRTOList: any[]=[];
  cityRTOObj: any = null;
  constructor(public ls: ListService, 
    public userService: UserService, 
    public toastService: ToastService,
    public vs: ValidationsService,
    public es: EncryptionService,
    public router: Router) {
      this.toastService.pageName = 'User Creation'; // Set page name for toast service
    }
  ngOnInit(): void {
      this.loadRoleList();
      this.loadStateList();
  }
  allowOnlyNumbers(event: any, fieldName: string) {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/[^0-9]/g, '');
    input.value = sanitizedValue;
    
    if (fieldName === 'mobileNo') this.mobileNo = sanitizedValue;
    else if (fieldName === 'alternateMobileNo') this.alternateMobileNo = sanitizedValue;
  }

  loadRoleList() {
    this.loading = true;
    this.ls.getRoleDetails({ param1: '', param2: '1', param3: '1000' }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
          this.roleList = response.entity.listData || [];
        }
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }
  loadStateList() {
    this.loading = true;
    this.ls.getStateList().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
          this.stateList = response.entity || [];
            this.stateList.forEach(element => {
              if(element.param3=='WB') {
                this.selectedStateId = element;

                this.loadCityList()
              }    
            });
          
        }
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }
  loadCityList() {
    this.loading = true;
    let stateId = this.selectedStateId ? this.selectedStateId. param1 : '';
    this.ls.getCityList(stateId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
          this.cityList = response.entity || [];
        }
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }

  resetOnChangeRole() {
    this.vendorObj = null;
    this.distributorObj = null;
    this.roleType = null;
    this.roleTypeObj = null;
    this.selectedRoleId = null;
    this.distributorFlag = false;
    this.dealerFlag = false;
    this.cityRTOFlag = false;
    this.mviFlag = false;
    this.vendorList = [];
    this.distributorList = [];
    this.selectedCityId = null;
    this.selectedCityId = null;
  }
  
  
  onRoleChange(event: any) {
    this.resetOnChangeRole();

    this.selectedRoleId = event.param2;
    if(event.param2=='11' || event.param2=='24') {//Device Manufacturer
      this.roleType = event ? event.param3 : null;
        this.loadVendorList();
    } else if(event.param2=='12') {//Distributor
      this.roleType = event ? event.param3 : null;
      this.distributorFlag = true;
      this.loadVendorList();
    } else if(event.param2=='13') {//Dealer
      this.roleType = event ? event.param3 : null;
      this.dealerFlag = true
      this.loadVendorList()
    } else if(event.param2=='16') {//M2M Provider
      this.roleType = event ? event.param3 : null;
      this.loadM2MProvider();
    } else if(event.param2=='19') {//City RTO
      this.cityRTOFlag = true;
      this.roleType = event ? event.param3 : null;
      this.loadCityRTOList();

    } else if(event.param2=='191') {//MVI
      this.mviFlag = true;
      this.roleType = event ? event.param3 : null;
      this.loadCityRTOList();
    }else if(event.param2=='61') {//OEM
      this.roleType = event ? event.param3 : null;
      this.loadOEMList();    
    }
    else if(event.param2=='15') {//Test Agency
      this.roleType = event ? event.param3 : null;
      this.loadTestAgencyList();    
    }
    else if(event.param2=='18') {//State RTO
      this.roleType = event ? event.param3 : null;
      this.loadStateRTOList();    
    }
     else {
      this.roleType = null;
    }
  }
  
  onRoleTypeChange() {
    
  }
  onChangeCityRTO(event: any) {
    if(this.mviFlag) {
     let rtoId = event.param1
      this.loadMVIList(rtoId);
    }  
  }
  loadMVIList(rtoId: string) {
    this.ls.getMVIList(rtoId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
            this.MVIList = response.entity;  
        }
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }
  loadOEMList() {
    this.ls.getOEMList({}).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
            this.roleTypeList = response.entity;  
        }
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }
  loadTestAgencyList() {
    this.ls.getTestAgencyList({}).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
            this.roleTypeList = response.entity;  
        }
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }


  

  loadVendorList() {
    this.ls.getVendorList().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
          if(this.selectedRoleId=='12' || this.selectedRoleId=='13') {
            this.vendorList = response.entity;
          } else {
            this.roleTypeList = response.entity;
          }
        }
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }
  loadDealerList() {
    let vendorId = this.vendorObj ? this.vendorObj.param1 : '';
    let distributorId = this.distributorObj ? this.distributorObj.param1 : '';
    this.ls.getVendorDealerRoster(vendorId, distributorId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
          this.roleTypeList = response.entity;
        }
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }
  loadDistributor() {
    let vendorId= this.vendorObj ? this.vendorObj.param1 : "";
    
    this.ls.getDistributorList({vendorid: vendorId}).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
          if(this.selectedRoleId=='13') {
            this.distributorList = response.entity;
          } else {
            this.roleTypeList = response.entity;
          }
        }
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }
  loadM2MProvider() {
    this.ls.getM2MProviderList().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
          this.roleTypeList = response.entity;
        }
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }
  loadStateRTOList() {
    this.ls.getStateRTOList({}).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
          this.roleTypeList = response.entity;
        }
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }
  loadCityRTOList() {
    this.ls.getCityRTOList().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
          if(this.selectedRoleId=='191') {
            this.cityRTOList = response.entity
          } else {
            this.roleTypeList = response.entity;
          }
        }
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }
  onDistributorChange() {
    this.loadDealerList()
  }
  onVendorChange() {

    this.loadDistributor();
  }
  onStateChange() {
    this.selectedCityId = null;
    this.loadCityList();
  }

  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    } else {
      this.confirmPasswordFieldType = this.confirmPasswordFieldType === 'password' ? 'text' : 'password';
    }
  }
  validatePasswordMatch(): void {
    if (this.password && this.confirmPassword && this.password !== this.confirmPassword) {
      this.passwordMatchMessage = 'Passwords do not match.';
    } else {
      this.passwordMatchMessage = '';
    }
  }
  getFieldError(fieldName: string): boolean {
    return this.formErrors[fieldName] || false;
  }
  
  resetForm() {

  }

  public request: UserCreationRequest = new UserCreationRequest();
  @ViewChild('entryForm') entryForm!: NgForm;
  sumitForm() {
    if(this.entryForm.valid) {
      this.request.roleid = this.roleNameObj ? this.roleNameObj.param2 : '';
      this.request.ownersid = this.roleTypeObj ? this.roleTypeObj.param1 : '';
      this.request.userstateid = this.selectedStateId ? this.selectedStateId.param1 : "";
      this.request.usercityid = this.selectedCityId ? this.selectedCityId.param1 : "";
      
      if(this.password.toLowerCase()!=this.confirmPassword.toLowerCase()) {
        this.toastService.show('Password and confirm password does not match.');
        return 
      }
      this.request.loginpasswd = this.es.encryptPassword(this.password);
      console.log(this.request);
      this.userService.userCreationEntry(this.request).subscribe({
        next: (response) => {
          let msgtype: any = "";
          if(response.statuscode==200) {
            msgtype = "success";
            this.entryForm.resetForm();

          } else {
            msgtype = "error";
          }
          this.toastService.show(response.entity, msgtype)
        },
        error: (err: any) => {
          this.toastService.show(err, 'error')
        }
      })
    }


  }
  goToDetails() {
    this.router.navigate(['/userdetails']);

  }

  
}

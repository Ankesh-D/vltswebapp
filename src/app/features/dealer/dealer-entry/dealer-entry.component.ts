import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DealerService } from '../../../core/services/dealer.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { DeviceService } from '../../../core/services/device.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-dealer-entry',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, ToastComponent],
    templateUrl: './dealer-entry.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./dealer-entry.component.scss']
})
export class DealerEntryComponent implements OnInit {
  // Form fields
  vendorId: any = null;
  dealerName: string = '';
  contactPerson: string = '';
  mobileNo: string = '';
  alternateMobileNo: string = '';
  emailId: string = '';
  address: string = '';
  selectedStateId: any = null;
  stateName: string = '';
  selectedCityId: any = null;
  cityName: string = '';
  
  // Lists
  vendorlist: any[] = [];
  statelist: any[] = [];
  citylist: any[] = [];
  
  roleId: string = '';
  // Validation
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  distributorList: any[] = [];
  distributorId: any = null;
  submitted = false;
  
  // Form validation flags
  formErrors: { [key: string]: boolean } = {};
  
  @ViewChild('dealerForm') dealerForm!: NgForm;
  
  constructor(
    private dealerService: DealerService,
    private deviceService: DeviceService,
    private router: Router,
    public toastService: ToastService
  ) {
    this.toastService.pageName = 'Dealer Entry'; // Set page name for toast service
    this.roleId = sessionStorage.getItem('roleid') || '';
  }

  ngOnInit() {
    this.loadStateList();

    if (this.roleId === '10') {
      this.loadVendorList();
    }
    if(this.roleId != '12') {
      this.loadDistributorList();
    }
  }

  onVendorChange() {
    this.distributorId = null; // Reset distributor selection
    this.distributorList = []; // Clear distributor list

    if (this.vendorId) {
      this.loadDistributorList();
    }
  }

  loadStateList() {
    this.dealerService.getStateList().subscribe({
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

  loadDistributorList() {
    this.deviceService.getDistributorList({vendorid: ""}).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.distributorList = response.entity;
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to load distributor list';
      }
    });
  }

  loadVendorList() {
    this.dealerService.getVendorList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vendorlist = response.entity;
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
      const state = this.statelist.find(s => s.param1 == this.selectedStateId);
      if (state) {
        this.stateName = state.param2;
      }
      this.loadCityList(this.selectedStateId);
    }
  }

  loadCityList(stateId: string) {
    this.dealerService.getCityList(stateId).subscribe({
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

  onCityChange() {
    if (this.selectedCityId) {
      const city = this.citylist.find(c => c.param1 === this.selectedCityId);
      if (city) {
        this.cityName = city.param2;
      }
    }
  }

  resetForm() {
    //console.log('Resetting form and clearing all fields');
    this.dealerForm.resetForm();
    this.submitted = false;
    this.selectedStateId = null;
    this.selectedCityId = null;
    this.citylist = [];
    this.stateName = '';
    this.cityName = '';
    this.clearFormErrors();
  }

  clearFormErrors() {
    this.formErrors = {};
  }

  getFieldError(fieldName: string): boolean {
    return this.formErrors[fieldName] || false;
  }

  allowOnlyNumbers(event: any, fieldName: string) {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/[^0-9]/g, '');
    input.value = sanitizedValue;
    
    if (fieldName === 'mobileNo') this.mobileNo = sanitizedValue;
    else if (fieldName === 'alternateMobileNo') this.alternateMobileNo = sanitizedValue;
  }

  validateForm(): boolean {
    // Vendor validation ONLY when roleId === '10'
    if (this.roleId === '10' && !this.vendorId) {
      this.errorMessage = 'Please select a vendor';
      return false;
    }

    // Distributor validation ONLY when roleId !== '12'
    if (this.roleId !== '12' && !this.distributorId) {
      this.errorMessage = 'Please select a distributor';
      return false;
    }

    if (
      !this.dealerName ||
      !this.contactPerson ||
      !this.mobileNo ||
      !this.emailId ||
      !this.address ||
      !this.stateName ||
      !this.cityName
    ) {
      this.errorMessage = 'Please fill all required fields';
      return false;
    }

    // Validate mobile number format
    if (this.mobileNo.length !== 10 || !/^\d{10}$/.test(this.mobileNo)) {
      this.errorMessage = 'Mobile No. must be 10 digits';
      return false;
    }

    // Validate alternate mobile number if provided
    if (this.alternateMobileNo && (this.alternateMobileNo.length !== 10 || !/^\d{10}$/.test(this.alternateMobileNo))) {
      this.errorMessage = 'Alternate Mobile No. must be 10 digits';
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(this.emailId)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }

    return true;
  }

  submitDealer() {
    this.submitted = true;
    this.errorMessage = null;
    
    // Wait for template driven form to mark fields as touched
    setTimeout(() => {
      if (!this.dealerForm.valid) {
        this.errorMessage = 'Please fill all required fields correctly';
        return;
      }

      if (!this.validateForm()) {
        return;
      }
      
      if (confirm('Are you sure you want to submit this dealer?')) {
        this.loading = true;
        
       const dealerData = {
              "param1": "0",   //dealerid
              "param2": this.dealerName,//dealername
              "param3": "0",//dealergst
              "param4": this.address,//dealerregaddr1
              "param5": "0",//dealerregaddr2
              "param6": this.cityName,//dealercityname
              "param7": this.stateName,//dealerstatename
              "param8": this.contactPerson,//dealercontactpers
              "param9": this.emailId,//dealercontactemailid
              "param10": this.mobileNo,//dealercontactmobile1
              "param11": this.alternateMobileNo,//dealercontactmobile2
              "param12": this.vendorId || '',//dealervendorid
              "param13": "",//loginname
              "param14": "",//loginpasswd
              "param15": "",//creatorloginid
              "param16": "",//dealerpincode
              "param17": this.distributorId || '',//distributorid
              "param18": "",//remarks           
  };
    
        this.dealerService.putDealer(dealerData).subscribe({
          next: (response) => {
            this.loading = false;
            if (response.statuscode==200) {
              this.successMessage = response.entity || 'Dealer created successfully';
              this.submitted = false;
              setTimeout(() => {
                this.router.navigate(['/dealer']);
              }, 1500);
            } else {
              this.errorMessage = response.entity;
              // this.errorMessage = 'Failed to create dealer';
            }
          },
          error: (error) => {
            this.loading = false;
            this.errorMessage = 'Error creating dealer. Please try again.';
          }
        });
      }
    }, 100);
  }

  goBack() {
    this.router.navigate(['/dealer']);
  }
}

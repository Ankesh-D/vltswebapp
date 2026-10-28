import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VahanService, VahanDeviceEntryRequest } from '../../../core/services/vahan.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { VehicleService } from '../../../core/services/vehicle.service';
import moment from "moment";
import { ToastService } from '../../../core/services/toast.service';
export class VahanResposne {
  param1: any = '';
  param2: any = '';
  param3: any = '';
  param4: any = '';
  param5: any = '';
  param6: any = '';
  param7: any = '';
  param8: any = '';
  param9: any = '';
  param10: any = '';
  param11: any = '';
  param12: any = '';
  param13: any = '';
  param14: any = '';
  param15: any = '';
  param16: any = '';
}
@Component({
    selector: 'app-vahan-installation',
    imports: [FormsModule, NgSelectModule, ToastComponent],
    templateUrl: './vahan-installation.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./vahan-installation.component.scss']
})
export class VahanInstallationComponent implements OnInit {
  // Step management
  currentStep: number = 1;
  
  // Step 1: Serial No
  serialNo: string = '';
  deviceSerialNo: string = '';
  // Step 2: Vahan Details
  imeiNo: string = '';
  iccidNo: string = '';
  vehicleNo: string = '';
  chassisNo: string = '';
  engineNo: string = '';
  makeName: string = '';
  modelName: string = '';
  vehicleClass: string = '';
  customerName: string = '';
  manufactureYear: string = '';
  vehicleType: string = 'New';
  
  // Step 3: Other Details
  customerContactNo: string = '';
  mobileNo1: string = '';
  network1: string = '';
  mobileNo2: string = '';
  network2: string = '';
  m2mProvider: string = '';
  dealerName: string = '';
  rtoCode: string = '';
  rtoName: string = '';
  vehicleMakeName: string = '';
  vehicleModelName: string = '';
  validity: string = '';
showValidityModal: boolean = false;
showValidityField: boolean = true;
  // Flags
  isDeviceAlreadyAssigned: boolean = false;
  deviceId: string = '';
  vendorId: string = '';
  ownerContactNo: string = '';
  vahanRtoName: string = '';
  vehicleNoReadonly: boolean = false;
  showMobileFields: boolean = true;
  
  // Dropdowns data
  deviceModelList: any[] = [];
  vehicleClassList: any[] = [];
  vehicleMakeList: any[] = [];
  vehicleModelList: any[] = [];
  dealerList: any[] = [];
  stateList: any[] = [];
  rtoList: any[] = [];
  m2mProviderList: any[] = [];
  networkList: any[] = [];
  vendorList: any[] = [];
  
  // Vahan response data
  vahanResponseData: VahanResposne = new VahanResposne();
  
  // Loading and error
  loading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string = '';
  msgType: any = "success";
  constructor(
    private vehicaa: VehicleService,
    private vahanService: VahanService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {
    this.toast.pageName = 'Vahan Installation'; // Set page name for toast service
  }

  ngOnInit() {
    //console.log('VahanInstallationComponent: ngOnInit() - Component initialized');
    this.loadInitialData();
    this.generateYearList();
    if(sessionStorage.getItem('IMEINo')) {
      sessionStorage.removeItem('IMEINo');
    }
  }

  loadInitialData() {
    this.loadDeviceModelList();
    this.loadVehicleClassList();
    this.loadVehicleMakeList();
    this.loadM2MProviderList();
    this.loadNetworkList();
    this.loadRTORoster();
    this.loadVendorList();
  }

  loadDeviceModelList(companyId?: string) {
    this.vahanService.getDeviceModelRoster(companyId).subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.deviceModelList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: (error) => {
        console.error('Error loading device model list:', error);
      }
    });
  }

  loadVehicleClassList() {
    this.vahanService.getVehicleClassRoster().subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.vehicleClassList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: (error) => {
        console.error('Error loading vehicle class list:', error);
      }
    });
  }

  loadVehicleMakeList() {
    this.vahanService.getVehicleMakeRoster().subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.vehicleMakeList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: (error) => {
        console.error('Error loading vehicle make list:', error);
      }
    });
  }

  onVehicleMakeChange(makeId: string) {
    if (makeId) {
      this.loading = true;
      this.vahanService.getVehicleModelRosterByMake(makeId).subscribe({
        next: (response) => {
          this.loading = false;
          if (response?.status && response?.entity) {
            this.vehicleModelList = Array.isArray(response.entity) ? response.entity : [];
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          console.error('Error loading vehicle model list:', error);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.vehicleModelList = [];
      this.vehicleModelName = '';
    }
  }

  onModelNameChange(modelId: string) {
    // Find vendor ID from device model list
    const model = this.deviceModelList.find(m => m.param1 === modelId);
    if (model && model.param4) {
      this.vendorId = model.param4;
      this.loadDealerList(this.vendorId);
    }
  }

  loadDealerList(vendorId: string) {
    if (!vendorId) return;
    
    this.vahanService.getVendorDealerRoster(vendorId, '').subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.dealerList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: (error) => {
        console.error('Error loading dealer list:', error);
      }
    });
  }

  loadM2MProviderList() {
    this.vahanService.getM2MProviderRoster().subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.m2mProviderList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: (error) => {
        console.error('Error loading M2M provider list:', error);
      }
    });
  }

  loadNetworkList() {
    this.vahanService.getNetworkRoster().subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.networkList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: (error) => {
        console.error('Error loading network list:', error);
      }
    });
  }

  loadRTORoster() {
    this.vahanService.getRTORoster().subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.stateList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: (error) => {
        console.error('Error loading RTO roster:', error);
      }
    });
  }

  loadSubRTORoster(rtoId: string = '34') {
    this.vahanService.getSubRTORoster(rtoId).subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.rtoList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: (error) => {
        console.error('Error loading sub RTO roster:', error);
      }
    });
  }

  loadVendorList() {
    this.vahanService.getVendorRoster('', '').subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.vendorList = Array.isArray(response.entity) ? response.entity : [];
        }
      },
      error: (error) => {
        console.error('Error loading vendor list:', error);
      }
    });
  }

  getDataFromVahan() {
    if (!this.serialNo || this.serialNo.trim() === '') {
      // this.errorMessage = 'Please Provide Serial No';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    
    // Load RTO list first
    this.loadRTORoster();
    this.loadSubRTORoster()

    // Check vehicle details
    this.vahanService.checkVehicleDetails(this.serialNo, '').subscribe({
      next: (checkResponse) => {
        if (checkResponse?.status && checkResponse?.entity?.listData?.length > 0) {
          const deviceData = checkResponse.entity.listData[0];
          if (deviceData.param2 && deviceData.param2 !== '' && deviceData.param2 !== 'NA') {
            // Device already assigned
            this.msgType = 'error';
            this.errorMessage = 'Device is Already Assigned.';
            this.resetToStep1();
            this.loading = false;
            return;
          } else {
            // Get vendor ID and device ID
            this.vendorId = deviceData.param6 || '';
            this.deviceId = deviceData.param5 || '';
            // if (this.deviceId) {
            //   this.showMobileFields = false;
            // }
          }
        } else {
          // New device - show mobile fields
          this.showMobileFields = true;
        }

        // Call Vahan API
        this.callVahanAPI();
      },
      error: (error) => {
        this.loading = false;
        this.msgType = 'error';
        this.errorMessage = error?.error?.entity || 'Error checking vehicle details';
       
      }
    });
  }

  mfgYearList: number[] = [];
  generateYearList() {
    const currentYear = new Date().getFullYear();
    for (let i = 2000; i <= currentYear; i++) {
      this.mfgYearList.push(i);
    }
  }
  onChangeVehicleType() {
    this.mfgYearList = [];

    if (this.vehicleType) {
      const currentYear = new Date().getFullYear();

      // NEW -> last 8 years till current year
      if (this.vehicleType === "NEW") {
        for (let i = currentYear - 8; i <= currentYear; i++) {
          this.mfgYearList.push(i);
        }
      }

      // OLD -> 2010 to (currentYear - 8)
      if (this.vehicleType === "OLD") {
        for (let i = 2005; i <= currentYear - 9; i++) {
          this.mfgYearList.push(i);
        }
      }
    }
  }

  callVahanAPI() {
    this.vahanService.getVahanPullRequest(this.serialNo).subscribe({
     next: (response: any) => {
  this.loading = false;

  // console.log('Vahan Pull Response =>', response);

  if (!response?.status || response?.statuscode !== 200) {

    this.msgType = 'error';

    this.errorMessage =
      response?.message ||
      response?.entity?.message ||
      response?.entity ||
      'Error fetching Vahan data';

    return;
  }

  if (response?.entity?.listData?.length > 0) {
    const vahanData: VahanResposne = response.entity.listData[0];

    this.vahanResponseData = vahanData;
    
    this.populateFromVahanData(vahanData);

    this.goToStep(2);
  }
},
   error: (error: any) => {
  this.loading = false;
  this.msgType = 'error';

  // console.log('Vahan Pull Error =>', error);

  this.errorMessage =
    error?.error?.message ||
    error?.error?.entity ||
    error?.message ||
    'Error fetching Vahan data';
}
    });
  }

  populateFromVahanData(vahanData: any) {
// 1chassisNo
// 2deviceSerialno
// 3fitmentCentreName
// 4iccId
// 5imeiNo
// 6makerName
// 7modelName
// 8tacNo
// 9tacValidUpto
// 10regnNo
// 11vehclass
// 12dateOfRegistration     
// 13deviceActivationStatus
// 14gnssConstellationCode
// 15ownername
// 16engineNo 
if (vahanData.param2) {
  this.deviceSerialNo = vahanData.param2;
}
    // Vehicle No
    if (vahanData.param10) {
      this.vehicleNo = vahanData.param10;
      this.vehicleNoReadonly = true;
      this.vehicleType = 'New';
      // Determine RTO from vehicle number
      this.determineRTOFromVehicleNo(this.vehicleNo);
    } else {
      this.vehicleNoReadonly = false;
      this.vehicleType = 'Old';
    }

    // IMEI
    if (vahanData.param5) {
      this.imeiNo = vahanData.param5;
    }

    // ICCID
    if (vahanData.param4) {
      this.iccidNo = vahanData.param4;
    }

    // Chassis No
    if (vahanData.param1) {
      this.chassisNo = vahanData.param1;
    }

    if(this.vehicleNo.trim() === '' && this.chassisNo.trim() !== '') {
      this.vehicleType = 'New';
      this.vehicleNo = this.chassisNo;
    }

    // Engine No
    if (vahanData.param2) {
      this.engineNo = vahanData.param16;
    }

    // Make Name
    if (vahanData.param3) {

      this.makeName = vahanData.param3;
    }

    // Model Name (needs to match from dropdown)
    // if (vahanData.param6) {
    //   this.modelName = vahanData.param6;
    // }

    // Vehicle Class (needs to match from dropdown)
    if (vahanData.param11) {
      setTimeout(() => {
        this.cdr.detectChanges();
        this.vehicleClassList.forEach(element => {
          if(element.param2 === vahanData.param11) {
            this.vehicleClass = element.param2;
          }
        });
      }, 400);
      // this.vehicleClass = vahanData.param11;
    }

    // Owner Name
    if (vahanData.param15) {
      this.customerName = vahanData.param15;
    }
     this.customerContactNo = "";
    // Owner Contact No
    // if (vahanData.param9) {
    //   this.customerContactNo = vahanData.param9;
    //   this.ownerContactNo = vahanData.param9;
    // }

    // Manufacture Year
    if (vahanData.param12) {
      const date = new Date(vahanData.param12);
      this.manufactureYear = date.getFullYear().toString();
    const currentYear = new Date().getFullYear();
const age = currentYear - parseInt(this.manufactureYear);

this.vehicleType = age > 8 ? 'Old' : 'New';

// Validity logic
// Validity logic
if (age <= 7) {
  // 8 years or less → 2 YEAR automatically
  this.validity = '2';
  this.showValidityField = false;
} else {
  // More than 8 years → user selects validity
  this.validity = '';
  this.showValidityField = true;
}



this.onChangeVehicleType();
    }

    // RTO Name
    // if (vahanData.param12) {
    //   this.vahanRtoName = vahanData.param12;
    //   this.rtoName = vahanData.param12;
    // }
  }

  determineRTOFromVehicleNo(vehicleNo: string) {
    if (!vehicleNo || vehicleNo.length < 4 || !this.rtoList.length) return;
    
    const vehiclePrefix = vehicleNo.substring(0, 4);
    for (const rto of this.rtoList) {
      if (rto.param2) {
        const rtoPrefix = rto.param2.substring(0, 2) + rto.param2.substring(3, 5);
        if (rtoPrefix === vehiclePrefix) {
          this.rtoName = rto.param1;
          this.vahanRtoName = rto.param1;
          break;
        }
      }
    }
  }

  goToStep(step: number) {
    if (step < 1 || step > 3) return;
    
    // Validate before moving to next step
    if (step > this.currentStep) {
      if (this.currentStep === 1 && !this.validateStep1()) {
        return;
      } else if (this.currentStep === 2 && !this.validateStep2()) {
        return;
      }
    }
    
    this.currentStep = step;
    this.cdr.detectChanges();
  }

  validateStep1(): boolean {
    this.msgType = 'error';
    if (!this.serialNo || this.serialNo.trim() === '') {
      this.msgType = 'error';
      this.errorMessage = 'Please Provide Serial No';
      return false;
    }
    return true;
  }

  validateStep2(): boolean {
    if (!this.imeiNo || this.imeiNo.trim() === '') {
      
      this.errorMessage = 'Please Provide IMEI No.';
      return false;
    }
    if (!this.iccidNo || this.iccidNo.trim() === '') {
      this.errorMessage = 'Please Provide ICCID No.';
      return false;
    }
    if (this.vehicleNo.trim() === '' && this.chassisNo.trim() === '') {
      this.errorMessage = 'Please Provide Vehicle No.';
      return false;
    }
    if (!this.engineNo || this.engineNo.trim() === '') {
      this.errorMessage = 'Please Provide Engine No.';
      return false;
    }
    if (!this.makeName || this.makeName.trim() === '') {
      this.errorMessage = 'Please Provide Make Name.';
      return false;
    }
    if (!this.modelName || this.modelName === '') {
      this.errorMessage = 'Please Provide Model Name.';
      return false;
    }
    if (!this.vehicleClass || this.vehicleClass === '') {
      this.errorMessage = 'Please Provide Vehicle Class.';
      return false;
    }
    if (!this.customerName || this.customerName.trim() === '') {
      this.errorMessage = 'Please Provide Customer Name.';
      return false;
    }
    return true;
  }

  validateStep3(): boolean {
    this.msgType = 'error';
    if (!this.customerContactNo || this.customerContactNo.trim() === '') {
      this.errorMessage = 'Please Provide Customer Contact No.';
      return false;
    }
    if (this.showMobileFields) {
      if (!this.mobileNo1 || this.mobileNo1.trim() === '') {
        this.errorMessage = 'Please Provide Mobile No.1';
        return false;
      }
      if (!this.network1 || this.network1 === '') {
        this.errorMessage = 'Please Provide Network 1';
        return false;
      }
      if (!this.mobileNo2 || this.mobileNo2.trim() === '') {
        this.errorMessage = 'Please Provide Mobile No.2';
        return false;
      }
      if (!this.network2 || this.network2 === '') {
        this.errorMessage = 'Please Provide Network 2';
        return false;
      }
      if (!this.m2mProvider || this.m2mProvider === '') {
        this.errorMessage = 'Please Provide M2M Provider';
        return false;
      }
    }
    if (!this.dealerName || this.dealerName === '') {
      this.errorMessage = 'Please Provide Dealer Name';
      return false;
    }
    if (!this.rtoName || this.rtoName.trim() === '') {
      this.errorMessage = 'Please Provide RTO Name';
      return false;
    }
    if (!this.vehicleMakeName || this.vehicleMakeName === '') {
      this.errorMessage = 'Please Provide Vehicle Make Name';
      return false;
    }
    if (!this.vehicleModelName || this.vehicleModelName === '') {
      this.errorMessage = 'Please Provide Vehicle Model Name';
      return false;
    }
    if (!this.validity || this.validity === '') {
  this.errorMessage = 'Please Select Validity';
  return false;
}
    return true;
  }
showOverrideModal = false;
overrideData: any = null;
overrideReason: string = '';
closeOverrideModal() {
  this.showOverrideModal = false;
}
getWordCount(text: string): number {
  return text
    ? text.trim().split(/\s+/).filter(word => word.length > 0).length
    : 0;
}
onOverride() {

  if (!this.overrideReason || this.overrideReason.trim() === '') {
    this.msgType = 'error';
    this.errorMessage = 'Please enter reason for override';
    return;
  }

  if (this.getWordCount(this.overrideReason) < 10) {
    this.msgType = 'error';
    this.errorMessage = 'Override reason must contain at least 10 words';
    return;
  }

  this.loading = true;

  this.vehicaa
    .overrideVehicle(
      this.overrideData?.param5, // Old IMEI
      this.overrideReason
    )
    .subscribe({
      next: (response: any) => {

        this.loading = false;

        // console.log('Override Success =>', response);

        this.showOverrideModal = false;

        this.deviceEntryAndInstallation();
      },
      error: (error: any) => {

        this.loading = false;

        this.msgType = 'error';
        this.errorMessage =
          error?.error?.entity || 'Error while overriding vehicle';
      }
    });
}
onSubmit(): void {
 
  if (!this.validateStep3()) {
    return;
  }

  // Validity field only for older vehicles (> 8 years)
  if (this.showValidityField) {
    // User must select validity
    if (!this.validity) {
      this.errorMessage = 'Please Select Validity';
      return;
    }

    // Show confirmation only after user selection
    this.showValidityModal = true;
    return;
  }

  // <= 8 years → validity is automatically 2 YEAR
  this.confirmValiditySubmit();
  // this.loading = true;

  // // 1. First check by Chassis No
  // this.vahanService.checkVehicleDetails('', this.chassisNo).subscribe({
  //   next: (checkResponse: any) => {

  //     if (
  //       checkResponse?.status &&
  //       checkResponse?.entity?.listData?.length > 0
  //     ) {

  //       this.overrideData = checkResponse.entity.listData[0];
  //       this.showOverrideModal = true;
  //       this.loading = false;

  //     } else {

  //       // 2. If chassis not found, check by Vehicle No
  //       this.vahanService.checkVehicleDetails('',this.vehicleNo).subscribe({
  //         next: (vehicleResponse: any) => {

  //           if (
  //             vehicleResponse?.status &&
  //             vehicleResponse?.entity?.listData?.length > 0
  //           ) {

  //             this.overrideData =
  //               vehicleResponse.entity.listData[0];

  //             this.showOverrideModal = true;
  //             this.loading = false;

  //           } else {

  //             // 3. Nothing found
  //             this.deviceEntryAndInstallation();

  //           }
  //         },
  //         error: (error: any) => {
  //           this.loading = false;
  //           this.msgType = 'error';
  //           this.errorMessage =
  //             error?.error?.entity ||
  //             'Error checking vehicle details';
  //         }
  //       });

  //     }
  //   },
  //   error: (error: any) => {
  //     this.loading = false;
  //     this.msgType = 'error';
  //     this.errorMessage =
  //       error?.error?.entity ||
  //       'Error checking vehicle details';
  //   }
  // });
}
confirmValiditySubmit(): void {
  this.showValidityModal = false;

  this.loading = true;

  // 1. First check by Chassis No
  this.vahanService.checkVehicleDetails('', this.chassisNo).subscribe({
    next: (checkResponse: any) => {

      if (
        checkResponse?.status &&
        checkResponse?.entity?.listData?.length > 0
      ) {

        this.overrideData = checkResponse.entity.listData[0];
        this.showOverrideModal = true;
        this.loading = false;

      } else {

        // 2. If chassis not found, check by Vehicle No
        this.vahanService.checkVehicleDetails('',this.vehicleNo).subscribe({
          next: (vehicleResponse: any) => {

            if (
              vehicleResponse?.status &&
              vehicleResponse?.entity?.listData?.length > 0
            ) {

              this.overrideData =
                vehicleResponse.entity.listData[0];

              this.showOverrideModal = true;
              this.loading = false;

            } else {

              // 3. Nothing found
              this.deviceEntryAndInstallation();

            }
          },
          error: (error: any) => {
            this.loading = false;
            this.msgType = 'error';
            this.errorMessage =
              error?.error?.entity ||
              'Error checking vehicle details';
          }
        });

      }
    },
    error: (error: any) => {
      this.loading = false;
      this.msgType = 'error';
      this.errorMessage =
        error?.error?.entity ||
        'Error checking vehicle details';
    }
  });
}

  deviceEntryAndInstallation(): void {
    const request: VahanDeviceEntryRequest = {
      param2: this.vendorId || '',
      param3: this.modelName || '',
      param4: this.imeiNo || '',
      param5: this.serialNo || '',
      param6: this.iccidNo || '',
      param8: this.mobileNo1 || '',
      param9: this.mobileNo2 || '',
      param10: this.network1 || '',
      param11: this.network2 || '',
      param12: this.m2mProvider || '',
      param13: 'Vahan',
      param14: '1',
      param15: '',
      param16: '',
      param17: '',
      param19: this.vehicleMakeName || '',
      param20: this.vehicleModelName || '',
      param21: this.vehicleClass || '',
      param22: this.vehicleNo || '',
      param23: this.chassisNo || '',
      param24: this.engineNo || '',
      param25: this.manufactureYear || '',
      param26: 'WB', // RTO Code hardcoded as '34'
      param27: this.rtoName || '',
      param28: this.vehicleType || 'New',
      param29: this.customerName || '',
      param30: this.customerContactNo || '',
      param32: this.deviceId || '',
      param33: this.imeiNo || '',
      param34: this.dealerName || '',
      param35: 'Vahan',
      param36: this.validity || '',
      param37: '',
      // param38: this.validity || ''

    };

    this.vahanService.putVahanDeviceEntry(request).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response?.entity === 'Successfully saved.') {
          this.msgType = 'success';
          this.errorMessage = 'Successfully saved.';
          // Navigate to Vehicle Installation And Activation or clear form
          sessionStorage.setItem('IMEINo', this.imeiNo);
          this.clearAllData();
          this.router.navigate(['/VehicleInstallationAndActivation']);
        } else {
          this.msgType = 'error';
          this.errorMessage = response?.entity || 'Error saving data';
          this.resetToStep1();
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.msgType = 'error';
        this.errorMessage = error?.error?.entity || 'Error saving data';
      }
    });
  }

  resetToStep1(): void {
    this.currentStep = 1;
    this.serialNo = '';
    this.clearAllData();
  }

  clearAllData(): void {
    this.imeiNo = '';
    this.iccidNo = '';
    this.vehicleNo = '';
    this.chassisNo = '';
    this.engineNo = '';
    this.makeName = '';
    this.modelName = '';
    this.vehicleClass = '';
    this.customerName = '';
    this.manufactureYear = '';
    this.rtoCode = '34';
    this.rtoName = '';
    this.vehicleType = 'New';
    this.customerContactNo = '';
    this.mobileNo1 = '';
    this.network1 = '';
    this.mobileNo2 = '';
    this.network2 = '';
    this.m2mProvider = '';
    this.dealerName = '';
    this.vehicleMakeName = '';
    this.vehicleModelName = '';
    this.deviceId = '';
    this.vendorId = '';
    this.ownerContactNo = '';
    this.vahanRtoName = '';
    this.vehicleNoReadonly = false;
    this.showMobileFields = true;
  }

  hasLength(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && String(value).length > 0;
  }
}

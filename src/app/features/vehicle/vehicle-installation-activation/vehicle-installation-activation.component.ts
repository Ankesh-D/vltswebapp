import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { vehicaleInstallationRequest, VehicleService } from '../../../core/services/vehicle.service';
import { DeviceService } from '../../../core/services/device.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { RtoService } from '../../../core/services/rto.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { UnderscoreToSpacePipe } from '../../../shared/underscore-to-space.pipe';
import moment from 'moment';
import { ToastService } from '../../../core/services/toast.service';

declare var $: any;

@Component({
  selector: 'app-vehicle-installation-activation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, ToastComponent, UnderscoreToSpacePipe],
  templateUrl: './vehicle-installation-activation.component.html',
  styleUrls: ['./vehicle-installation-activation.component.scss']
})
export class VehicleInstallationActivationComponent implements OnInit, AfterViewInit {
  @ViewChild('vehicleForm') vehicleForm!: NgForm;

  // IMEI Search
  imeiNo: string = '';
  showDetails: boolean = false;
  
  // Device Details
  deviceDetails: any = null;
  deviceId: string = '';
  deviceSrNo: string = '';
  iccidNo: string = '';
  modelCode: string = '';
  m2mProvider: string = '';
  simNo1: string = '';
  simNo2: string = '';
  simNetwork1: string = '';
  simNetwork2: string = '';
  simValidity1: string = '';
  simValidity2: string = '';
  imsiPrimaryNo: string = '';
  imsiSecondaryNo: string = '';
  pollingStatus: string = '';
  errorMsg1: string = '';
  errorMsg2: string = '';
  allowErrorMsg: string = '';
  
  // Vehicle Details (if already assigned)
  vehicleType: string = '';
  vehicleNo: string = '';
  chassisNo: string = '';
  engineNo: string = '';
  vehMake: string = '';
  vehModel: string = '';
  vehClass: string = '';
  customerName: string = '';
  mobileNo: string = '';
  rtoName: string = '';
  dealerName: string = '';
  mfgYear: string = '';
  assignDate: string = '';
  activationDate: string = '';
  
  // Vehicle Installation Form
  installationVehicleType: string = 'New';
  installationVehicleNo: string = '';
  installationChassisNo: string = '';
  installationEngineNo: string = '';
  installationCustomerName: string = '';
  installationMobileNo: string = '';
  installationVehicleMake: any = null;
  installationVehicleModel: any = null;
  installationVehicleClass: any = null;
  installationRTO: any = null;
  installationDealer: any = null;
  installationMfgYear: any = null;
  installationStateCode: any = null;
  pollingTime: string = '';
  devicemode: string = '';
  // Vehicle Activation
  otp: string = '';
  otpResponseCode: any= '';
  resStatus: string = '';
  outputMessage: string = '';
  showActivation: boolean = false;
  
  // Dropdowns
  deviceMasterList: any[] = [];
  vehicleMakeList: any[] = [];
  vehicleModelList: any[] = [];
  vehicleClassList: any[] = [];
  rtoList: any[] = [];
  dealerList: any[] = [];
  stateList: any[] = [];
  yearList: number[] = [];
  liveData: any[] = [];
searchByLive: string = '';
pageNo: string = '1';
itemPerPage: string = '1';
  lastAlertTime: string = '';
  loading: boolean = false;
  roleId: string = '';
  msgType: any = "success";
  errorMessage: string | null = "";
  activationCheckData: any = null;
  vehicleTypes = [
  { label: 'New', value: 'New' },
  { label: 'Old', value: 'Old' }
];


  constructor(
    private vehicleService: VehicleService,
    private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private rtoService: RtoService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    public toast: ToastService
  ) {}
  
  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleId') || '';
    this.generateYearList();
    this.loadNotActivatedDevices();
    this.loadVehicleMakeList();
    this.loadVehicleClassList();
    this.loadRTORoster();
    this.loadStateList();
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
      }
    }, 200);
  }
  totalChecks: any = 0;
  passedChecks: any = 0;
  activationCheckFlag: boolean = false;
  vehicleActivationCheck() {
    let request  = {
      "deviceid": this.deviceId,
      "time_synced": moment().format('YYYY-MM-DD HH:mm:ss') 
    }
    this.toast.loaderFlag = true;
    this.vehicleService.checkComplianceAcknowledgement(request).subscribe({
      next: (response) => {
        this.toast.loaderFlag = false;
        if (response.entity.param1 === 'Success') {
          this.activationCheckData = JSON.parse(response.entity.param2)[0];
          this.totalChecks = Object.keys(this.activationCheckData).length;
          this.passedChecks = Object.values(this.activationCheckData).filter(value => value === 'true' || value === true).length;
          if (this.passedChecks === this.totalChecks) {
            // this.msgType = "success";
            // this.toast.show('All compliance checks passed', 'success', 6000);
            // this.errorMessage = 'All compliance checks passed';
            this.activationCheckFlag = true;
          } else {
             this.activationCheckFlag = false;
            //  this.msgType = "error";
            //  this.errorMessage = 'Some compliance checks failed. Please review the details.';    
            this.toast.show('The device has failed to meet AIS-140 compliance requirements. Necessary corrective action must be taken to ensure full compliance before resubmission.', 'error', 10000);
          }
        }
      },
      error: (error) => {
        this.activationCheckFlag = false;
        this.toast.loaderFlag = false;
        this.msgType = "error";
        this.errorMessage = 'Error checking compliance acknowledgement';
      }
    });
  }
  openComplianceCheckModal() {
    $("#complianceCheckModal").modal('show');
  }
  refreshComplianceCheck() {
    this.vehicleActivationCheck();
  }
  
  generateYearList() {
    const currentYear = new Date().getFullYear();
    for (let i = 2000; i <= currentYear; i++) {
      this.yearList.push(i);
    }
  }
  
  loadNotActivatedDevices() {
    this.loading = true;
    const request = {
      param1: '',
      param2: 'NA',
      param3: 'NA',
      param8: '',
      param9: '',
      param10: 'Not Activated',
      param11: ''
    };
    
    this.deviceService.getDeviceMasterDetails(request as any).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceMasterList = response.entity.listData || [];
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading devices:', error);
      }
    });
  }
  
  
  getDetails() {
    this.msgType = 'error';
    if (!this.imeiNo || this.imeiNo.length !== 15) {
      this.errorMessage = 'Imei No. should be 15 digit.';
      
      return;
    }
    
    const device = this.deviceMasterList.find(d => d.param5 === this.imeiNo);
    if (!device) {
      this.errorMessage = "Device not found.";
      return;
    }
    this.showDetails = true;
    this.deviceDetails = device;
    this.deviceId = device.param2 || '';
    this.imeiNo = device.param5 || '';
    this.deviceSrNo = device.param6 || '';
    this.iccidNo = device.param7 || '';
    this.modelCode = device.param18 || '';
    this.m2mProvider = device.param14 || '';
    this.simNo1 = device.param8 || '';
    this.simNo2 = device.param9 || '';
    this.simNetwork1 = device.param10 || '';
    this.simNetwork2 = device.param11 || '';
    this.imsiPrimaryNo = device.param67 || 'NA';
    this.imsiSecondaryNo = device.param68 || 'NA';
    this.simValidity1 = device.param50 || 'NA';
    this.simValidity2 = device.param51 || 'NA';
    this.pollingStatus = device.param48 || '';
    this.pollingTime = device.param60 || '';
    
    if (!this.simValidity1 || this.simValidity1 === 'undefined' || this.simValidity1 === '') {
      this.errorMsg1 = 'Sim validity is not available.';
    } else {
      this.errorMsg1 = '';
    }
    
    if (!this.simValidity2 || this.simValidity2 === 'undefined' || this.simValidity2 === '') {
      this.errorMsg2 = 'Sim validity is not available.';
    } else {
      this.errorMsg2 = '';
    }
    
    // if (device.param47 === 'Not Assigned' && device.param48 !== 'Connected') {
    //   this.allowErrorMsg = 'You are not allow to assign the vehicle when polling status is Not Received/Never Received. ' + this.errorMsg1;
    // } else {
    //   this.allowErrorMsg = '';
    // }
    
    if (device.param47 === 'Not Assigned') {
      setTimeout(() => {
      this.vehicleForm.resetForm();
    }, 200);
      this.showDetails = true;
      this.loadDealerList();
    } else if (device.param34 !== 'Activated') {
      // Load existing vehicle details
      this.vehicleType = device.param28 || '';
      this.vehicleNo = device.param20 || '';
      this.chassisNo = device.param21 || '';
      this.engineNo = device.param22 || '';
      this.vehMake = device.param52 || '';
      this.vehModel = device.param53 || '';
      this.vehClass = device.param65 || '';
      this.customerName = device.param37 || '';
      this.mobileNo = device.param38 || '';
      this.rtoName = device.param27 || '';
      this.dealerName = device.param16 || '';
      this.mfgYear = device.param25 || '';
      this.assignDate = device.param54 || '';
      this.activationDate = device.param23 || '';
      this.devicemode=device.param32;
      this.checkDeviceValidity();
      this.vehicleActivationCheck();
    }
    
    this.cdr.detectChanges();
  }
  
  checkDeviceValidity() {
    this.loading = true;
    const request = {
      param1: this.deviceDetails.param43 || '',
      param4: this.deviceId,
      param5: this.iccidNo,
      param6: this.vehicleType,
      param7: this.activationDate,
      param8: this.deviceDetails.param19 || ''
    };

    this.vehicleService.checkDeviceValidity(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          if (response.entity.includes('true')) {
            this.resStatus = 'true';
            this.showActivation = true;
         const fullMsg = response?.entity || '';
const [message, status] = fullMsg.split('#');

this.outputMessage = message?.trim();

// ❌ validity issue hai to custom message set karo
if (message.includes('validity is NA')) {
  this.outputMessage = 'Please update SIM validity before OTP.';
}
            // this.sendOTP();
          } else {
            this.resStatus = 'false';
        const fullMsg = response?.entity || '';
const [message, status] = fullMsg.split('#');

this.outputMessage = message?.trim();

// ❌ validity issue hai to custom message set karo
if (message.includes('validity is NA')) {
  this.outputMessage = ' Please update SIM validity before OTP.';
}
          if (response.entity.includes('true')) {
  this.resStatus = 'true';
} else {
  this.resStatus = 'false';
}

// ✅ ALWAYS SHOW ACTIVATION SECTION
this.showActivation = true;
          }
        }
      }
      ,
      error: (error) => {
        this.loading = false;
        this.msgType = "error";
        this.errorMessage = "Error checking device validity";
      }
    });
    
    
    this.loading = false;
    if (this.pollingStatus === 'Connected') {
      this.resStatus = 'true';
      this.showActivation = true;
      

    }
  }
  
  loadVehicleMakeList() {
    this.vehicleService.getVehicleMakeList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vehicleMakeList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading vehicle make list:', error);
      }
    });
  }
  
  onVehicleMakeChange() {
    
    if (this.installationVehicleMake) {
      this.vehicleService.getVehicleModelList(this.installationVehicleMake).subscribe({
        next: (response) => {
          if (response.status && response.entity) {
            this.vehicleModelList = response.entity;
          }
        },
        error: (error) => {
          console.error('Error loading vehicle model list:', error);
        }
      });
    } else {
      this.vehicleModelList = [];
    }
  }
  
  loadVehicleClassList() {
    this.vehicleService.getVehicleClassRoster().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vehicleClassList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading vehicle class list:', error);
      }
    });
  }
  
  loadRTORoster() {
    this.rtoService.getCityRTOList().subscribe({
      next: (response:any) => {
        if (response.status && response.entity) {
          this.rtoList = response.entity.listData;
        }
      },
      error: (error) => {
        console.error('Error loading RTO list:', error);
      }
    });
  }
  
  loadStateList() {
    this.dashboardService.getStateList().subscribe({
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
  
  loadDealerList() {
    // Load dealer list based on vendor
    // Implementation depends on API
    
    this.dashboardService.getDealerListByVendor(this.deviceDetails.param19, '').subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.dealerList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading dealer list:', error);
      }
    });
  }
  
  onVehicleTypeChange() {
    if (this.installationVehicleType === 'Old') {
      // Show vehicle number field
    } else {
      // Hide vehicle number field
    }
  }
  
  vehicleInstallation() {
    
    // if (this.errorMsg1 !== '' || this.allowErrorMsg !== '') {
    //   return;
    // }
    
    // if (!this.installationChassisNo || !this.installationEngineNo || !this.installationCustomerName ||
    //     !this.installationMobileNo || !this.installationVehicleMake || !this.installationVehicleModel ||
    //     !this.installationVehicleClass || !this.installationRTO || !this.installationDealer || !this.installationMfgYear) {
    //   return;
    // }
    
    this.loading = true;
    const request: vehicaleInstallationRequest = new vehicaleInstallationRequest();
      request.param2 = this.installationVehicleMake;
      request.param3 = this.installationVehicleModel;
      request.param4 = this.installationVehicleClass;
      request.param5 = this.installationVehicleNo || '';  
      request.param6 = this.installationChassisNo;
      request.param7 = this.installationEngineNo;
      request.param8 = this.installationMfgYear;
      request.param9 = this.installationRTO; //this.installationStateCode,
      request.param10 = this.installationRTO;
      request.param11 = this.installationVehicleType;
      request.param12 = this.installationCustomerName;
      request.param13 = this.installationMobileNo;
      request.param15 = this.deviceId;
      request.param16 = this.imeiNo;
      request.param17 = this.installationDealer;

    // "param2": "manufacturecode",
    // "param3": "vendorid",
    // "param4": "deviceimeino",
    // "param5": "deviceiccidno",
    // "param6": "vehiclechasisno",
    // "param7": "vehicleengineno",
    // "param8": vehiclemfgyear,
    // "param9": "vehiclertoname",
    // "param10": "vehicletype --> New/Exit",
    // "param11": "customername",
    // "param12": "customermobileno",
    // "param13": "loginid",
    // "param15": "dealername",
    // "param16": "dealermobileno",
    // "param17": "rtostatecode"
    this.vehicleService.vehicleInstallation(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
        this.msgType = "success";
        this.errorMessage = response.entity;
          if (response.entity.includes('Successfully')) {
            this.back();
            this.loadNotActivatedDevices();
          }
        }
      },
      error: (error) => {
        this.loading = false;
        this.msgType = "error";
        this.errorMessage = "Error in installing vehicle";
      }
    });
  }
  
sendOTP() {
  if (!this.activationCheckFlag) {
    this.toast.show('Complete compliance first', 'error');
    return;
  }

  const request = {
    param1: this.deviceId,
    param3: this.mobileNo,
    param4: this.deviceDetails.param19 || '',
    param6: this.deviceDetails.param17 || '',
    param10: this.chassisNo,
    param11: this.imeiNo
  };

  this.vehicleService.sendActivationOtp(request).subscribe({
    next: () => {
      this.toast.show('OTP sent successfully', 'success');
    },
    error: () => {
      this.toast.show('Error sending OTP', 'error');
    }
  });
}
  
  activateVehicle() {
    if (!this.otp || this.otp.length !== 6) {
      this.msgType = "error";
      this.errorMessage = 'Please enter valid OTP';
      return;
    }
    
    this.loading = true;
    // const request = {
    //   param1: this.encryptionService.encryptAccountId(this.deviceDetails.param19 || ''),
    //   param2: this.otp
    // };
    const request = {
      "param1": this.deviceId,//deviceid,
      "param2": this.otp,//otp,
      "param3": this.mobileNo,//mobileno,
      "param4": this.deviceDetails.param19 || '',//vehicleid
      "param6": 'installation'
    };
    
    this.vehicleService.activateVehicle(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {

          if (response.entity.includes('Successfully')) {
            this.msgType = "success";
            this.errorMessage = response.entity;
            this.back();
            this.loadNotActivatedDevices();
          }
        }
      },
      error: (error) => {
        this.loading = false;
        this.msgType = "error";
        this.errorMessage = error;
      }
    });
  }
  
  back() {
    this.imeiNo = '';
    this.showDetails = false;
    this.showActivation = false;
    this.deviceDetails = null;
    this.otp = '';
    this.outputMessage = '';
  }

  updateSimValidity() {

    const deviceData = {
      param1: this.deviceDetails.param7,   // device iccid no
      param2: this.deviceDetails.param15,  // vendor name
      param3: this.deviceDetails.param45,  // mgf code
      param4: this.deviceDetails.param14   // m2m code
    };

    
    this.dashboardService.updateSimValidity(deviceData).subscribe({
      next: (response) => {
        const message = response?.entity;

        if (message === 'Successfully saved' || message === 'Successfully updated') {
          this.msgType = "success";
        this.errorMessage = 'Sim Validity Updated Successfully';
          // this.validityFlag = true;
          this.notActivatedDevices()
        } else {
          this.msgType = "error";
        this.errorMessage = 'Sim validity is not available.';
        }

      },
      error: (error) => {
        // commonutility.hidespinner();
        this.msgType = "error";
        this.errorMessage = error?.error?.entity || 'Something went wrong';
      }
    });
  }
  notActivatedDevices() {
    let request =  {
          "param1":this.deviceDetails.param5,
					"param2":"NA",
					"param3":"NA",
					"param8":"",
					"param9":"",
					"param10":"Not Activated",
					"param11":""
    }
    this.deviceService.getDeviceMasterDetails(request as any).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.deviceMasterList = response.entity.listData || [];
          try{
						this.simValidity1 = this.deviceMasterList[0].param50;
						if(this.simValidity1=='undefined' || this.simValidity1=='' || this.simValidity1==null){
							this.errorMsg1 = "Sim validity is not available.";
						}else{
							this.errorMsg1 = "";
						}
					}catch(e){
						this.simValidity1 = "NA";
					}
					try{
						this.simValidity2 = this.deviceMasterList[0].param51;
						if(this.simValidity2=='undefined' || this.simValidity2=='' || this.simValidity2==null){
							this.errorMsg2 = "Sim validity is not available.";
						}else{
							this.errorMsg2 = "";
						}
					}catch(e){
						this.simValidity2 = "NA";
					}

					if(this.deviceMasterList[0].param34!="Activated" && this.deviceMasterList[0].param47=="Assigned"){
						this.getDetails();
					}
        } 
      },
      error: (error) => {
        console.error('Error loading devices:', error);
      }
    })
  }
getLiveEmergencyData() {

  const imeiValue = this.imeiNo || '';

  this.dashboardService.getLiveEmergencyDetails(
    '',
    '1',
    '10',
    imeiValue
  ).subscribe({
    next: (res: any) => {
      if (res.status && res.entity) {

        const data = res.entity.listData || [];

        if (data.length > 0) {
          this.lastAlertTime = data[0].alertdate; // ✅ ONLY FIRST RECORD
        }

      }
    },
    error: (err) => {
      console.error('API Error:', err);
    }
  });
}
openOtpModal() {
  this.sendOTP(); // first send OTP
  $("#otpModal").modal('show');
}

verifyOtp() {

  if (!this.otp || this.otp.length !== 6) {
    this.toast.show('Enter valid OTP', 'error');
    return;
  }

  const request = {
    param1: this.deviceId,
    param2: this.otp,
    param3: this.mobileNo,
    param4: this.deviceDetails.param19 || '',
    param6: 'installation'
  };

  this.vehicleService.activateVehicle(request).subscribe({
    next: (res) => {
      if (res.status && res.entity.includes('Successfully')) {

        this.toast.show('Vehicle Activated Successfully', 'success');

        $("#otpModal").modal('hide'); // ✅ close modal

        this.back();
        this.loadNotActivatedDevices();
      }
    },
    error: () => {
      this.toast.show('Invalid OTP', 'error');
    }
  });
}
canShowOtpButton(): boolean {
  return this.pollingStatus === 'Received' &&
         this.devicemode?.toUpperCase() === 'TCP' &&
         this.isRecentTime(this.lastAlertTime) &&
         this.isGpsValid() &&
         this.resStatus === 'true';   // ✅ API validity check
}
isRecentTime(time: string): boolean {
  if (!time) return false;

  const givenTime = new Date(time);
  const now = new Date();

  return (
    givenTime.getDate() === now.getDate() &&
    givenTime.getMonth() === now.getMonth() &&
    givenTime.getFullYear() === now.getFullYear()
  );
}
isGpsValid(): boolean {
  return !(this.deviceDetails?.param61 === "0" && this.deviceDetails?.param62 === "0");
}
getAlertStatus(): 'no-alert' | 'old-alert' | 'today-alert' {
  if (!this.lastAlertTime) return 'no-alert';

  const given = new Date(this.lastAlertTime.replace(' ', 'T'));
  const today = new Date();

  const isToday =
    given.getDate() === today.getDate() &&
    given.getMonth() === today.getMonth() &&
    given.getFullYear() === today.getFullYear();

  return isToday ? 'today-alert' : 'old-alert';
}
}

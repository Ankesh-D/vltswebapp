import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
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
    selector: 'app-new-vehicle-installation-activation',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, ToastComponent, UnderscoreToSpacePipe],
    templateUrl: './new-vehicle-installation-activation.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './new-vehicle-installation-activation.component.scss'
})
export class NewVehicleInstallationActivationComponent implements OnInit, AfterViewInit {
  @ViewChild('vehicleForm') vehicleForm!: NgForm;

  // IMEI Search
  imeiNo: string = '';
  displayimei: string = '';
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
devicemfgname:string='';
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
  Certificate_Validity: string = '';
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
  otpResponseCode: any = '';
  otpSent: boolean = false;
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
  ) { 
    this.toast.pageName = 'Vehicle Installation & Activation'; // Set page name for toast service
  }

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleId') || '';
    this.generateYearList();
    this.loadNotActivatedDevices();
    this.loadVehicleMakeList();
    this.loadVehicleClassList();
    this.loadRTORoster();
    this.loadStateList();
    this.loadNotActivatedDevices();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
      }
    }, 200);
    if(sessionStorage.getItem('IMEINo')) {
      this.imeiNo = sessionStorage.getItem('IMEINo') || '';
      this.onFetchClick();
    }
  }
  totalChecks: any = 0;
  passedChecks: any = 0;
  activationCheckFlag: boolean = false;
  vehicleActivationCheck() {

    let request = {
      "deviceid": this.deviceId,
      "time_synced": moment().format('YYYY-MM-DD HH:mm:ss')
    };

    this.toast.loaderFlag = true;

    this.vehicleService.checkComplianceAcknowledgement(request).subscribe({

      next: (response) => {

        this.toast.loaderFlag = false;

        if (response.status==true) {

          // ✅ Original API Response
          this.activationCheckData = JSON.parse(response.entity.param2)[0];

          // ✅ FORCE ALL FALSE ONLY WHEN POLLING NEVER RECEIVED
          if (
            this.pollingStatus === 'Never Received..' ||
            !this.pollingStatus ||
            this.pollingStatus !== 'Received'
          ) {

            Object.keys(this.activationCheckData).forEach((key) => {

              this.activationCheckData[key] = false;

            });

          }

          // ✅ Count
          this.totalChecks = Object.keys(this.activationCheckData).length;

          this.passedChecks = Object.values(this.activationCheckData)
            .filter(value => value === 'true' || value === true).length;

          // ✅ Final Flag
          if (this.passedChecks === this.totalChecks) {

            this.activationCheckFlag = true;

          } else {

            this.activationCheckFlag = false;

            // this.toast.show(
            //   'The device has failed to meet AIS-140 compliance requirements. Necessary corrective action must be taken to ensure full compliance before resubmission.',
            //   'error',
            //   10000
            // );

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
  loadNotActivatedDevices() {
    //  this.deviceMasterList = [
    //     { param1: '868329083991517' },
    //      { param1: '868329081612123' }
    //   ];
    this.loading = true;

    this.deviceService.getNotActivatedDeviceList().subscribe({
      next: (response) => {
        this.loading = false;

        if (response.status && response.entity) {
          this.deviceMasterList = response.entity || [];

        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }
  onClearClick(showToast: boolean = true) {
    if (!this.imeiNo || this.imeiNo.trim() === '') {
      this.toast.show('Please enter IMEI first', 'error');
      return;
    }
    // 🔥 Reset IMEI
    // this.imeiNo = null;

    // 🔥 Hide details
    this.showDetails = false;
    this.imeiNo = '';
    // 🔥 Clear all data fields
    this.deviceDetails = null;

    this.deviceId = '';
    this.deviceSrNo = '';
    this.iccidNo = '';
    this.modelCode = '';
    this.m2mProvider = '';

    this.simNo1 = '';
    this.simNo2 = '';
    this.simNetwork1 = '';
    this.simNetwork2 = '';
    this.simValidity1 = '';
    this.simValidity2 = '';

    this.imsiPrimaryNo = '';
    this.imsiSecondaryNo = '';

    this.pollingStatus = '';
    this.pollingTime = '';
    this.devicemode = '';

    this.vehicleType = '';
    this.vehicleNo = '';
    this.chassisNo = '';
    this.engineNo = '';
    this.vehMake = '';
    this.vehModel = '';
    this.vehClass = '';
    this.customerName = '';
    this.mobileNo = '';
    this.rtoName = '';
    this.dealerName = '';
    this.mfgYear = '';
    this.assignDate = '';

    this.lastAlertTime = '';
    this.otp = '';
    this.otpResponseCode = '';
    this.outputMessage = '';
    this.resStatus = '';
    this.totalChecks = 0;
    this.passedChecks = 0;
    this.activationCheckData = null;

    // 🔥 Other flags
    this.showActivation = false;
    this.activationCheckFlag = false;
    this.otpSent = false;

    // 🔥 Clear live data
    this.liveData = [];
    if (showToast) {
      this.toast.show('Cleared successfully', 'success');
    }
  }
  openComplianceCheckModal() {
    // if(this.activationCheckData && this.activationCheckData.length > 0) {
      $("#complianceCheckModal").modal('show');
    // }
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
  //   onImeiChange() {

  //   if (this.imeiNo && this.imeiNo.length === 15) {

  //     this.toast.show('Loading new IMEI...', 'info');

  //     this.getDetails(); // auto fetch

  //   }
  // }
  onImeiSelect() {
    // if (!this.imeiNo || this.imeiNo.length !== 15) return;
    if (this.imeiNo && this.imeiNo.length === 15) {

      this.toast.show('Loading new IMEI...', 'success');

      this.getDetails(); // auto fetch
      //  this.checkDeviceValidity();
      //       this.vehicleActivationCheck();
    }

    // this.getDetails();
    //  this.checkDeviceValidity();
    // this.vehicleActivationCheck();
  }
  onFetchClick() {
    if (!this.imeiNo || this.imeiNo.length !== 15) {
      this.errorMessage = 'IMEI must be 15 digit';
      return;
    }

    this.getDetails();

  }
  onRefreshClick() {
    if (!this.imeiNo || this.imeiNo.trim() === '') {
      this.toast.show('Please enter IMEI first', 'error');
      return;
    }
    // if (!this.imeiNo) {
    //   this.toast.show('Enter IMEI first', 'error');
    //   return;
    // }

    this.toast.show('Refreshing...', 'success');

    this.getDetails(); // reuse
  }
  // onRefreshClick() {

  //   if (!this.imeiNo) return;
  //  this.getDetails(); 
  //   this.getLiveEmergencyData();
  // }
  // loadNotActivatedDevices() {
  //   this.loading = true;
  //   const request = {
  //     param1: '',
  //     param2: 'NA',
  //     param3: 'NA',
  //     param8: '',
  //     param9: '',
  //     param10: 'Not Activated',
  //     param11: ''
  //   };

  //   this.deviceService.getDeviceMasterDetails(request as any).subscribe({
  //     next: (response) => {
  //       this.loading = false;
  //       if (response.status && response.entity) {
  //         this.deviceMasterList = response.entity.listData || [];
  //       }
  //     },
  //     error: (error) => {
  //       this.loading = false;
  //       console.error('Error loading devices:', error);
  //     }
  //   });
  // }


  getDetails() {

    this.imeiNo = (this.imeiNo || '').trim();

    if (!this.imeiNo || this.imeiNo.length !== 15) {
      this.errorMessage = 'IMEI must be 15 digit';
      return;
    }

    const request = {
      param1: this.imeiNo,
      param2: 'NA',
      param3: 'NA',
      param8: '',
      param9: '',
      param10: 'Not Activated',
      param11: '',
      pdfexcel:''
    };

    this.loading = true;

    this.deviceService.getDeviceMasterDetails(request as any).subscribe({
      next: (response) => {
        sessionStorage.removeItem('IMEINo'); 
        this.loading = false;
        // ✅ HANDLE NO DATA / FALSE STATUS FIRST
        if (!response || response.status === false) {

          const msg = response?.entity?.toString() || 'No Data Found';

          this.onClearClick(false);   // clear UI
          this.toast.show(msg, 'error');  // ✅ SHOW THIS

          return;
        }
        if (response.status && response.entity) {

          const data = response.entity.listData || [];

          if (data.length > 0) {
            // Clear IMEI from session storage after successful fetch
            const device: any = data[0];
if ((device.param47 || '').trim() === 'Not Assigned') {
  this.showDetails = false;
  this.deviceDetails = null;

  this.toast.show(
    'Do vahan installation first then go for activation',
    'error'
  );

  return; // No further processing and no API calls
}
            // Device
            this.deviceDetails = device;
            this.deviceId = device.param2 || '';
            this.imeiNo = device.param5 || '';
            this.displayimei = device.param5 || '';
            this.deviceSrNo = device.param6 || '';
            this.iccidNo = device.param7 || '';
            this.modelCode = device.param18 || '';
            this.m2mProvider = device.param14 || '';
this.devicemfgname= device.param15
            // SIM
            this.simNo1 = device.param8 || 'NA';
            this.simNo2 = device.param9 || 'NA';
            this.simNetwork1 = device.param10 || 'NA';
            this.simNetwork2 = device.param11 || 'NA';
            this.simValidity1 = device.param50 || 'NA';
            this.simValidity2 = device.param51 || 'NA';

            // IMSI
            this.imsiPrimaryNo = device.param67 || 'NA';
            this.imsiSecondaryNo = device.param68 || 'NA';
            this.Certificate_Validity = device.param77 || 'NA';

            // Status
            this.pollingStatus = device.param48 || '';
            this.pollingTime = device.param60 || '';
            this.devicemode = device.param32 || '';

            // Vehicle
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

            this.showDetails = true;
            this.loadDealerList();
            // ✅ dependent calls
            this.checkDeviceValidity();
            this.vehicleActivationCheck();
            this.getLiveEmergencyData();
            this.toast.show('Device loaded successfully', 'success');
          }
          else {

            const message = response?.entity?.toString() || 'No Data Found';

            this.showDetails = false;
            this.deviceDetails = null;

            this.onClearClick(false);   // ❗ clear without success toast

            this.toast.show(message, 'error');  // ✅ proper toaster


          }
        }

      },
      error: () => {
        this.loading = false;

        this.onClearClick(false);   // ❗ no success toast

        this.toast.show('API Error while fetching device', 'error');
      }
    });
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

      if (response?.status && response?.entity) {

        const entity = response.entity.toString();

        // API returns message#true OR message#false
        const parts = entity.split('#');

        const apiMessage = parts[0] || '';
        const validityFlag = (parts[1] || '').toLowerCase();

        if (validityFlag === 'true') {

          this.resStatus = 'true';
          this.showActivation = true;

          // ✅ Error remove
          this.outputMessage = '';

          this.toast.show('Device Valid', 'success');

        } else {

          this.resStatus = 'false';
          this.showActivation = true;

          // ✅ API ka actual message dikhao
          this.outputMessage = apiMessage;

          this.toast.show(apiMessage, 'error');
        }
      }
    },
    error: () => {

      this.loading = false;

      this.resStatus = 'false';

      this.outputMessage = 'Error checking device validity';

      this.toast.show('Error checking device validity', 'error');
    }
  });
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
      next: (response: any) => {
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
    this.dashboardService.getDealerListByVendor(this.deviceDetails.param19 || '', '').subscribe({
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

  this.loading = true;

  const request: vehicaleInstallationRequest = new vehicaleInstallationRequest();

  request.param1 =  '0';                    // vehicleid
  request.param2 = this.installationVehicleMake;           // vehiclemakeid
  request.param3 = this.installationVehicleModel;          // vehiclemodelid
  request.param4 = this.installationVehicleClass;          // vehicleclassid
  request.param5 = this.installationVehicleNo ||this.installationChassisNo;       // vehicleregno
  request.param6 = this.installationChassisNo;             // vehiclechasisno
  request.param7 = this.installationEngineNo;              // vehicleengineno
  request.param8 = this.installationMfgYear;               // vehiclemfgyear
  request.param9 = "WB";             // vehiclestatecode
  request.param10 = this.installationRTO;                  // vehiclertoid
  request.param11 = this.installationVehicleType;          // New/Exit
  request.param12 = this.installationCustomerName;         // customername
  request.param13 = this.installationMobileNo;             // customermobileno
  request.param15 = this.deviceId;                         // deviceid
  request.param16 = this.imeiNo;                           // deviceimeino
  request.param17 = this.installationDealer;               // dealerid
  request.param18 = 'Web';                                // Application/Web/Vahan/Excel

  this.vehicleService.vehicleInstallation(request).subscribe({
    next: (response) => {
      this.loading = false;

      if (response.status && response.entity) {
        this.msgType = 'success';
        this.errorMessage = response.entity;

        if (response.entity.includes('Successfully')) {
          this.back();
          this.loadNotActivatedDevices();
        }
      }
    },
    error: () => {
      this.loading = false;
      this.msgType = 'error';
      this.errorMessage = 'Error in installing vehicle';
    }
  });
}

  sendOTP() {
    if (!this.canShowOtpButton()) {
      this.toast.show('OTP not allowed for current AIS compliance status', 'error');
      return;
    }

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
      next: (response) => {
        this.otpResponseCode = response?.status ? '200' : '';
        this.otpSent = !!response?.status;
        this.toast.show('OTP sent successfully', 'success');
      },
      error: () => {
        this.otpResponseCode = '';
        this.otpSent = false;
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
    this.otpSent = false;
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
    let request = {
      "param1": this.deviceDetails.param5,
      "param2": "NA",
      "param3": "NA",
      "param8": "",
      "param9": "",
      "param10": "Not Activated",
      "param11": ""
    }
    this.deviceService.getDeviceMasterDetails(request as any).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.deviceMasterList = response.entity.listData || [];
          try {
            this.simValidity1 = this.deviceMasterList[0].param50;
            if (this.simValidity1 == 'undefined' || this.simValidity1 == '' || this.simValidity1 == null) {
              this.errorMsg1 = "Sim validity is not available.";
            } else {
              this.errorMsg1 = "";
            }
          } catch (e) {
            this.simValidity1 = "NA";
          }
          try {
            this.simValidity2 = this.deviceMasterList[0].param51;
            if (this.simValidity2 == 'undefined' || this.simValidity2 == '' || this.simValidity2 == null) {
              this.errorMsg2 = "Sim validity is not available.";
            } else {
              this.errorMsg2 = "";
            }
          } catch (e) {
            this.simValidity2 = "NA";
          }

          if (this.deviceMasterList[0].param34 != "Activated" && this.deviceMasterList[0].param47 == "Assigned") {
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

    this.toast.loaderFlag = true;
    this.liveData = [];
    this.lastAlertTime = '';

    this.dashboardService.getLiveEmergencyDetails('', '1', '10', this.imeiNo)
      .subscribe({
        next: (res: any) => {

          this.toast.loaderFlag = false;

          if (res.status && res.entity) {
            const data = res.entity.listData || [];
            this.liveData = data;
            if (data.length > 0) {
              this.lastAlertTime = data[0].alertdate;
            } else {
              this.lastAlertTime = '';
            }
          }

        },
        error: () => {
          this.toast.loaderFlag = false;
          this.liveData = [];
          this.lastAlertTime = '';
        }
      });
  }
  openOtpModal() {
    this.sendOTP();
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
        if (res.statuscode == 200) {
          this.toast.show(res.entity || 'Vehicle Activated Successfully', 'success');

          this.back();
          this.loadNotActivatedDevices();
        } else {
          this.toast.show(res.entity, 'error');
        }
      },
      error: () => {
        this.toast.show('Invalid OTP', 'error');
      }
    });
  }
  canShowOtpButton(): boolean {

    return this.pollingStatus === 'Received' &&
      this.isModeAllowed() &&
      this.isRecentTime(this.lastAlertTime) &&
      this.isGpsValid() &&
      this.activationCheckFlag &&
      this.resStatus === 'true' && this.isPanicLocationValid() &&
      this.isSimValidityEligible(); // ✅ NEW CHECK
  }
  isComplianceModalOpen: boolean = false;
openComplianceModal(): void {
  this.isComplianceModalOpen = true;
}
closeComplianceModal(): void {
  this.isComplianceModalOpen = false;
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

    const lat = this.getGpsLatitude();
    const lng = this.getGpsLongitude();

    // ❌ NA check
    if (
      !lat || !lng ||
      lat === 'NA' || lng === 'NA'
    ) {
      return false;
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    // ❌ invalid number
    if (
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      return false;
    }

    // ❌ 0,0 check
    if (latitude === 0 && longitude === 0) {
      return false;
    }

    return true;
  }
  getDeviceMode(): string {

    return (this.devicemode || 'NA').toUpperCase();

  }

 isModeAllowed(): boolean {
  const mode = this.getDeviceMode();
  return mode === 'TCP' || mode === 'HTTP';
}
  getPanicLatitude(): string {
  return this.liveData?.[0]?.latitude ?? 'NA';
}

getPanicLongitude(): string {
  return this.liveData?.[0]?.longitude ?? 'NA';
}

isPanicLocationValid(): boolean {

  const lat = this.getPanicLatitude();
  const lng = this.getPanicLongitude();

  if (
    !lat || !lng ||
    lat === 'NA' || lng === 'NA'
  ) {
    return false;
  }

  const latitude = Number(lat);
  const longitude = Number(lng);

  // ❌ invalid number
  if (
    isNaN(latitude) ||
    isNaN(longitude)
  ) {
    return false;
  }

  // ❌ 0,0 invalid
  if (latitude === 0 && longitude === 0) {
    return false;
  }

  return true;
}

  getModeErrorMessage(): string {

    const mode = this.getDeviceMode();

    if (mode === 'HTTP') {
      return 'HTTP not allowed';
    }

    if (mode === 'NA') {
      return 'Mode not available';
    }

    return 'Invalid mode';
  }
  getGpsLatitude(): string {
    return this.deviceDetails?.param61 ?? this.liveData?.[0]?.latitude ?? 'NA';
  }
  getGpsLongitude(): string {
    return this.deviceDetails?.param62 ?? this.liveData?.[0]?.longitude ?? 'NA';
  }
// isSimValidityEligible(): boolean {

//   // ✅ Vehicle Type
//   const vehicleType =
//     (this.deviceDetails?.param28 || '')
//       .trim()
//       .toUpperCase();

//   // ✅ OLD = 1 year | NEW = 2 years
//   const requiredYears =
//     vehicleType === 'OLD' ? 1 : 2;

//   // ✅ Parse dates
//   const sim1 = moment(this.simValidity1, 'DD-MMM-YYYY', true);
//   const sim2 = moment(this.simValidity2, 'DD-MMM-YYYY', true);

//   if (!sim1.isValid() || !sim2.isValid()) {
//     return false;
//   }

//   // ✅ Today start
//   const today = moment().startOf('day');

//   // ✅ Required validity date
//   const minDate = today.clone().add(requiredYears, 'years').subtract(1, 'days');

//   // ✅ Allow same date also
//   return (
//     sim1.startOf('day').isSameOrAfter(minDate) &&
//     sim2.startOf('day').isSameOrAfter(minDate)
//   );
// }


isSimValidityEligible() {
  return true;
}
  formatDateTime(date: any): string {
    if (!date) return 'NA';

    const d = new Date(date);

    if (isNaN(d.getTime())) return date; // agar already formatted hai

    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // 👉 24-hour format
    });
  }
  getGpsStatusText(): string {
    if (this.isGpsValid()) {
      return `GPS Valid (${this.getGpsLatitude()}, ${this.getGpsLongitude()})`;
    }

    return `GPS Invalid (${this.getGpsLatitude()}, ${this.getGpsLongitude()})`;
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

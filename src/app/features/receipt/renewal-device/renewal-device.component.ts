import { DeviceService } from "./../../../core/services/device.service";
import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from "@angular/core";
import {
  GetStatusService,
  ReceiptStatusResponse,
} from "../../../core/services/get-status.service";
import { MapboxService } from "../../../core/services/mapbox.service";
import { VehicleService } from "../../../core/services/vehicle.service";
import { Router } from "@angular/router";
import { DashboardService } from "../../../core/services/dashboard.service";
import { ToastService } from "../../../core/services/toast.service";
import { FormsModule, NgForm, ValidationErrors } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { UnderscoreToSpacePipe } from "../../../shared/underscore-to-space.pipe";
import moment from "moment";
import { LoaderService } from "../../../core/services/loader.service";
import { NgSelectModule } from "@ng-select/ng-select";
import { VahanService } from "../../../core/services/vahan.service";
import {
  updateRenewalInfoReq,
  VahanPullReq,
} from "../../../core/model/request.model";
import { ApiResponse } from "../../../core/services/base-api.service";
import { VahanPullResponse } from "../../../core/model/response.model";
import { ValidationsService } from "../../../core/services/validations.service";

@Component({
    selector: "app-renewal-device",
    imports: [FormsModule, CommonModule, UnderscoreToSpacePipe, NgSelectModule],
    templateUrl: "./renewal-device.component.html",
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: "./renewal-device.component.scss"
})
export class RenewalDeviceComponent implements OnInit {
  statusDetailsFlag: boolean = false;
  searchBy: string = "";
  responseData: ReceiptStatusResponse = new ReceiptStatusResponse();
  totalChecks: any = 0;
  passedChecks: any = 0;
  showActivation: boolean = false;
  isDataLoaded: boolean = false;
  otp: string = "";
  timerText: string = "02:00";
  otpTimerFlag: boolean = false;
  otpResponseCode: any = "";

  updateType: string = "";
  editCustomerName: string = "";
  editCustomerMobile: string = "";
  editDeviceIccid: string = "";
  m2mProviderId: string = "";
  m2mProviderObj: any = null;
  m2mProviderList: any[] = [];
  roleId: any = sessionStorage.getItem("roleid");
  activationCheckData: any;
  activationCheckFlag: boolean = false;
  @ViewChild("searchForm") searchForm!: NgForm;
  @ViewChild("editForm") editForm!: NgForm;
  receiveStatus: string = "";
  mfgYearList: number[] = [];
  mfgYearObj: any = null;
  networkList: any[] = [];
  vehicleMakeObj: any = null;
  vehicleMakeList: any[] = [];
  vehicleModelObj: any = null;
  vehicleModelList: any[] = [];
  vehicleClassObj: any = null;
  vehicleClassList: any[] = [];
  network1Obj: any = null;
  network1List: any[] = [];
  network2Obj: any = null;
  network2List: any[] = [];
  editMobileNo1: string = "";
  editMobileNo2: string = "";
  rtoList: any[] = [];
  rtoObj: any = null;
  vehicleTypeObj: any = null;
  vehicleTypeList = ["NEW", "OLD"];
  initFlag: boolean = false;
  constructor(
    private getStatusService: GetStatusService,
    public mapBoxService: MapboxService,
    private vehicleService: VehicleService,
    private router: Router,
    private dashboardService: DashboardService,
    public toastService: ToastService,
    public loaderService: LoaderService,
    public vahanService: VahanService,
    public vs: ValidationsService
  ) {
    this.toastService.pageName = "Device Renewal"; // Set page name for toast service
    this.isDataLoaded = false;
  }

  ngOnInit(): void {
    this.getM2mProviderList();
    this.loadNetworkList();
    this.loadVehicleMakeList();
    this.loadVehicleClassList();
    this.loadRTOList();
    this.generateYearList();
    this.initFlag = true;

    
  }
  vahanResponse: VahanPullResponse = new VahanPullResponse();
  getVahanPullResponse() {
    let vahanReq = new VahanPullReq();
    vahanReq.deviceSerialNo = this.responseData.param5;
    this.vahanService.vahanPullRequest(vahanReq).subscribe({
      next: (response: any) => {
        this.vahanResponse = response.entity.listData[0];
        this.vahanResponse.param12 = this.vahanResponse.param12!='' ? moment(this.vahanResponse.param12).format("YYYY") : '';
        if((this.responseData.param20=='old activated' || this.responseData.param20=='pending otp')) {
          this.updateOnFetchData();
        }
      },
      error: (error: any) => {},
    });
  }
  generateYearList() {
    const currentYear = new Date().getFullYear();
    for (let i = 2000; i <= currentYear; i++) {
      this.mfgYearList.push(i);
    }
  }
  onChangeVehicleType() {
    this.mfgYearList = [];

    if (this.vehicleTypeObj) {
      const currentYear = new Date().getFullYear();

      // NEW -> last 8 years till current year
      if (this.vehicleTypeObj === "NEW") {
        for (let i = currentYear - 8; i <= currentYear; i++) {
          this.mfgYearList.push(i);
        }
      }

      // OLD -> 2010 to (currentYear - 8)
      if (this.vehicleTypeObj === "OLD") {
        for (let i = 2005; i <= currentYear - 9; i++) {
          this.mfgYearList.push(i);
        }
      }
    }
  }
  loadRTOList() {
    this.dashboardService.getRTOList("").subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.rtoList = response.entity;
        }
      },
      error: (error) => {
        console.error("Error loading RTO list:", error);
      },
    });
  }

  loadVehicleClassList() {
    this.vahanService.getVehicleClassRoster().subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.vehicleClassList = Array.isArray(response.entity)
            ? response.entity
            : [];
        }
      },
      error: (error) => {
        console.error("Error loading vehicle class list:", error);
      },
    });
  }

  loadVehicleMakeList() {
    this.vahanService.getVehicleMakeRoster().subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.vehicleMakeList = Array.isArray(response.entity)
            ? response.entity
            : [];
        }
      },
      error: (error) => {
        console.error("Error loading vehicle make list:", error);
      },
    });
  }
  loadVehicleModelList(makeid: string) {
    this.vahanService.getVehicleModelRosterByMake(makeid).subscribe({
      next: (response) => {
        if (response?.status && response?.entity) {
          this.vehicleModelList = Array.isArray(response.entity)
            ? response.entity
            : [];
          this.vehicleModelList.forEach((element) => {
            if (this.responseData.param54 == element.param1) {
              this.vehicleModelObj = element;
            }
          });
        }
      },
      error: (error) => {
        console.error("Error loading vehicle model list:", error);
      },
    });
  }
  onVehicleMakeChange(make: any) {
    if (make) {
      this.vahanService.getVehicleModelRosterByMake(make.param1).subscribe({
        next: (response) => {
          if (response?.status && response?.entity) {
            this.vehicleModelList = Array.isArray(response.entity)
              ? response.entity
              : [];
          }
        },
        error: (error) => {
          console.error("Error loading vehicle model list:", error);
        },
      });
    } else {
      this.vehicleModelList = [];
    }
  }
  loadNetworkList() {
    this.dashboardService.getNetworkList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.networkList = response.entity;
        }
      },
      error: (error) => {
        console.error("Error loading network list:", error);
      },
    });
  }

  getM2mProviderList() {
    this.dashboardService.getM2MProviderList().subscribe({
      next: (response: any) => {
        if (response.status && response.entity) {
          this.m2mProviderList = response.entity;
        } else {
          this.m2mProviderList = [];
        }
      },
      error: () => {
        this.m2mProviderList = [];
      },
    });
  }
  onM2MProviderChange() {
    if(this.vahanResponse.param4=='') {
      this.editDeviceIccid = "";
    }
  }
  onFetchClick() {
    if (this.searchForm.valid) {
      this.isDataSaved = false;
      
      let paramValue = this.searchBy.trim();
      this.loaderService.show();
      this.getStatusService
        .getStatusDetails({
          param1: paramValue,
          param10: "forrenewal",
          pdfexcel: "",
        })
        .pipe()
        .subscribe({
          next: (response) => {
            this.loaderService.hide();
            if (response.statuscode == 200 && response.entity) {
              this.isDataLoaded = true;
              this.showActivation = false;
              this.responseData = response.entity;
              this.responseData.param20 = this.responseData.param20.toLowerCase();
                this.getVahanPullResponse();
                this.statusDetailsFlag = true;
                this.checkDeviceValidity();
                this.vehicleActivationCheck();
                this.getLiveEmergencyData();
            } else {
              this.statusDetailsFlag = false;
              this.isDataLoaded = false;
              this.toastService.show(
                "No data found for the given search criteria.",
                "error",
              );
            }
          },
          error: (error) => {
            this.isDataLoaded = false;
          },
        });
    }
  }

  onRefreshClick() {
    if (this.searchForm.valid) {
      this.initFlag = true;
      this.onFetchClick();
    } else {
      this.toastService.show(
        "Please enter a valid search criteria to refresh.",
        "error",
      );
    }
  }

  onClearClick() {
    this.isDataSaved = false;
    this.vehicleMakeObj = null;
    this.vehicleModelObj = null;
    this.vehicleClassObj = null;
    this.network1Obj = null;
    this.network2Obj = null;
    this.m2mProviderObj = null;
    this.rtoObj = null;
    this.vehicleTypeObj = null;
    this.mfgYearObj = null;
    this.editVehicleNo = "";
    this.editChassisNo = "";
    this.editEngineNo = "";
    this.editDeviceIccid = "";
    this.editMobileNo1 = "";
    this.editMobileNo2 = "";
    this.editCustomerName = "";
    this.editCustomerMobile = "";
    this.vahanResponse = new VahanPullResponse();
    this.editForm.resetForm();

    this.statusDetailsFlag = false;
    this.isDataLoaded = false;
    this.searchForm.resetForm();
    this.responseData = new ReceiptStatusResponse();
  }

  BackToDetails() {}

  checkDeviceValidity() {
    const request = {
      param1: this.responseData.param2 || "", //vendorid
      param4: this.responseData.param1, // deviceid
      param5: this.responseData.param6, // iccidno
      param6: this.responseData.param19, // vehicletype
      param7: this.responseData.param16, //activationdata
      param8: this.responseData.param12 || "", //vehicleid
    };
    this.vehicleService.checkDeviceValidity(request).subscribe({
      next: (response) => {
        this.toastService.loaderFlag = false;
        if (response.status && response.entity) {
          if (response.entity.includes("true")) {
            this.receiveStatus = "true";
            this.toastService.show("Device Valid", "success");
          } else {
            this.receiveStatus = "false";
            this.toastService.show("Device not valid for activation", "error");
          }
        }
      },
      error: () => {
        this.toastService.loaderFlag = false;
        this.toastService.show("Error checking device validity", "error");
      },
    });

    this.toastService.loaderFlag = false;
    if (this.responseData.param25 === "Connected") {
      this.receiveStatus = "true";
    }
  }
  liveData: any[] = [];
  lastAlertTime: string = "";
  getLiveEmergencyData() {
    this.toastService.loaderFlag = true;
    this.liveData = [];
    this.lastAlertTime = "";

    this.dashboardService
      .getLiveEmergencyDetails("", "1", "10", this.responseData.param4)
      .subscribe({
        next: (res: any) => {
          this.toastService.loaderFlag = false;

          if (res.status && res.entity) {
            const data = res.entity.listData || [];
            this.liveData = data;
            if (data.length > 0) {
              this.lastAlertTime = data[0].alertdate;
            } else {
              this.lastAlertTime = "";
            }
          }
        },
        error: () => {
          this.toastService.loaderFlag = false;
          this.liveData = [];
          this.lastAlertTime = "";
        },
      });
  }
  editVehicleNo: string = "";
  editChassisNo: string = "";
  editEngineNo: string = "";

  openEditCustomerInfoModal(type: string) {
    // if(this.checkSimValidityForEdit() ) {
    
    this.editCustomerName = this.vahanResponse.param15 !='' ? this.vahanResponse.param15 : this.responseData.param23;
    this.editCustomerMobile = this.responseData.param24;
    this.editDeviceIccid = this.vahanResponse.param4 !='' ? this.vahanResponse.param4 :this.responseData.param6;
    this.editVehicleNo = this.vahanResponse.param10 !='' ? this.vahanResponse.param10 :this.responseData.param13;
    this.editChassisNo = this.vahanResponse.param1 !='' ? this.vahanResponse.param1 : this.responseData.param14;
    this.editEngineNo = this.vahanResponse.param16 !='' ? this.vahanResponse.param16 : this.responseData.param15;
    if (this.responseData.param52 && this.vehicleMakeObj == null) {
      // this.vehicleMakeObj = null;

      this.vehicleMakeList.forEach((element) => {
        if (this.responseData.param52 == element.param1) {
          this.vehicleMakeObj = element;
        }
      });
    }
    if(this.vehicleClassObj == null) {
      this.vehicleClassList.forEach((element) => {
        if(this.vahanResponse.param11 != '') {
          if (this.vahanResponse.param11.toLowerCase() == element.param2.toLowerCase()) {
            this.vehicleClassObj = element;
          }
        } else {
          if (this.responseData.param56 == element.param1) {
            this.vehicleClassObj = element;
          }
        }

      });
    } 
    // else 
    // if ((this.responseData.param56 != '0' && this.responseData.param56 != '') && this.vehicleClassObj == null) {
    //   // this.vehicleClassObj = null;
    //   this.vehicleClassList.forEach((element) => {
    //     if (this.responseData.param56 == element.param1) {
    //       this.vehicleClassObj = element;
    //     }
    //   });
    // }
    if (this.responseData.param19 && this.vehicleTypeObj == null) {
      this.vehicleTypeList.forEach((element) => {
        if (this.responseData.param19.toUpperCase() == element.toUpperCase()) {
          this.vehicleTypeObj = element;
        }
      });
    }

    if (this.responseData.param54 && this.vehicleModelObj == null) {
      // this.vehicleModelObj = null;
      this.loadVehicleModelList(this.responseData.param52);
    }
    if (this.responseData.param58 && this.network1Obj == null) {
      // this.network1Obj = null;
      this.networkList.forEach((element) => {
        if (this.responseData.param58 == element.param1) {
          this.network1Obj = element;
        }
      });
    }
    if (this.responseData.param60 && this.network2Obj == null) {
      // this.network2Obj = null;
      this.networkList.forEach((element) => {
        if (this.responseData.param60 == element.param1) {
          this.network2Obj = element;
        }
      });
    }

    // default selected m2m provider
    // this.m2mProviderObj = this.responseData.param10 || '';
    if (this.responseData.param42) {
      this.m2mProviderList.forEach((element) => {
        if (
          this.responseData.param42.toUpperCase() ==
          element.param3.toUpperCase()
        ) {
          this.m2mProviderObj = element;
        }
      });
    }
    if (this.responseData.param62 && this.rtoObj == null) {
      this.rtoList.forEach((element) => {
        if (this.responseData.param62 == element.param1) {
          this.rtoObj = element;
        }
      });
    }
    this.editMobileNo1 = this.responseData.param66;
    this.editMobileNo2 = this.responseData.param67;
    if(this.mfgYearObj == null) {
    if(this.vahanResponse.param12!='') {
      this.mfgYearObj = Number(this.vahanResponse.param12);  
    } else {
      if(Number(this.responseData.param22) > 2000 && Number(this.responseData.param22) <= new Date().getFullYear()) {
      this.mfgYearObj =
        this.responseData.param22 && this.responseData.param22 != "0"
          ? Number(this.responseData.param22)
          : null;
      } else{
        this.mfgYearObj = null;
      }
    }
  }
  
    this.onChangeVehicleType();
    this.updateType = type;

    this.toastService.openModal("editCustomerInfoModal");
    // } else {
    //   this.toastService.show("SIM validity is not available. Please update the SIM validity.", "error");
    // }
  }
  checkMfgYear() {
    if(Number(this.responseData.param22) > 2000 && Number(this.responseData.param22) <= new Date().getFullYear()) {
      return this.responseData.param22;
    } else {
     return  this.responseData.param22 = '-';
    }
  }
  openComplianceCheckModal() {
    if(this.responseData.param20 == 'activated') {
      this.toastService.show("Device is already activated.", "success");
     
    } else {
      if(this.activationCheckData) {
        this.toastService.openModal("complianceCheckModal");
      }
    }

    // $("#complianceCheckModal").modal('show');
  }

  updateSimValidity() {
    let deviceData: any = {};
    if(this.isDataSaved) {
      deviceData = {
        param1: this.editDeviceIccid, // device iccid no
        param2: this.vahanResponse.param6 ? this.vahanResponse.param6 : this.responseData.param8, // vendor name
        param3: this.responseData.param9 ? this.responseData.param9 : "", // vndor provider
        param4: this.m2mProviderObj.param3 ? this.m2mProviderObj.param3 : "", // m2m code
      };
    } else {
      deviceData = {
        param1: this.responseData.param6 ? this.responseData.param6 : "", // device iccid no
        param2: this.responseData.param8 ? this.responseData.param8 : "", // vendor name
        param3: this.responseData.param9 ? this.responseData.param9 : "", // vendor provider
        param4: this.responseData.param42 ? this.responseData.param42 : "", // m2m code
      };
    }

    this.dashboardService.updateSimValidity(deviceData).subscribe({
      next: (response) => {
        const message = response?.entity;

        if (
          message === "Successfully saved" ||
          message === "Successfully updated"
        ) {
          this.toastService.show(
            "Sim Validity Updated Successfully",
            "success",
          );
          // this.validityFlag = true;
          // this.refreshStatus();
        } else {
          this.toastService.show("Sim validity is not available.", "error");
        }
      },
      error: (error) => {
        // commonutility.hidespinner();
        this.toastService.show(
          error?.error?.entity || "Something went wrong",
          "error",
        );
      },
    });
  }
  updateSimValidityFromEdit() {
    const deviceData = {
      param1: this.editDeviceIccid, // device iccid no
      param2: this.vahanResponse.param6 ? this.vahanResponse.param6 : this.responseData.param8, // vendor name
      param3: this.responseData.param9 ? this.responseData.param9 : "", // vendor code
      param4: this.m2mProviderObj.param3 ? this.m2mProviderObj.param3 : "", // m2m code
    };

    this.dashboardService.updateSimValidity(deviceData).subscribe({
      next: (response) => {
        const message = response?.entity;

        if (
          message === "Successfully saved" ||
          message === "Successfully updated"
        ) {
          this.toastService.show(
            "Sim Validity Updated Successfully",
            "success",
          );
          this.saveCustomerInfo();
          // this.validityFlag = true;
          // this.refreshStatus();
        } else {
          this.toastService.show("Sim validity is not available. Please update the sim validity first.", "error");
          this.toastService.closeModal("editCustomerInfoModal");
        }
      },
      error: (error) => {
        // commonutility.hidespinner();
        this.toastService.show(
          error?.error?.entity || "Something went wrong",
          "error",
        );
      },
    });
  }
  getDeviceMode(): string {
    return (this.responseData.param51 || "NA").toUpperCase();
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
    const lat = this.responseData.param33;
    const lng = this.responseData.param34;

    // ❌ NA check
    if (!lat || !lng || lat === "NA" || lng === "NA") {
      return false;
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    // ❌ invalid number
    if (isNaN(latitude) || isNaN(longitude)) {
      return false;
    }

    // ❌ 0,0 check
    if (latitude === 0 && longitude === 0) {
      return false;
    }

    return true;
  }

  isSimValidityEligible(): boolean {
    const today = moment().startOf("day");

    // param50
    const sim1 = this.responseData.param27
      ? moment(this.responseData.param27, "DD-MMM-YYYY")
      : null;

    // param51
    const sim2 = this.responseData.param28
      ? moment(this.responseData.param28, "DD-MMM-YYYY")
      : null;

    if (!sim1 || !sim1.isValid() || !sim2 || !sim2.isValid()) {
      return false;
    }

    // today + 1 year
    const minValidDate = moment(today).add(12, "months").subtract(1, "days");

    return sim1.isSameOrAfter(minValidDate) && sim2.isSameOrAfter(minValidDate);
  }

  vehicleActivationCheck() {
    let request = {
      deviceid: this.responseData.param1,
      time_synced: moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    this.toastService.loaderFlag = true;

    this.vehicleService.checkComplianceAcknowledgement(request).subscribe({
      next: (response) => {
        this.toastService.loaderFlag = false;

        if (response.status==true ) {
          // ✅ Original API Response
          this.activationCheckData = JSON.parse(response.entity.param2)[0];

          // ✅ FORCE ALL FALSE ONLY WHEN POLLING NEVER RECEIVED
          if (
            this.responseData.param25 == "Never Connected" ||
            this.responseData.param25 == "Not Connected"
          ) {
            Object.keys(this.activationCheckData).forEach((key) => {
              this.activationCheckData[key] = false;
            });
          }

          // ✅ Count
          this.totalChecks = Object.keys(this.activationCheckData).length;

          this.passedChecks = Object.values(this.activationCheckData).filter(
            (value) => value === "true" || value === true,
          ).length;
          // ✅ Final Flag
          if (this.passedChecks === this.totalChecks) {
            this.activationCheckFlag = true;
          } else {
            this.activationCheckFlag = false;
            // if(this.responseData.param20 !='activated') {
            //   this.toastService.show(
            //     "The device has failed to meet AIS-140 compliance requirements. Necessary corrective action must be taken to ensure full compliance before resubmission.",
            //     "error",
            //   );

            // }
          }
        }
      },

      error: (error) => {
        this.activationCheckFlag = false;

        this.toastService.loaderFlag = false;

        // this.msgType = "error";
        this.toastService.show(
          "Error checking compliance acknowledgement",
          "error",
        );
        // this.errorMessage = 'Error checking compliance acknowledgement';
      },
    });
  }
  refreshComplianceCheck() {
    this.vehicleActivationCheck();
  }
  getOTPValidationErrors(): string[] {
    const errors: string[] = [];
    this.responseData.param13 = this.vahanResponse.param10 !='' ? this.vahanResponse.param10 : this.responseData.param13;  
    if (this.responseData?.param13 == "" ) {
      errors.push("Vehicle no. is missing");
    }
    this.responseData.param14 = this.vahanResponse.param1 !='' ? this.vahanResponse.param1 : this.responseData.param14;
    if (this.responseData?.param14 == "") {
      errors.push("Chassis no. is missing");
    }
     this.responseData.param15 = this.vahanResponse.param16 !='' ? this.vahanResponse.param16 : this.responseData.param15;
    if (this.responseData?.param15 == "") {
      errors.push("Engine no. is missing");
    }
    this.responseData.param23 = this.vahanResponse.param15 !='' ? this.vahanResponse.param15 : this.responseData.param23;
    if (this.responseData?.param23 == "") {
      errors.push("Customer name is missing");
    }
    
    if (this.responseData?.param24 == "") {
      errors.push("Customer mobile no. is missing");
    }
    this.responseData.param22 = this.vahanResponse.param12 !='' ? this.vahanResponse.param12 : this.responseData.param22;
    if (
      this.responseData?.param22 == "" ||
      this.responseData?.param22 == "0" ||
      this.responseData?.param22 == ""
    ) {
      errors.push("Manufacturing Year is missing");
    }
    if (
      this.responseData?.param53 == "" ||
      this.responseData?.param53 == "-" ||
      this.responseData?.param53 == ""
    ) {
      errors.push("Vehicle make is missing");
    }
    if (
      this.responseData?.param55 == "" ||
      this.responseData?.param55 == "-" ||
      this.responseData?.param55 == ""
    ) {
      errors.push("Vehicle model is missing");
    }
    this.responseData.param57 = this.vahanResponse.param11 !='' ? this.vahanResponse.param11 : this.responseData.param57;
    if (
      this.responseData?.param57 == "" ||
      this.responseData?.param57 == "-" ||
      this.responseData?.param57 == ""
    ) {
      errors.push("Vehicle class is missing");
    }
    if (
      this.responseData?.param63 == "" ||
      this.responseData?.param63 == "-" ||
      this.responseData?.param63 == "---" ||
      this.responseData?.param63 == ""
    ) {
      errors.push("RTO name is missing");
    }

    // device error
    // if (this.responseData?.param17 == ""  this.responseData?.param17 != "0") {
    //   errors.push("Activation No is missing");
    // }

    // if (this.responseData?.param16 == "" || this.responseData?.param16 == "") {
    //   errors.push("Activation Date is missing");
    // }

    if (this.responseData?.param5 == "") {
      errors.push("Serial No is missing");
    }

    if (this.responseData?.param4 == "") {
      errors.push("IMEI No is missing");
    }

    if (this.responseData?.param43 == "" && this.m2mProviderObj == null) {
      errors.push("Esim Provider is missing");
    }

    if (this.responseData?.param6 == "" ) {
      errors.push("ICCID No is missing");
    }

    if (this.responseData?.param10 == "") {
      errors.push("Model Name is missing");
    }

    if (this.responseData?.param61 == "") {
      errors.push("Network 1 is missing");
    }

    if (this.responseData?.param66 == "") {
      errors.push("SIM 1 is missing");
    }

    if (this.responseData?.param59 == "") {
      errors.push("Network 2 is missing");
    }

    if (this.responseData?.param67 == "") {
      errors.push("SIM 2 is missing");
    }

    if (this.responseData?.param8 == "") {
      errors.push("Vendor is missing");
    }
    if (
      !this.responseData?.param43 ||
      this.responseData?.param43.trim() == ""
    ) {
      errors.push("Esim Provider is missing");
    }

    // connectivity status errors

    if (this.responseData?.param25 != "Connected") {
      errors.push("Device status should be Connected");
    }

    if (
      !this.responseData?.param51 ||
      this.responseData?.param51.toLowerCase() !== "tcp"
    ) {
      errors.push("Device mode should be TCP");
    }

    if (!this.isRecentTime(this.responseData?.param32)) {
      errors.push("Recent alert not available");
    }

    if (!this.isGpsValid()) {
      errors.push("GPS data is invalid");
    }

    if (!this.isSimValidityEligible()) {
      errors.push("SIM validity is not eligible");
    }

    if (!this.activationCheckFlag) {
      errors.push("Compliance checks are pending");
    }
    // if (!this.checkValidityWithin8Months()) {
    //   errors.push('Device validity is either expired or exceeds the allowed 8-month limit');
    // }

    return errors;
  }

  canSendOTP(): boolean {
    return this.getOTPValidationErrors().length === 0;
  }
  validateForSendOTP(): boolean {
    // if(this.responseData.param22 == '0' || this.responseData.param22 == '') {
    //   this.toastService.show("Manufacturing year is not valid. Please update the manufacturing year to proceed.", 'error');
    //   return false;
    // }

    // if(this.responseData.param43 == '') {
    //   this.toastService.show("Esim Provider is not available. Please update the Esim provider to proceed.", 'error');
    //   return false;
    // }
    
    if (this.responseData.param25 != "Connected") {
      this.toastService.show(
        "All compliance should be met to send OTP",
        "error",
      );
      // this.toastService.show('OTP can only be sent when device is connected', 'error');

      return false;
    } else if (this.getDeviceMode() != "TCP") {
      this.toastService.show(
        "All compliance should be met to send OTP",
        "error",
      );
      // this.toastService.show('OTP can only be sent when device mode is TCP', 'error');

      return false;
    } else if (!this.isRecentTime(this.responseData.param32)) {
      this.toastService.show(
        "All compliance should be met to send OTP",
        "error",
      );
      // this.toastService.show('OTP can only be sent when there is a recent alert (same day)', 'error');
      return false;
    } else if (!this.isGpsValid()) {
      this.toastService.show(
        "All compliance should be met to send OTP",
        "error",
      );
      // this.toastService.show('OTP cannot be sent because GPS data is invalid', 'error');
      return false;
    } else if (!this.isSimValidityEligible()) {
      this.toastService.show(
        "All compliance should be met to send OTP",
        "error",
      );

      // this.toastService.show('OTP cannot be sent because SIM validity is not eligible', 'error');
      return false;
    } else if (!this.activationCheckFlag) {
      this.toastService.show(
        "All compliance should be met to send OTP",
        "error",
      );

      // this.toastService.show('OTP cannot be sent because activation checks have not passed', 'error');
      return false;
    } else if (this.responseData.param51.toLowerCase() !== "tcp") {
      this.toastService.show(
        "All compliance should be met to send OTP",
        "error",
      );
      // this.toastService.show('OTP can only be sent when device mode is TCP', 'error');
      return false;
    } else {
      // this.toastService.show('All conditions met. You can send the OTP.', 'success');
      this.sendOTP();
      return true;
    }
  }

  @ViewChild("otpForm") otpForm!: NgForm;
  isDataSaved: boolean = false;
  sendOTP() {
    const request = {
      param1: this.responseData.param1, //this.deviceId,
      param3: this.responseData.param24, //this.mobileNo,
      param4: this.responseData.param12, //this.deviceDetails.param19 || '',
      param6: this.responseData.param24, //this.deviceDetails.param17 || '',
      param10: this.responseData.param14, //this.chassisNo,
      param11: this.responseData.param4, //this.imeiNo
    };
    this.vehicleService.sendActivationOtp(request).subscribe({
      next: (response) => {
        if (response.statuscode == 200) {
          this.otpResponseCode = "200"; //response.statuscode;
          this.toastService.show("OTP sent successfully", "success");
          this.showActivation = true;
          this.otpTimerFlag = false;
          // if(this.isDataSaved) {
          //   this.updateRenewalInfo();
          // }
          this.start2MinCounter();
          setTimeout(() => {
            this.otp = "";
            this.otpForm.resetForm();
          }, 3000);
        }
      },
      error: (error) => {
        this.toastService.show("Error sending OTP", "error");
      },
    });
  }

  private intervalRef: any;

  start2MinCounter() {
    let totalSeconds = 2 * 60; // 2 minutes
    this.otpTimerFlag = true;
    // clear old timer if running
    if (this.intervalRef) clearInterval(this.intervalRef);

    this.intervalRef = setInterval(() => {
      const min = Math.floor(totalSeconds / 60);
      const sec = totalSeconds % 60;

      this.timerText = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

      totalSeconds--;

      if (totalSeconds < 0) {
        this.otpTimerFlag = false;
        clearInterval(this.intervalRef);
        this.timerText = "00:00";
        //r finished');
      }
    }, 1000);
  }

  activateVehicle() {
    if (!this.otp || this.otp.length !== 6) {
      this.toastService.show("Please enter valid OTP", "error");
      return;
    }

    const request = {
      param1: this.responseData.param1 ? this.responseData.param1 : "", //deviceid,
      param2: this.otp, //otp,
      param3: this.responseData.param24 ? this.responseData.param24 : "", //mobileno,
      param4: this.responseData.param12 || "", //vehicleid
      param6: "renewal",
    };

    this.vehicleService.activateVehicle(request).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          if (response.entity.includes("Successfully")) {
            this.toastService.show(response.entity, "success");
            setTimeout(() => {
              this.router.navigate(["/getstatus"]);
              this.otpResponseCode = null;
            }, 3000);
          } else {
            this.toastService.show(response.entity, "error");
          }
        }
      },
      error: (error: any) => {
        this.toastService.show("Error activating vehicle", "error");
      },
    });
  }
  updateInforReq: updateRenewalInfoReq = new updateRenewalInfoReq();
  
  saveCustomerInfo() {
    if (this.editForm.valid) {
      this.updateInforReq.vehicleid = this.responseData.param12 || "";
      this.updateInforReq.vehicleno = this.editVehicleNo;
      this.updateInforReq.chassisno = this.editChassisNo;
      this.updateInforReq.engineno = this.editEngineNo;
      this.updateInforReq.vehiclemakeid = this.vehicleMakeObj
        ? this.vehicleMakeObj.param1
        : "";
      this.updateInforReq.vehiclemodelid = this.vehicleModelObj
        ? this.vehicleModelObj.param1
        : "";
      this.updateInforReq.vehicleclassid = this.vehicleClassObj
        ? this.vehicleClassObj.param1
        : "";
      this.updateInforReq.vehicletype = this.vehicleTypeObj
        ? this.vehicleTypeObj
        : "";
      this.updateInforReq.mfgyear = this.mfgYearObj ? this.mfgYearObj : "";
      this.updateInforReq.customername = this.editCustomerName;
      this.updateInforReq.customermobileno = this.editCustomerMobile;
      this.updateInforReq.rtoid = this.rtoObj ? this.rtoObj.param1 : "";

      this.updateInforReq.iccidno = this.editDeviceIccid;
      this.updateInforReq.m2mproviderid = this.m2mProviderObj
        ? this.m2mProviderObj.param1
        : "";
      this.updateInforReq.mobileno1 = this.editMobileNo1
        ? this.editMobileNo1
        : "";
      this.updateInforReq.networkid1 = this.network1Obj
        ? this.network1Obj.param1
        : "";
      this.updateInforReq.mobileno2 = this.editMobileNo2
        ? this.editMobileNo2
        : "";
      this.updateInforReq.networkid2 = this.network2Obj
        ? this.network2Obj.param1
        : "";

      
      
      
      // this.responseData.param13 = this.updateInforReq.vehicleno;
      // this.responseData.param14 = this.updateInforReq.chassisno;
      // this.responseData.param15 = this.updateInforReq.engineno;
      // this.responseData.param19 = this.updateInforReq.vehicletype;
      // this.responseData.param22 = this.updateInforReq.mfgyear;
      // this.responseData.param23 = this.updateInforReq.customername;
      // this.responseData.param24 = this.updateInforReq.customermobileno;
      // this.responseData.param53 = this.vehicleMakeObj
      //   ? this.vehicleMakeObj.param2
      //   : "";
      // this.responseData.param55 = this.vehicleModelObj
      //   ? this.vehicleModelObj.param2
      //   : "";

      // this.responseData.param57 = this.vahanResponse.param11 !='' ? this.vahanResponse.param11 : this.responseData.param57; 
      // this.responseData.param57 = this.vehicleClassObj
      //   ? this.vehicleClassObj.param2
      //   : "";
      // this.responseData.param63 = this.rtoObj ? this.rtoObj.param2 : "";
      // this.responseData.param43 = this.m2mProviderObj
      // ? this.m2mProviderObj.param2
      // : "";
      // this.responseData.param6 = this.updateInforReq.iccidno;
      // this.responseData.param59 = this.network1Obj
      //   ? this.network1Obj.param2
      //   : "";
      // this.responseData.param66 = this.updateInforReq.mobileno1;
      // this.responseData.param61 = this.network2Obj
      //   ? this.network2Obj.param2
      //   : "";
      // this.responseData.param67 = this.updateInforReq.mobileno2;
      
        this.isDataSaved = true;
        
        this.updateBeforeVerifyOTP()
        // this.toastService.closeModal("editCustomerInfoModal");
       
        // this.responseData.param8 = this.updateInforReq.
      
    } else {
      this.toastService.show("All fields are mendatory.");
    }
  }
  updateRenewalInfo() {
    this.vehicleService.updateRenewalInfo(this.updateInforReq).subscribe({
      next: (response: any) => {
        if (response.status) {
          if (response.statuscode == "200") {
            this.toastService.show(
              "Customer info updated successfully",
              "success",
            );
            // $('#editCustomerInfoModal').modal('hide');
            this.toastService.closeModal("editCustomerInfoModal");
            setTimeout(() => {
              this.onFetchClick();
            }, 2000);
          } else {
            this.toastService.show(response.entity, "error");
          }
        } else {
          this.toastService.show("Failed to update customer info", "error");
        }
      },
      error: () => {
        this.toastService.show("Error updating customer info", "error");
      },
    });
  }
  checkValidityWithin12Months(): boolean {
    if (!this.responseData?.param30) {
      return false;
    }

    const validityDate = new Date(this.responseData.param30);
    const currentDate = new Date();

    // Current date + 8 months
    const eightMonthsLater = new Date();
    eightMonthsLater.setMonth(currentDate.getMonth() + 8);

    // True if validity date is expired OR within next 8 months
    return validityDate <= eightMonthsLater;
  }
  enableForEdit(): boolean {
    if (!this.responseData?.param30) {
      return false;
    }

    const validityDate = new Date(this.responseData.param30);
    const currentDate = new Date();

    // Current date + 3 months
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(currentDate.getMonth() + 3);

    // True if validity date is expired OR within next 3 months
    return validityDate <= threeMonthsLater;
  }
  // import * as moment from 'moment';

  checkBackendValidityForEdit(): boolean {
    const date = this.responseData?.param30;

    if (!date) {
      return false;
    }

    // Parse date format: DD-MMM-YYYY (e.g. 15-Jun-2026)
    const validityDate = moment(date, "DD-MMM-YYYY", true);

    if (!validityDate.isValid()) {
      return false;
    }

    const today = moment().startOf("day");
    const sixMonthsLater = moment().add(6, "months").startOf("day");

    // TRUE if expired OR expiring within next 6 months
    return validityDate.isSameOrBefore(sixMonthsLater);
  }
  checkSimValidityForEdit(): boolean {
  const date = this.responseData?.param27; // SIM validity

  if (!date) {
    
    return false;
  }

  // Parse DD-MMM-YYYY format (e.g. 15-Jun-2027)
  const validityDate = moment(date, "DD-MMM-YYYY", true);

  if (!validityDate.isValid()) {
    return false;
  }

  const sixMonthsLater = moment().add(6, "months").startOf("day");
  console.log("Current date:", moment().format("DD-MMM-YYYY"));
  // TRUE only if validity is at least 6 months from today
  console.log("SIM validity date:", validityDate.format("DD-MMM-YYYY"));
  return validityDate.isSameOrAfter(sixMonthsLater);
}
  // checkBackendValidity(): boolean {

  //   const date = this.responseData?.param30;

  //   if (!date) {
  //     return false;
  //   }

  //   // Parse DD-MMM-YYYY
  //   const [day, monthStr, year] = date.split('-');

  //   const months: any = {
  //     Jan: 0,
  //     Feb: 1,
  //     Mar: 2,
  //     Apr: 3,
  //     May: 4,
  //     Jun: 5,
  //     Jul: 6,
  //     Aug: 7,
  //     Sep: 8,
  //     Oct: 9,
  //     Nov: 10,
  //     Dec: 11
  //   };

  //   const validityDate = new Date(
  //     Number(year),
  //     months[monthStr],
  //     Number(day)
  //   );

  //   const today = new Date();

  //   // Remove time
  //   validityDate.setHours(0, 0, 0, 0);
  //   today.setHours(0, 0, 0, 0);

  //   // Today + 6 months
  //   const sixMonthsLater = new Date(today);
  //   sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  //   /**
  //    * TRUE:
  //    * already expired
  //    * OR
  //    * expiring within next 6 months
  //    */

  //   if (validityDate <= sixMonthsLater) {
  //     return true;
  //   }

  //   return false;
  // }


  async updateBeforeVerifyOTP() {
    // if (!this.isDataSaved) {
    //   this.updateInforReq.vehicleid = this.responseData.param12 || "";
    //   this.updateInforReq.vehicleno = this.vahanResponse.param10 !='' ? this.vahanResponse.param10 : this.responseData.param13;
    //   this.updateInforReq.chassisno = this.vahanResponse.param1 !='' ? this.vahanResponse.param1 : this.responseData.param14;
    //   this.updateInforReq.engineno = this.vahanResponse.param16 !='' ? this.vahanResponse.param16 : this.responseData.param15;
    //   this.updateInforReq.mfgyear = this.vahanResponse.param12 !='' ? this.vahanResponse.param12 : this.responseData.param22;
    //   this.updateInforReq.customername = this.vahanResponse.param15 !='' ? this.vahanResponse.param15 : this.responseData.param23;
    //   this.updateInforReq.customermobileno = this.responseData.param24 !='' ? this.responseData.param24 : "";
    //   this.updateInforReq.vehiclemakeid = this.responseData.param52;
    //   this.updateInforReq.vehiclemodelid = this.responseData.param54;
    //   this.updateInforReq.vehicleclassid = this.responseData.param56;
    //   this.updateInforReq.vehicletype = (moment().year() - moment(this.vahanResponse.param12).year()) <= 8 ? 'NEW' : 'OLD';
    //   this.updateInforReq.rtoid = this.responseData.param62 || "";
    //   this.updateInforReq.iccidno = this.responseData.param6 || "";
    //   this.updateInforReq.m2mproviderid = this.m2mProviderList.find(
    //     (element) => this.responseData.param42.toUpperCase() == element.param3.toUpperCase())?.param1;
    //   this.updateInforReq.mobileno1 = this.responseData.param66 ? this.responseData.param66 : "";
    //   this.updateInforReq.networkid1 = this.networkList.find(
    //     (element) => this.responseData.param58 == element.param1)?.param1 || "";
    //   this.updateInforReq.mobileno2 = this.responseData.param67 ? this.responseData.param67 : "";
    //   this.updateInforReq.networkid2 = this.networkList.find(
    //     (element) => this.responseData.param60 == element.param1)?.param1 || "";
      
    // }
    this.vehicleService.updateRenewalInfo(this.updateInforReq).subscribe({
      next: (response: any) => {
        if (response.status) {
          if (response.statuscode == "200") {
            this.toastService.show(
              "Customer info updated successfully",
              "success",
            );
            this.getStatusDetails();
            // this.activateVehicle();
          } else {
            this.toastService.show(response.entity, "error");
          }
        } else {
          this.toastService.show("Failed to update customer info", "error");
        }
      },
      error: () => {
        this.toastService.show("Error updating customer info", "error");
      },
    });
  }
  async updateOnFetchData() {
      this.updateInforReq.vehicleid = this.responseData.param12 || "";
      this.updateInforReq.vehicleno = this.vahanResponse.param10 !='' ? this.vahanResponse.param10 : this.responseData.param13;
      this.updateInforReq.chassisno = this.vahanResponse.param1 !='' ? this.vahanResponse.param1 : this.responseData.param14;
      this.updateInforReq.engineno = this.vahanResponse.param16 !='' ? this.vahanResponse.param16 : this.responseData.param15;
      this.updateInforReq.mfgyear = this.vahanResponse.param12 !='' ? this.vahanResponse.param12 : this.responseData.param22;
      this.updateInforReq.customername = this.vahanResponse.param15 !='' ? this.vahanResponse.param15 : this.responseData.param23;
      this.updateInforReq.customermobileno = this.responseData.param24 !='' ? this.responseData.param24 : "";
      this.updateInforReq.vehiclemakeid = this.responseData.param52;
      this.updateInforReq.vehiclemodelid = this.responseData.param54;
      this.updateInforReq.vehicleclassid = this.responseData.param56;
      this.updateInforReq.iccidno = this.vahanResponse.param4;
      this.updateInforReq.vehicletype =  (moment().year() - moment(this.vahanResponse.param12).year()) <= 8 ? 'NEW' : 'OLD';
      this.updateInforReq.mobileno1 = this.responseData.param66 ? this.responseData.param66 : "";
      this.updateInforReq.networkid1 = this.networkList.find(
        (element) => this.responseData.param58 == element.param1)?.param1 || "";
      this.updateInforReq.mobileno2 = this.responseData.param67 ? this.responseData.param67 : "";
      this.updateInforReq.networkid2 = this.networkList.find(
        (element) => this.responseData.param60 == element.param1)?.param1 || "";
      
    
    this.vehicleService.updateRenewalInfo(this.updateInforReq).subscribe({
      next: (response: any) => {
        this.initFlag = false;
        this.getStatusDetails();
        // if (response.status) {
        //   if (response.statuscode == "200") {
        //     // this.toastService.show(
        //     //   "Customer info updated successfully",
        //     //   "success",
        //     // );
            
        //   } else {
        //     this.toastService.show(response.entity, "error");
        //   }
        // } else {
        //   this.toastService.show("Failed to update customer info", "error");
        // }
      },
      error: () => {
        this.toastService.show("Error updating customer info", "error");
      },
    });
  }
  getStatusDetails() {
    if (this.searchForm.valid) {
      this.isDataSaved = false;
      let paramValue = this.searchBy.trim();
      this.loaderService.show();
      this.getStatusService
        .getStatusDetails({
          param1: paramValue,
          param10: "forrenewal",
          pdfexcel: "",
        })
        .pipe()
        .subscribe({
          next: (response) => {
            this.loaderService.hide();
            if (response.statuscode == 200 && response.entity) {
              this.isDataLoaded = true;
              this.responseData = response.entity;
              this.responseData.param20 = this.responseData.param20.toLowerCase();
                this.statusDetailsFlag = true;
                this.checkDeviceValidity();
                this.vehicleActivationCheck();
                this.getLiveEmergencyData();
            } else {
              this.statusDetailsFlag = false;
              this.isDataLoaded = false;
              this.toastService.show(
                "No data found for the given search criteria.",
                "error",
              );
            }
          },
          error: (error) => {
            this.isDataLoaded = false;
          },
        });
    }
  }
}

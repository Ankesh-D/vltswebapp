import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChild,
  ChangeDetectionStrategy
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from '@angular/router';
import { FormsModule, NgForm } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { DeviceService } from "../../../core/services/device.service";
import { DashboardService } from "../../../core/services/dashboard.service";
import { EncryptionService } from "../../../core/services/encryption.service";
import { LoadingComponent } from "../../../shared/components/loading/loading.component";
import { ErrorMessageComponent } from "../../../shared/components/error-message/error-message.component";
import { NgSelectModule } from "@ng-select/ng-select";
import { ToastComponent } from "../../assets/inactive-assets/toast.component";
import {
  CommonFileUploadRequest,
  OperationService,
} from "../../../core/services/operation.service";
import moment from "moment";
import { ToastService } from "../../../core/services/toast.service";
declare var $: any;
@Component({
    selector: "app-send-command",
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule],
    templateUrl: "./send-command.component.html",
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: "./send-command.component.scss"
})
export class SendCommandComponent implements OnInit, AfterViewInit {
  selectedFile: File | null = null;
  selectedVendor: any = null;
  commandName: string = "";
  commandId: string = "";
  command: string = "";
  releaseDate: string = "";
  discription: string = "";
updateRemark: string = '';
  vendorList: any[] = [];
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  roleId: any = sessionStorage.getItem("roleid");
  selectedDate: string = "";

  noOfVariable: any[] = [1];
  paramDataTypeList: any[] = [{ param1: "Number" }, { param1: "Character" }];
  params: string[] = [];
  dateTypeArr: any[] = [];
  paramList: any[] = [
    { param1: "1" },
    { param1: "2" },
    { param1: "3" },
    { param1: "4" },
    { param1: "5" },
    { param1: "6" },
  ];
  selectedNumber: any = null;
  constructor(
    private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    private operationService: OperationService,
    private toastService: ToastService,
      private router: Router
  ) {
    this.toastService.pageName = "Send Command"; // Set page name for toast service
    this.roleId = sessionStorage.getItem("roleid");
  }
  commandData: any;
  isEditMode: boolean = false;
  ngOnInit() {
    this.commandData = history.state.commandData;

    console.log(this.commandData);

    if (this.commandData) {
      this.isEditMode = true;
      this.commandId = this.commandData.param2;

      this.commandName = this.commandData.param5;
      this.command = this.commandData.param6;
      this.discription = this.commandData.param10;

      // Number of Parameter
      const count = Number(this.commandData.param12 || 0);

      // ng-select selected value
      this.selectedNumber = this.paramList.find(
        (x) => x.param1 == String(count),
      );

      // Generate parameter rows
      this.noOfVariable = [];

      for (let i = 0; i < count; i++) {
        this.noOfVariable.push(i + 1);
      }
    }
    if (this.roleId == "10" || this.roleId == "17") {
      this.loadVendorList();
    } else {
      this.loadDeviceModelList("");
    }
    this.initializeDatePicker();
    if (this.commandData.param13) {

  const variables = JSON.parse(this.commandData.param13);

  this.params = [];
  this.dateTypeArr = [];

  variables.forEach((item: any, index: number) => {

    this.params[index] = item.name;

    this.dateTypeArr[index] =
      this.paramDataTypeList.find(
        x => x.param1 === item.datatype
      );

  });

}
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeDatePicker();
    }, 200);
  }
  initializeDatePicker() {
    this.selectedDate = moment().format("DD-MMM-YYYY");

    $(() => {
      const $dateInput = $('input[name="date"]');

      $dateInput.daterangepicker({
        singleDatePicker: true,
        showDropdowns: true,
        autoApply: true,
        timePicker: false,
        startDate: moment(),
        maxDate: moment(),
        minYear: moment().subtract(2, "year").year(),
        maxYear: moment().add(2, "years").add(6, "months").year(),
        opens: "center",
        drops: "down",
        locale: {
          format: "DD-MMM-YYYY",
        },
      });

      // On date selection
      $dateInput.on("apply.daterangepicker", (ev: any, picker: any) => {
        this.selectedDate = picker.startDate.format("DD-MMM-YYYY");
      });

      // On picker close
      $dateInput.on("hide.daterangepicker", (ev: any, picker: any) => {
        this.selectedDate = picker.startDate.format("DD-MMM-YYYY");
      });
    });
  }

  // initializeDatePicker() {
  //   setTimeout(() => {
  //     if (typeof $ !== 'undefined' && $.fn.datepicker) {
  //       $('#date').datepicker({
  //         format: 'dd-M-yyyy',
  //         endDate: '+0d',
  //         autoclose: true
  //       });
  //       const today = new Date();
  //       $('#date').datepicker('setDate', today);
  //       const formattedDate = this.formatDate(today);
  //       this.releaseDate = formattedDate;
  //     }
  //   }, 100);
  // }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  loadVendorList() {
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        this.vendorList = response.entity;

        if (this.commandData) {
          this.selectedVendor = this.vendorList.find(
            (x) => x.param1 == this.commandData.param3,
          );

          if (this.selectedVendor) {
            this.onVendorChange(this.selectedVendor);
          }
        }
      },
    });
  }
  deviceModelList: any[] = [];
  selectedModel: any = null;
  docUrl: any = "";
  //   onVendorChange(vendorId: any) {
  //   this.selectedVendor = vendorId;

  //   if (vendorId) {
  //     const encryptedVendorId =
  //       this.encryptionService.encryptAccountId(vendorId);

  //     this.loadDeviceModelList(encryptedVendorId);
  //   }
  // }
  onVendorChange(event: any) {
    this.selectedVendor = event;
    if (event) {
      const encryptedVendorId = this.encryptionService.encryptAccountId(
        event.param1,
      );
      this.loadDeviceModelList(encryptedVendorId);
    } else {
      this.deviceModelList = [];
      this.selectedModel = "";
      this.docUrl = "";
    }
  }

  // loadDeviceModelList(vendorId: string) {
  //   this.operationService.getDeviceModelListWithProtocol(vendorId).subscribe({
  //     next: (response) => {
  //       if (response.status && response.entity) {
  //         this.deviceModelList = response.entity;
  //         if (this.deviceModelList.length === 1) {
  //           this.selectedModel = this.deviceModelList[0].param1;

  //         }
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error loading device model list:', error);
  //     }
  //   });
  // }
 updateCommand() {
if (!this.updateRemark?.trim()) {
  this.toastService.show('Please enter remark', 'error');
  return;
}
  if (!this.commandName) {
    this.toastService.show('Please enter command name', 'error');
    return;
  }

  if (!this.command) {
    this.toastService.show('Please enter command', 'error');
    return;
  }

  const variables: any[] = [];

  for (let i = 0; i < this.noOfVariable.length; i++) {

    variables.push({
      name: this.params[i] || '',
      value: '',
      datatype: this.dateTypeArr[i]?.param1 || ''
    });

  }
const payload = {
  vendorid: this.selectedVendor?.param1 || this.commandData.param3,
  modelid: this.selectedModel || this.commandData.param4,
  commandname: this.commandName,
  command: this.command,
  descrption: this.discription,
  noofvariables: String(this.noOfVariable.length),
  commandid: this.commandId,
  remark: this.updateRemark,
  variables: variables
};
  // const payload = {
  //   vendorid: this.selectedVendor?.param1 || this.commandData.param3,
  //   modelid: this.selectedModel || this.commandData.param4,
  //   commandname: this.commandName,
  //   command: this.command,
  //   descrption: this.discription,
  //   noofvariables: String(this.noOfVariable.length),
  //   commandid: this.commandId,
  //   remark: 'Updated from UI',
  //   variables: variables
  // };

  console.log('Update Payload:', payload);

  this.loading = true;

  this.deviceService.updateCommand(payload).subscribe({

    next: (response: any) => {

      this.loading = false;

      if (response.statuscode === 200) {

        this.toastService.show(
          response.entity || 'Successfully updated.',
          'success'
        );

      } else {

        this.toastService.show(
          response.entity || 'Update failed',
          'error'
        );
      }
    },

    error: (error: any) => {

      this.loading = false;

      console.error(error);

      this.toastService.show(
        'Failed to update command',
        'error'
      );
    }

  });
}
  loadDeviceModelList(vendorId: string) {
    this.operationService.getDeviceModelListWithProtocol(vendorId).subscribe({
      next: (response) => {
        this.deviceModelList = response.entity;

        if (this.commandData) {
          this.selectedModel = this.commandData.param4; // model id
        }
      },
    });
  }
  onDeviceModelChange(event: any) {
    this.selectedModel = event.param1;
  }

  // selectedFileName: any = '';
  // onFileSelected(event: any) {
  //   const file = event.target.files[0];
  //   if (file) {
  //     this.selectedFile = file;
  //     this.selectedFileName = file.name;
  //     // this.tacFileExtension = file.name.split('.').pop() || '';
  //     // this.tacFileName = file.name.replace(/\.[^/.]+$/, '');

  //     // Convert file to base64
  //     const reader = new FileReader();
  //     // reader.onload = (e) => {
  //     //   const dataUrl = reader.result as string;
  //     //   // Split on comma to get base64 part only
  //     //   this.tacFileInByte = dataUrl.split(',')[1];
  //     // };
  //     // reader.readAsDataURL(file);
  //     // this.tacSelected = false;
  //   } else {
  //     this.selectedFileName = '';
  //   }
  // }
  firmFile: any = "";
  fileName: any = "";
  firmwareUrl: any = "";
  firmwareErr: string = "";
  excelFile: any;
  uploadedFlag: boolean = false;
  async SelectedExcelFunction(event: any): Promise<void> {
    try {
      const files = event.target.files;

      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];
      this.firmFile = file;
      this.fileName = file.name;
      this.firmwareErr = "";

      // Validate file extension
      if (!file.name.toLowerCase().endsWith(".bin")) {
        this.firmwareErr = "Only .bin file is allowed.";
        this.fileName = "";
        return;
      }

      // Validate file size (5KB to 1MB)
      if (file.size < 5120 || file.size > 1024000) {
        this.firmwareErr = "Size should be between 5KB and 1MB.";
        this.fileName = "";
        return;
      }

      // Convert to Base64
      const base64 = await this.readFileAsBase64(file);

      this.firmwareUrl = base64;

      console.log(base64);
      const headerkey: any = sessionStorage.getItem("principalKey");
      // Optional FormData
      const formData = new FormData();

      formData.append("filetype", "firmware");
      formData.append("fileextension", file.type);
      formData.append("file", file);
      formData.append("filepath", "");
      formData.append("headerkey", headerkey);
      this.operationService.commonFileUpload(formData).subscribe({
        next: (response: any) => {
          if (response.statuscode == 200) {
            this.uploadedFlag = true;
            this.toastService.show("File Uploaded Successfully", "success");
            this.fileId = response.fileid;
            console.log(this.fileId);
          } else {
            this.uploadedFlag = false;
            this.toastService.show(response.entity, "error");
          }
        },
        error: (error: any) => {
          this.uploadedFlag = false;
          this.toastService.show(error, "error");
        },
      });
      /*
    this.apiService.post(formData, 'commanfileupload').subscribe(response => {
      if (response.statuscode === '200') {
        this.Firmware.firmwarefile = response.entity.param2;
      }
    });
    */
    } catch (error) {
      console.error(error);
      this.firmwareErr = "Error processing file.";
    }

    setTimeout(() => {
      this.firmwareErr = "";
    }, 3000);
  }
  commonFileUploadReq: CommonFileUploadRequest = new CommonFileUploadRequest();
  fileId: string = "";
  commmonFileUpload(file: any) {
    this.commonFileUploadReq.file = file;
    this.operationService.commonFileUpload(this.commonFileUploadReq).subscribe({
      next: (response: any) => {
        if (response.statuscode == 200) {
          this.toastService.show(response.entity, "success");
        } else {
          this.toastService.show(response.entity, "error");
        }
      },
      error: (error) => {
        this.toastService.show(error, "success");
      },
    });
  }
  readFileAsBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
  @ViewChild("sendCommandForm") sendCommandForm!: NgForm;

  firmwareUpload() {
    // Logic from AngularJS: Check Role for Vendor
    let vendorId = "0";
    if (this.roleId === "10" || this.roleId === "17") {
      if (!this.selectedVendor) {
        this.errorMessage = "Please select a vendor.";
        this.toastService.show("Please select a vendor.", "error");
        return;
      }
      vendorId = this.selectedVendor ? this.selectedVendor.param1 : "";
    }
    let deviceModelId = "0";
    if (!this.selectedModel) {
      this.errorMessage = "Please select a devce model.";
      this.toastService.show("Please select a devce model.", "error");
      return;
    }
    deviceModelId = this.selectedModel;

    if (!this.commandName || this.commandName.trim() === "") {
      this.errorMessage = "Please enter Firmware Name.";
      this.toastService.show("Please enter Firmware Name.", "error");
      return;
    }
    if (!this.command || this.command.trim() === "") {
      this.errorMessage = "Please enter Firmware Version.";
      this.toastService.show("Please enter Firmware Version.", "error");
      return;
    }
    if (!this.fileId) {
      this.errorMessage = "Please select a firmware file to upload";
      this.toastService.show(
        "Please select a firmware file to upload.",
        "error",
      );
      return;
    }

    this.loading = true;
    this.errorMessage = "";
    this.successMessage = "";

    let apiRequest = {
      param1: "0", //devicemodelid
      param2: this.commandName.trim(), //commandName
      param3: this.command.trim(), //command
      param4: this.fileId, //filepath
      param5: this.selectedDate, //releasedate
      param6: vendorId ? vendorId : "", //vendorid
      param7: "", //creator loginid
      param8: deviceModelId ? deviceModelId : "",
    };

    this.deviceService.uploadFirmware(apiRequest).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode == 200) {
          this.successMessage = response.entity;
          this.toastService.show(response.entity, "success");
          this.resetForm();
        } else {
          this.errorMessage = response.entity;
          this.toastService.show(response.entity, "error");
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity;
        this.cdr.detectChanges();
      },
    });
  }

  resetForm() {
    this.selectedFile = null;
    this.selectedVendor = null;
    this.selectedModel = null;
    this.fileId = "";
    // this.selectedFileName = ''
    this.selectedVendor = "";
    this.commandName = "";
    this.command = "";
    this.releaseDate = "";
    this.errorMessage = "";
    this.successMessage = "";
    this.noOfVariable = [];

    this.initializeDatePicker();
    this.sendCommandForm.resetForm();
  }

  onNoOfParamChange(event: any) {
    this.noOfVariable = [];
    let arrlen: any = Number(event.param1);
    for (let i = 0; i < arrlen; i++) {
      this.noOfVariable.push(i + 1);
    }
    // this.params = Array(event).fill('');
    // this.dateTypeArr = Array(event).fill(null);
  }

  createCommand() {
    this.command = "$set";
    for (let i = 0; i < this.noOfVariable.length; i++) {
      this.command = this.command + "<" + this.params[i] + ">";
    }
  }
  saveCommand() {
    if (!this.commandName) {
      this.toastService.show("Please enter command name", "error");
      return;
    }

    if (!this.command) {
      this.toastService.show("Please enter command", "error");
      return;
    }

    const variables = [];

    for (let i = 0; i < this.noOfVariable.length; i++) {
      variables.push({
        name: this.params[i] || "",
        value: "",
        datatype: this.dateTypeArr[i]?.param1 || "",
      });
    }

    const payload = {
      vendorid: this.selectedVendor.param1,
      modelid: this.selectedModel || "",
      commandname: this.commandName,
      command: this.command,
      descrption: this.discription,
      noofvariables: String(this.noOfVariable.length),
      variables: variables,
    };

    console.log(payload);

    this.loading = true;

    this.deviceService.saveCommand(payload).subscribe({
      next: (response: any) => {
        this.loading = false;

        if (response.statuscode === 200) {
          this.toastService.show(response.entity, "success");
          this.resetForm();
           setTimeout(() => {
    this.router.navigate(['/command']);
  }, 1000);
        } else {
          this.toastService.show(response.entity, "error");
        }

      },
      error: (error: any) => {
        this.loading = false;
        this.toastService.show("Failed to save command", "error");
        console.error(error);
      },
    });
  }
}

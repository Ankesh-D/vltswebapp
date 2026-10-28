import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonFileUploadRequest, OperationService } from '../../../core/services/operation.service';
import moment from 'moment';
import { ToastService } from '../../../core/services/toast.service';

declare var $: any;

@Component({
    selector: 'app-firmware-upload',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule],
    templateUrl: './firmware-upload.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./firmware-upload.component.scss']
})
export class FirmwareUploadComponent implements OnInit, AfterViewInit {
  selectedFile: File | null = null;
  selectedVendor: any = null;
  firmwareName: string = '';
  firmwareVersion: string = '';
  releaseDate: string = '';

  vendorList: any[] = [];
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  roleId: any = sessionStorage.getItem('roleid');
  selectedDate: string  = "";
  constructor(
    private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    private operationService: OperationService,
    private toastService: ToastService
  ) { 
    this.roleId = sessionStorage.getItem('roleid');
  }

  ngOnInit() {
    if(this.roleId=='10' || this.roleId=='17') {
      this.loadVendorList();
    } else {
      this.loadDeviceModelList('')
    }
    this.initializeDatePicker();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeDatePicker();
    }, 200);
  }
  initializeDatePicker() {
  this.selectedDate = moment().format('DD-MMM-YYYY');

  $(() => {
    const $dateInput = $('input[name="date"]');

    $dateInput.daterangepicker({
      singleDatePicker: true,
      showDropdowns: true,
      autoApply: true,
      timePicker: false,
      startDate: moment(),
      maxDate: moment(),
      minYear: moment().subtract(2, 'year').year(),
      maxYear: moment().add(2, 'years').add(6, 'months').year(),
      opens: 'center',
      drops: 'down',
      locale: {
        format: 'DD-MMM-YYYY'
      }
    });

    // On date selection
    $dateInput.on('apply.daterangepicker', (ev: any, picker: any) => {
      this.selectedDate = picker.startDate.format('DD-MMM-YYYY');
      
    });

    // On picker close
    $dateInput.on('hide.daterangepicker', (ev: any, picker: any) => {
      this.selectedDate = picker.startDate.format('DD-MMM-YYYY');
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
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  loadVendorList() {
    this.loading = true;
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.vendorList = response.entity;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Failed to load vendor list.';
        this.cdr.detectChanges();
      }
    });
  }

  deviceModelList: any[]=[];
  selectedModel: any = null;
  docUrl: any = ""
  onVendorChange(event: any) {
    this.selectedVendor = event
    if (event) {
      const encryptedVendorId = this.encryptionService.encryptAccountId(event.param1);
      this.loadDeviceModelList(encryptedVendorId);
    } else {
      this.deviceModelList = [];
      this.selectedModel = '';
      this.docUrl = '';
    }
  }
  
  loadDeviceModelList(vendorId: string) {
    this.operationService.getDeviceModelListWithProtocol(vendorId).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.deviceModelList = response.entity;
          if (this.deviceModelList.length === 1) {
            this.selectedModel = this.deviceModelList[0].param1;
            
          }
        }
      },
      error: (error) => {
        console.error('Error loading device model list:', error);
      }
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
    this.firmwareErr = '';

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.bin')) {
      this.firmwareErr = 'Only .bin file is allowed.';
      this.fileName = '';
      return;
    }

    // Validate file size (5KB to 1MB)
    if (file.size < 5120 || file.size > 1024000) {
      this.firmwareErr = 'Size should be between 5KB and 1MB.';
      this.fileName = '';
      return;
    }

    // Convert to Base64
    const base64 = await this.readFileAsBase64(file);

    this.firmwareUrl = base64;

    const headerkey: any = sessionStorage.getItem('principalKey');
    // Optional FormData
    const formData = new FormData();

    formData.append('filetype', 'firmware');
    formData.append('fileextension', file.type);
    formData.append('file', file);
    formData.append('filepath', '');
    formData.append('headerkey', headerkey);
    this.operationService.commonFileUpload(formData).subscribe({
      next: (response: any) => {
        if(response.statuscode==200) {
          this.uploadedFlag = true;
          this.toastService.show("File Uploaded Successfully", 'success');
          this.fileId = response.fileid;
        } else {
          this.uploadedFlag = false;
          this.toastService.show(response.entity, 'error');
        }
      },
      error: (error: any) => {  
        this.uploadedFlag = false;
        this.toastService.show(error, 'error');
      }
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
    this.firmwareErr = 'Error processing file.';
  }

  setTimeout(() => {
    this.firmwareErr = '';
  }, 3000);
}
commonFileUploadReq: CommonFileUploadRequest = new CommonFileUploadRequest();
fileId: string = "";
commmonFileUpload(file: any) {
  this.commonFileUploadReq.file = file 
  this.operationService.commonFileUpload(this.commonFileUploadReq).subscribe({
    next: (response: any) => {
      if(response.statuscode==200) {
        this.toastService.show(response.entity, 'success');
      } else {
        this.toastService.show(response.entity, 'error');
      }
    },
    error: (error) => {
      this.toastService.show(error, 'success');
    }
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
   @ViewChild('firmwareForm') firmwareForm!: NgForm;
    
  firmwareUpload() {
    // Logic from AngularJS: Check Role for Vendor
    let vendorId = '0';
    if (this.roleId === '10' || this.roleId === '17') {
      if (!this.selectedVendor) {
        this.errorMessage = 'Please select a vendor.';
        this.toastService.show('Please select a vendor.','error');
        return;
      }
      vendorId =  this.selectedVendor ? this.selectedVendor.param1 : '';
    }
    let deviceModelId = '0';
    if (!this.selectedModel) {
      this.errorMessage = 'Please select a devce model.';
      this.toastService.show('Please select a devce model.','error');
      return;
    }
    deviceModelId = this.selectedModel;
    
    if (!this.firmwareName || this.firmwareName.trim() === '') {
      this.errorMessage = 'Please enter Firmware Name.';
      this.toastService.show('Please enter Firmware Name.','error');
      return;
    }
    if (!this.firmwareVersion || this.firmwareVersion.trim() === '') {
      this.errorMessage = 'Please enter Firmware Version.';
      this.toastService.show('Please enter Firmware Version.','error');
      return;
    }
    if (!this.fileId) {
      this.errorMessage = 'Please select a firmware file to upload';
      this.toastService.show('Please select a firmware file to upload.','error');
      return;
    }
    

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    let apiRequest = {
      "param1": "0",	//devicemodelid
      "param2": this.firmwareName.trim(), //firmwarename
      "param3": this.firmwareVersion.trim(),	//firmwareversion
      "param4": this.fileId,	//filepath
      "param5": this.selectedDate,	//releasedate
      "param6": vendorId ? vendorId : '',	//vendorid
      "param7": "",	//creator loginid
      "param8": deviceModelId ? deviceModelId : ''
    };

    
    this.deviceService.uploadFirmware(apiRequest).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.statuscode==200) {
          this.successMessage = response.entity;
          this.toastService.show(response.entity, 'success');
          this.resetForm();
        } else {
          this.errorMessage = response.entity;
          this.toastService.show(response.entity, 'error');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.entity;
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() {
    this.selectedFile = null;
    this.selectedVendor = null;
    this.selectedModel = null;
    this.fileId ="";
    // this.selectedFileName = ''
    this.selectedVendor = '';
    this.firmwareName = '';
    this.firmwareVersion = '';
    this.releaseDate = '';
    this.errorMessage = '';
    this.successMessage = '';

    this.initializeDatePicker();
    this.firmwareForm.resetForm();
  }
}

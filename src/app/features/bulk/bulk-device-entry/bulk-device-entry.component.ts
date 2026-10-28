import { Component, OnInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

import { DeviceService } from '../../../core/services/device.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastService } from '../../../core/services/toast.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ListService } from '../../../core/services/list.service';
import { DistributorListReq } from '../../../core/model/request.model';
@Component({
    selector: 'app-bulk-device-entry',
    imports: [FormsModule, RouterModule, NgSelectModule],
    templateUrl: './bulk-device-entry.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./bulk-device-entry.component.scss']
})
export class BulkDeviceEntryComponent implements OnInit {

  // ================= VARIABLES =================
  
  @ViewChild('bulkDeviceEntryForm') bulkDeviceEntryForm: any;
  msg: string = 'Only .xls or .xlsx files are allowed.';
  errorMessage: string = '';
  successMessage: string = '';

  selectedFile: File | null = null;
  selectedFileName: string = 'Choose file...';

  selectedVendor: any = null;
  selectedModel: any = null;
  selectedM2M: any = null;

  vendorList: any[] = [];
  deviceModelList: any[] = [];
  m2mProviders: any[] = [];
showExcelModal: boolean = false;

  loading: boolean = false;
  roleId: string = '';
  validationList: any[] = [];
  showValidationModal: boolean = false;
  distributorList: any[]=[];
  dealerList: any[]=[];
  selectedDistributor: any = null;
  selectedDealer: any = null;
  constructor(
    private encryptionService: EncryptionService,
    private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private ls: ListService
  ) {
    this.roleId = sessionStorage.getItem('roleid') || '';
    sessionStorage.setItem('pagename', 'Bulk Device Entry');
  }

  // ================= INIT =================

  ngOnInit(): void {
    this.loadVendorList();
    this.loadM2MProviders();
    if(this.roleId=='12' || this.roleId=='13') {
      this.loadDeviceModelList('')
    }
  }

  // ================= VENDOR =================

  loadVendorList(): void {
    this.dashboardService.getVendorList().subscribe({
      next: (res: any) => {
        if (res.status && res.entity) {
          this.vendorList = res.entity;

          if (this.roleId === '11' || this.roleId === '61' && this.vendorList.length > 0) {
            this.selectedVendor = this.vendorList[0].param1;
            this.loadDeviceModelList(this.selectedVendor);
          }
        }
      },
      error: () => {
        this.toast.show('Failed to load vendor list', 'error');
      }
    });
  }

  onVendorChange(): void {
    if (this.selectedVendor) {
      this.selectedDistributor = null;
      this.loadDeviceModelList(this.selectedVendor.param1);
      this.loadDistributorList();
    } else {
      this.deviceModelList = [];
      this.selectedModel = null;
    }
  }
  onDistributorChange() {
    this.selectedDealer = null;
    this.loadDealerList();
  }

  // ================= MODEL =================

  loadDeviceModelList(vendorId: string): void {
    this.deviceService.getDeviceModelRoster(vendorId).subscribe({
      next: (res: any) => {
        if (res.status && res.entity) {
          this.deviceModelList = res.entity;
        }
      },
      error: () => {
        this.toast.show('Failed to load device models', 'error');
      }
    });
  }

  // ================= M2M =================

  loadM2MProviders(): void {
    this.dashboardService.getM2MProviderList().subscribe({
      next: (res: any) => {
        if (res.status || res.statuscode === 200) {
          this.m2mProviders = res.entity || [];
        } else {
          this.toast.show('Failed to load M2M Providers', 'error');
        }
      },
      error: () => {
        this.toast.show('Error loading M2M Providers', 'error');
      }
    });
  }
  loadDistributorList() {
      let request: DistributorListReq = new DistributorListReq();
      request.vendorid = this.selectedVendor ? this.selectedVendor.param1 : "";
      this.ls.getDistributorList(request).subscribe({
        next: (response) => {
          if (response.status && response.entity) {
            this.distributorList = response.entity;
          }
        },
        error: (error) => {
          // this.toastService.show('Error loading vendor list', 'error');
        }
      });
    }
  
    loadDealerList() {
      let vendorId = this.selectedVendor ? this.selectedVendor : "";
      let distributorId = this.selectedDistributor ? this.selectedDistributor.param1 : "";
      this.ls.getVendorDealerRoster(vendorId, distributorId).subscribe({
        next: (response) => {
          if (response.status && response.entity) {
            this.dealerList = response.entity;
          }
        },
        error: (error) => {
          // this.toastService.show('Error loading vendor list', 'error');
        }
      });
    }

  // ================= FILE =================

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] || null;
    this.selectedFileName = this.selectedFile
      ? this.selectedFile.name
      : 'Choose file...';
  }

  // ================= UPLOAD =================

  uploadFile(): void {

    if (!this.selectedFile) {
      this.toast.show('Please select file', 'error');
      return;
    }

    if (!this.selectedVendor && (this.roleId =='10' || this.roleId =='64')) {
      this.toast.show('Please select vendor', 'error');
      return;
    }

    if (!this.selectedModel) {
      this.toast.show('Please select model', 'error');
      return;
    }

    if (!this.selectedM2M) {
      this.toast.show('Please select Esim Provider', 'error');
      return;
    }

    this.loading = true;

    const formData = new FormData();
    const applicationId = Date.now().toString();
    const headerKey = sessionStorage.getItem('principalKey') || '';

    // FILE
    formData.append('file', this.selectedFile);

    // MODEL (param mapping)
    formData.append('modelid', this.selectedModel.param1);
    formData.append('modelcode', this.selectedModel.param3);

    // MAKE (fixed values)
    formData.append('makeid', this.selectedVendor ? this.selectedVendor.param1 : "");
    formData.append('makename', this.selectedVendor ? this.selectedVendor.param2 : "");

    formData.append('distributorid', this.selectedDistributor ? this.selectedDistributor.param1 : "");
    formData.append('dealerid', this.selectedDealer ? this.selectedDealer.param1 : "");

    // M2M
    formData.append('m2mid', this.selectedM2M.param1);
    formData.append('m2mcode', this.selectedM2M.param3);

    // OTHER REQUIRED FIELDS
    
    formData.append('headerkey', headerKey);
    formData.append('deviceType', 'AIS-140');
      formData.append('applicationId', this.encryptionService.encryptAccountId('1'));

    this.deviceService.bulkDeviceEntry(formData).subscribe({
    next: (res: any) => {
  this.loading = false;

  if (res.status) {
    if (res.entity && res.entity.length > 0 && res.entity[0].validationMessage) {
      this.validationList = res.entity;
      this.showValidationModal = true;
      return;
    }
    this.successMessage = res.entity || 'Bulk upload successful';
    this.toast.show(this.successMessage, 'success');
    this.resetForm();
  } else {
    this.errorMessage = res.entity || 'Bulk upload failed';
    this.toast.show(this.errorMessage, 'error');
  }
},
      error: () => {
        this.loading = false;
        this.toast.show('API error during bulk upload', 'error');
      }
    });
  }

  // ================= RESET =================

  resetForm(): void {

    this.selectedFile = null;
    this.selectedFileName = 'Choose file...';

    this.selectedModel = null;
    this.selectedM2M = null;

    if (this.roleId !== '11') {
      this.selectedVendor = null;
      this.deviceModelList = [];
    }

    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();
  }

  // ================= VIEW EXCEL FORMAT =================
openExcelModal(): void {
  this.showExcelModal = true;
}
closeValidationModal(): void {
  this.showValidationModal = false;
  
  this.bulkDeviceEntryForm.resetForm();
}
closeExcelModal(): void {
  this.showExcelModal = false;
}

  viewExcelFormat(): void {
    window.open(
      'assets/images/excelformat-bulkdeviceview.png',
      '_blank'
    );
  }
}

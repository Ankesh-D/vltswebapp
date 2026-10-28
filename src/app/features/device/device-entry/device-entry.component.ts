import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ModelService } from '../../../core/services/model.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastService } from '../../../core/services/toast.service';
import { ListService } from '../../../core/services/list.service';
import { DistributorListReq } from '../../../core/model/request.model';

declare var $: any;
declare var alert: any;

@Component({
    selector: 'app-device-entry',
    imports: [FormsModule, RouterModule, NgSelectModule],
    templateUrl: './device-entry.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./device-entry.component.scss']
})
export class DeviceEntryComponent implements OnInit, AfterViewInit {
  // Form fields
  selectedVendor: any = null;
  selectedDistributor: any = null;
  selectedDealer: any = null;
  selectedModel: any = null;
  serialNo: string = '';
  imeiNo: string = '';
  iccidNo: string = '';
  m2mProvider: any = null;
  network1: string = '';
  network2: string = '';
  mobileNo1: string = '';
  mobileNo2: string = '';
  sim1Validity: string = '';
  sim2Validity: string = '';
  imsiPrimaryNo: string = '';
  imsiSecondaryNo: string = '';
  
  // Validation
  validate: string = 'false';
  msg: string = '';
  uniqueNo: string = '';
  certifiedDate: string = '';
  uniqueNoDate: string = '';
  
  // Dropdowns
  vendorList: any[] = [];
  dealerList: any[] = [];
  distributorList: any[] = [];
  deviceModelList: any[] = [];
  m2mProviderList: any[] = [];
  networkList: any[] = [];
  
  
  // Company label
  companyLabel: string = '';
  roleId: string = '';
  
  loading: boolean = false;

  constructor(
    private deviceService: DeviceService,
    private dashboardService: DashboardService,
    private modelService: ModelService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private ls: ListService
  ) {
    this.toastService.pageName = 'Device Master Entry'; // Set page name for toast service
  }

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleid') || '';
    this.initializeDatePickers();
    this.loadVendorList();
    this.loadM2MProviderList();
    this.loadNetworkList();
    this.loadDeviceModelList('');
    if (this.roleId === '11') {
      // For vendor role, load models directly
      this.loadDeviceModelList('');
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.searchable').select2();
        $('#vendor_obj_id').on('change', (e: any) => {
          this.selectedVendor = e.target.value;
          this.onVendorChange();
        });
        $('#modelid').on('change', (e: any) => {
          this.selectedModel = e.target.value;
        });
        $('#m2m_provider').on('change', (e: any) => {
          this.m2mProvider = e.target.value.split(',')[0];
        });
      }
    }, 200);
  }

  initializeDatePickers() {
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.datepicker) {
        $('.datepick').datepicker({
          format: 'dd-M-yyyy',
          startDate: '+0d',
          autoclose: true
        });
        $('.datepick').datepicker('setDate', '+0d');
        
        $('#sim_1_validity').on('changeDate', (e: any) => {
          this.sim1Validity = this.formatDate(e.date);
          this.cdr.detectChanges();
        });
        
        $('#sim_2_validity').on('changeDate', (e: any) => {
          this.sim2Validity = this.formatDate(e.date);
          this.cdr.detectChanges();
        });
        
        const today = new Date();
        this.sim1Validity = this.formatDate(today);
        this.sim2Validity = this.formatDate(today);
      }
    }, 100);
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  loadVendorList() {
    this.dashboardService.getVendorList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.vendorList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading vendor list:', error);
        this.toastService.show('Error loading vendor list', 'error');
      }
    });
  }
  loadDistributorList() {
    let request: DistributorListReq = new DistributorListReq();
    request.vendorid = this.selectedVendor ? this.selectedVendor : "";
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

  onVendorChange() {
    this.selectedModel = '';
    this.deviceModelList = [];
    this.selectedDistributor = null;
    if (this.selectedVendor) {
      const encryptedVendorId = this.encryptionService.encryptAccountId(this.selectedVendor);
      this.loadDeviceModelList(encryptedVendorId);;
      this.loadDistributorList();
    } else {
      this.loadDeviceModelList('');
    }
    this.cdr.detectChanges();
  }
  onDistributorChange() {
    this.selectedDealer = null;
    this.loadDealerList();
  }

  loadDeviceModelList(companyId: string='') {
    this.loading = true;
    this.deviceService.getDeviceModelRoster(companyId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceModelList = response.entity;
          if (this.deviceModelList.length > 0) {
            this.companyLabel = this.deviceModelList[0].param5 || '';
            if (this.deviceModelList.length === 1) {
              this.selectedModel = this.deviceModelList[0].param1;
            }
          }
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading device model list:', error);
        this.toastService.show('Error loading device model list', 'error');
      }
    });
  }

  loadM2MProviderList() {
    this.dashboardService.getM2MProviderList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.m2mProviderList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading M2M provider list:', error);
        this.toastService.show('Error loading M2M provider list', 'error');
      }
    });
  }

  loadNetworkList() {
    this.dashboardService.getNetworkList().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.networkList = response.entity;
        }
      },
      error: (error) => {
        console.error('Error loading network list:', error);
      }
    });
  }

  correctUniqueno() {
    this.uniqueNo = this.serialNo;
    if (this.uniqueNo.length >= 7) {
      const mm = this.uniqueNo[7];
      const yy = this.uniqueNo[8];
      const year = this.uniqueNo[9] + this.uniqueNo[10];
      
      try {
        if (mm === '0') {
          if (parseInt(yy) >= 1 && parseInt(yy) <= 9) {
            this.validate = 'true';
            this.msg = '';
          } else {
            this.validate = 'false';
            this.msg = 'Enter certified month and year';
          }
        } else if (mm === '1') {
          if (parseInt(yy) <= 2) {
            this.validate = 'true';
            this.msg = '';
          } else {
            this.validate = 'false';
            this.msg = 'Enter certified month and year';
          }
        } else {
          this.validate = 'false';
          this.msg = 'Enter certified month and year';
        }
        
        const yearNum = parseInt(year);
        if (yearNum >= 16 && yearNum <= 22) {
          this.validate = 'true';
          this.msg = '';
        } else {
          this.validate = 'false';
          this.msg = 'Enter certified month and year';
        }
      } catch (e) {
        this.validate = 'false';
        this.msg = 'Enter certified month and year';
      }
    }
  }

  correctImeino() {
    if (this.imeiNo.length === 15) {
      // Valid
    } else {
      // Invalid
    }
  }

  correctIccidno() {
    if (this.iccidNo.length >= 18 && this.iccidNo.length <= 20) {
      // Valid
    } else {
      // Invalid
    }
  }

 deviceEntry() {

  // ✅ Vendor
  if (!this.selectedVendor && this.roleId == '10') {
    this.toastService.show('Select Vendor', 'error');
    return;
  }

  // ✅ Model Code
  if (!this.selectedModel) {
    this.toastService.show('Select Model Code', 'error');
    return;
  }

  // ✅ Serial No
  if (!this.serialNo) {
    this.toastService.show('Enter Serial No', 'error');
    return;
  }

  // ✅ IMEI No
  if (!this.imeiNo) {
    this.toastService.show('Enter IMEI No', 'error');
    return;
  }

  // ✅ ICCID No
  if (!this.iccidNo) {
    this.toastService.show('Enter ICCID No', 'error');
    return;
  }

  // ✅ M2M Provider
  if (!this.m2mProvider) {
    this.toastService.show('Select M2M Provider', 'error');
    return;
  }

  const model = this.deviceModelList.find(
    m => m.param1 === this.selectedModel
  );

  this.loading = true;
  const request = {
    param2: model?.param4 || '',
    param3: this.selectedModel,
    param4: this.imeiNo,
    param5: this.serialNo,
    param6: this.iccidNo,
    param7: '0',
    param8: '0',
    param9: '0',
    param10: '0',
    param11: '0',
    param12: this.m2mProvider,
    param13: 'Application',
    param14: '1',
    param15: '0',
    param16: '0',
    param17: '0',
    param18: '0',
    param19: '0',
    param20: '0',
    param21: this.selectedDistributor ? this.selectedDistributor.param1 : "",//distributorid
    param22: this.selectedDealer ? this.selectedDealer.param1 : "", //dealerid
  };
  //  REQUEST BODY FOR CONFORMATION PERPOSE DONOT UNCOMMIT IT USE THIS FOR FUTURE PERPOSE
// "param2": "devicemakeid",
//     "param3": "devicemodelid",
//     "param4": "deviceimeino",
//     "param5": "deviceuniqueno",
//     "param6": "deviceiccidno",
//     "param8": "mobilenumber1",
//     "param9": "mobilenumber2",
//     "param10": "networkid1",
//     "param11": "networkid2",
//     "param12": "m2mproviderid",
//     "param13": "uploadedby",
//     "param14": "devicetype",
//     "param15": "filename",
//     "param16": "filepath",
//     "param19": "imsino1",
//     "param20": "imsino2",
// api name:psv_put_device
  //console.log('CREATE DEVICE REQUEST:', request);

  this.deviceService.createDevice(request).subscribe({
    next: (response) => {
      this.loading = false;

      if (response?.entity) {
        this.toastService.show(response.entity, 'success');
        if (response.entity.includes('Successfully')) {
          this.resetForm();
        }
      }
    },
    error: (error) => {
      this.loading = false;
      console.error('Error creating device:', error);
      this.toastService.show('Error creating device', 'error');
    }
  });
}


  resetForm() {
    this.selectedVendor = '';
    this.selectedModel = '';
    this.serialNo = '';
    this.imeiNo = '';
    this.iccidNo = '';
    this.m2mProvider = '';
    this.network1 = '';
    this.network2 = '';
    this.mobileNo1 = '';
    this.mobileNo2 = '';
    this.imsiPrimaryNo = '';
    this.imsiSecondaryNo = '';
    this.validate = 'false';
    this.msg = '';
    
    const today = new Date();
    this.sim1Validity = this.formatDate(today);
    this.sim2Validity = this.formatDate(today);
    
    if (typeof $ !== 'undefined' && $.fn.select2) {
      // $('#vendor_obj_id').val('').trigger('change');
      $('#modelid').val('').trigger('change');
      $('#m2m_provider').val('').trigger('change');
      $('#network_1').val('').trigger('change');
      $('#network_2').val('').trigger('change');
    }
    
    this.cdr.detectChanges();
  }
}

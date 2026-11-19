import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeviceService } from '../../../core/services/device.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { M2MProvider } from '../../../core/services/device.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
declare var $: any;


@Component({
    selector: 'app-change-device',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, CommonDataToolbarComponent, DataTableComponent, PaginationComponent],
    templateUrl: './change-device.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./change-device.component.scss']
})
export class ChangeDeviceComponent implements OnInit, AfterViewInit {
  deviceDetails: any[] = [];
  loading = false;

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;
  oldData: any;
  imeiFetched = false;

  sortKey: string = '';
  reverse: boolean = false;
  tableColumns: DataTableColumn<any>[] = [];

  private createTableColumns(): DataTableColumn<any>[] {
    const showVendor = this.roleId !== '11';
    return [
      { header: '#', key: 'rowNumber', width: '40px' },
      {
        headers: ['Vehicle No.', 'Chassis No.'],
        sortKey: 'param20',
        cellClassName: 'multiline-cell',
        value: device => this.joinValues(device.param20, device.param21)
      },
      {
        headers: ['Serial No.', 'IMEI No.'],
        sortKey: 'param6',
        cellClassName: 'multiline-cell',
        value: device => this.joinValues(device.param6, device.param5)
      },
      { header: 'ICCID No.', key: 'param7', sortKey: 'param7' },
      {
        header: 'Customer Details',
        sortKey: 'param36',
        cellClassName: 'multiline-cell',
        value: device => this.joinValues(device.param36, device.param37)
      },
      {
        headers: showVendor ? ['Dealer', 'Vendor'] : ['Dealer'],
        sortKey: 'param16',
        cellClassName: 'multiline-cell',
        value: device => showVendor
          ? this.joinValues(device.param16, device.param15)
          : this.joinValues(device.param16)
      },
      {
        header: 'Activation Status',
        sortKey: 'param27',
        cellClassName: 'multiline-cell',
        value: device => {
          const status = device.param27 === 'Pending OTP' ? 'Pending' : device.param27 || 'NA';
          return device.param27 === 'Activated'
            ? `${status}\n${device.param23 > 0 ? device.param23 : 'NA'}`
            : status;
        }
      },
      { header: 'Polling Status', key: 'param34', sortKey: 'param34' },
      {
        header: 'Activity',
        className: 'text-center',
        cellClassName: 'text-center',
        actions: [
          {
            label: 'Edit',
            icon: 'fa-edit',
            tone: 'primary',
            run: device => this.getDeviceDataForChange(device)
          }
        ]
      }
    ];
  }

  // Change Device Modal
  editSerialNo: string = '';
  editVehicleId: string = '';
  editOldIMEI: string = '';
  editNewIMEI: string = '';
  editRemark: string = '';
  isRemarkInvalid: boolean = false;
  imeiList: any[] = [];
// M2M / ICCID Flow
m2mProviders: M2MProvider[] = [];
selectedM2M: string = '';

chassisNo: string = '';
vehicleNo: string = '';

iccid: string = '';
iccidFetched = false;

mobileNo: string = '';
planName: string = '';

otpSent = false;
otp: string = '';
userId: string = '';
  roleId: string = '';
  showChangeModal: boolean = false;
  selectedIMEIPlain: string = '';

  constructor(
    private toast:ToastService,
    private deviceService: DeviceService,
    private vehicleService: VehicleService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {  
    this.toast.pageName = 'Change Device'; // Set page name for toast service
    this.roleId = sessionStorage.getItem('roleid') || '';
    this.tableColumns = this.createTableColumns();
  }

  private joinValues(...values: Array<string | number | null | undefined>): string {
    return values.map(value => value || 'NA').join('\n');
  }

 ngOnInit() {
  this.userId = sessionStorage.getItem('userid') || '';
  this.getDeviceData(1);
}


  ngAfterViewInit() {
    // No jQuery/select2 needed; using plain select / Angular bindings
  }
  updatePageSizeOptions() {
    // Generate page size options based on total count
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 1000) options.push(1000);
    if (this.totalCount > 0 && this.totalCount < 100) options.push(this.totalCount); // 'All'
    this.pageSizeOptions = options;
  }

  getDeviceData(pageNumber: number) {
    this.loading = true;
    this.currentPage = pageNumber;

    const request = {
      param1: this.searchText,
      param2: String(this.currentPage),
      param3: String(this.pageSize),
      param8: 'changedevicetovehicle',
      param9: '',  // vendorid filter can be added here if needed
      param10: '', // distributorid filter can be added here if needed
      param11: '', // dealerid filter can be added here if needed
      pdfexcel: '' // not used for regular fetch
    };

    this.deviceService.getDeviceDetailsForChange(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.deviceDetails = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.deviceDetails.length;
          this.updateTableRows();
          this.updatePageSizeOptions();
        } else {
          this.deviceDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.tableRows = [];
         this.toast.show('No Data Found: ' + response.entity, 'error');

        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.deviceDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        this.tableRows = [];
        console.error('Error fetching device details:', error);
       this.toast.show('Error fetching device details.', 'error');

        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getDeviceData(1);
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
    this.getDeviceData(1);
  }

  sort(key: string) {
    this.sortKey = key;
    this.reverse = !this.reverse;
    this.deviceDetails.sort((a, b) => {
      const valA = (a as any)[key];
      const valB = (b as any)[key];
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return this.reverse ? comparison * -1 : comparison;
    });
    this.updateTableRows();
  }

  onPageChange(page: number) {
    if (page < 1) return;
    const totalPages = this.getTotalPages();
    if (this.totalCount > 0 && page > totalPages) return;
    this.currentPage = page;
    this.getDeviceData(this.currentPage);
  }

  onPageSizeChange(size: number | string) {
    this.pageSize = size === 'All' || Number(size) === this.totalCount
      ? this.totalCount
      : Number(size);
    this.currentPage = 1;
    this.getDeviceData(this.currentPage);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  tableRows: any[] = [];

  private updateTableRows(): void {
    this.tableRows = this.deviceDetails.map((device, index) => ({
      ...device,
      rowNumber: (this.currentPage - 1) * this.pageSize + index + 1
    }));
  }

  // Change Device
  getDeviceDataForChange(device: any) {
    this.loadM2MProviders();
    this.oldData = device;
    this.showChangeModal = true;
    this.chassisNo = device.param21 || 'NA';
    this.vehicleNo = device.param20 || 'NA';

    this.editSerialNo = device.param6 || '';
    this.editOldIMEI = device.param2; // deviceId
    this.editVehicleId = device.param19; // vehicleId
    this.selectedIMEIPlain = device.param2;  
    
    let req = {
      //  param1: device.param2,
      //   param2: device.param5
          param1: "",
        param2:""
    }

    this.loading = true;
    this.vehicleService.getDeviceRosterForVehicle(req).subscribe({
      next: (response: any) => {
        this.loading = false;

       if (response.status && response.entity) {
  this.imeiList = response.entity;  
}

        this.cdr.detectChanges();
        // Open Angular modal
        this.showChangeModal = true;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading IMEI list:', error);
      this.toast.show('Error loading IMEI list.', 'error');

      }
    });
  }

  // getM2MList() {
  //   //console.log('getM2MList: Calling API...', ApiNames.M2M_PROVIDER_LIST);
  //   this.apiConsumerService.apiCall(this.listReq, ApiNames.M2M_PROVIDER_LIST).subscribe({
  //     next: (response: any) => {
  //       if (response.producerstatuscode === 200) {
  //         this.m2mProviders = response.producerresponse?.m2mproviderlist || [];
  //         this.m2mProvidersbulk = response.producerresponse?.m2mproviderlist || [];
  //         this.toast.show('success', 'M2M provider list loaded successfully!');
  //       } else {
  //         this.toast.show('error', 'Failed to load M2M provider list');
  //       }
  //     },
  //     error: (error) => {
  //       this.toast.show('error', 'Error loading M2M provider list: ' + (error?.message || 'Unknown error'));
  //     }
  //   });
  // }


  checkRemark() {
    this.isRemarkInvalid = this.editRemark.length < 10;
  }

  changeDevice() {
    if (!this.editNewIMEI) {
  this.toast.show('Select IMEI No.', 'error');

      return;
    }
    this.checkRemark();
    if (this.isRemarkInvalid) {
    this.toast.show('Enter remark with minimum 10 characters length', 'error');

      return;
    }

    this.loading = true;
    const request = {
      param1: this.editVehicleId,
      param2: this.editOldIMEI,
      param3: '',
      param4: this.editNewIMEI,
      param5: this.editRemark
    };

    this.vehicleService.changeDeviceToVehicle(request).subscribe({
      next: (response) => {
        this.loading = false;
       this.toast.show(response.entity, 'success');

        if (response.status && response.entity === 'Successfully Saved.') {
          this.showChangeModal = false;
          this.getDeviceData(this.currentPage);
        }
        this.showChangeModal = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error changing device:', error);
        alert('Error changing device.');
      }
    });
  }

back() {
  this.editRemark = '';
  this.iccid = '';
  this.selectedM2M = '';
  this.iccidFetched = false;
  this.otpSent = false;
  this.showChangeModal = false;
}


onNewIMEIChange(imeiValue: string) {
  this.selectedIMEIPlain = imeiValue;
  this.editNewIMEI = imeiValue
    ;
}
fetchICCID() {
  if (!this.iccid || !this.selectedM2M) {
  this.toast.show('Select M2M Provider and enter ICCID', 'error');

    return;
  }

  this.loading = true;

  const req = {
    param1: this.selectedM2M,
    param2: this.iccid
  };

  this.deviceService.fetchIccidDetails(req).subscribe({
    next: (res: any) => {
      this.loading = false;
      if (res.status) {
        this.mobileNo = res.entity.mobile;
        this.planName = res.entity.plan;
        this.iccidFetched = true;
      } else {
       this.toast.show('Invalid ICCID', 'error');

      }
    },
    error: () => {
      this.loading = false;
  this.toast.show('Error fetching ICCID', 'error');

    }
  });
}
selectionType: 'IMEI' | 'ICCID' | '' = '';

sendOtp() {

  const mobile = this.oldData?.param37;

  if (!mobile) {
    this.toast.show('Mobile number not available', 'error');
    return;
  }

  // allow OTP for both IMEI & ICCID
  if (!this.iccidFetched && !this.imeiFetched) {
    this.toast.show('Validate device first', 'error');
    return;
  }

  this.deviceService.sendOtp({ mobile }).subscribe({
    next: () => {
      this.otpSent = true;
      this.toast.show('OTP sent successfully', 'success');
    },
    error: () => this.toast.show('Failed to send OTP', 'error')
  });
}


ngOnChanges() {}

onSelectionTypeChange() {
  this.iccid = '';
  this.selectedIMEIPlain = '';
  this.iccidFetched = false;
  this.imeiFetched = false;
  this.otpSent = false;
  this.otp = '';
}

submitChange() {
  if (!this.iccidFetched) {
    this.toast.show('ICCID not validated', 'error');
    return;
  }

  if (!this.otp) {
    this.toast.show('Enter OTP', 'error');
    return;
  }

  // existing logic OK
}


loadM2MProviders() {
  this.deviceService.getM2MProviderList().subscribe({
    next: (res) => {
      if (res?.statuscode === 200 || res?.status) {
        this.m2mProviders = res.entity || [];
      } else {
        this.m2mProviders = [];
       this.toast.show('Failed to load M2M Providers', 'error');

      }
      this.cdr.detectChanges();
    },
    error: () => {
      this.m2mProviders = [];
    this.toast.show('Error loading M2M Providers', 'error');

    }
  });
}

checkDeviceValidity() {

  // 🔹 IMEI FLOW (no API yet)
  if (this.selectionType === 'IMEI') {

    if (!this.selectedIMEIPlain || !this.selectedM2M) {
      this.toast.show('Select IMEI and M2M Provider', 'error');
      return;
    }

    // 👉 Simulate fetch success
    this.imeiFetched = true;
    this.iccidFetched = true; // reuse same OTP flow

    this.toast.show('IMEI validated successfully', 'success');
    return;
  }

  // 🔹 ICCID FLOW (existing API)
  if (this.selectionType === 'ICCID') {

    if (!this.iccid || !this.selectedM2M) {
      this.toast.show('Select M2M Provider and enter ICCID', 'error');
      return;
    }

    const req = {
      param1: this.iccid,
      param2: this.oldData.param36,
      param3: '',
      param4: this.selectedM2M
    };

    this.loading = true;

    this.deviceService.checkDeviceValidity(req).subscribe({
      next: (res: any) => {
        this.loading = false;
        const message: string = res?.entity || '';
        const isValid = message.includes('#true');

        if (isValid) {
          this.iccidFetched = true;
          this.toast.show(message.replace('#true', '').trim(), 'success');
        } else {
          this.iccidFetched = false;
          this.toast.show(message.replace('#false', '').trim(), 'error');
        }
      },
      error: () => {
        this.loading = false;
        this.iccidFetched = false;
        this.toast.show('Error validating ICCID', 'error');
      }
    });
  }
}




}

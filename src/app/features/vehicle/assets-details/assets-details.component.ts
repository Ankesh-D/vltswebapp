import { Component, OnInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { DeviceService, Device,  AssetsDetailsRequest } from '../../../core/services/device.service';
import { ToastService } from '../../../core/services/toast.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

class RequestData {
  param1 = '';
  param2 = '';
  param3 = '';
  param4 = '';
  param5 = '';
  param6 = '';
  param7 = '';
  param8 = '';
  param9 = '';
  param10 = '';
  param11 = '';
  param12 = '';
}

@Component({
    selector: 'app-assets-details',
    imports: [CommonModule, FormsModule, RouterModule, NgbPaginationModule],
    templateUrl: './assets-details.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './assets-details.component.scss'
})
export class AssetsDetailsComponent implements OnInit {
  devices: Device[] = [];
  loading = false;
  errorMessage = '';
  searchText = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20];
  totalCount = 0;
  pageCount = 0;
    roleId: string = '';
  // Route parameters
  filter: string = '';  // Filter type (TotalDevice, Activated, Pending, etc.)
  vendor: string = '';  // Vendor ID (encrypted)
  rto: string = '';     // RTO ID (encrypted)
  showDeleteModal = false;
selectedVehicle: any = null;
deleteRemark: string = '';
  @ViewChild('requestForm') requestForm?: NgForm;
  selectedDeviceId = '';
  selectedDeviceImei = '';
  untagRemarks = '';
  showUntagModal = false;
  isSubmitting = false;
  activationStatus = '';
  requestStatus = '';
  status = '';
  requestedFor = '';
  requestId = '';
  requestType = '';
  requestData: RequestData = new RequestData();
  // Sorting
  sortKey: string = '';
  reverse: boolean = false;
  deviceType: string = 'new';
  // Filter type display
  filterType: string = 'Total Device';
  
  constructor(
    private toast: ToastService,
    private deviceService: DeviceService,
    private vehicleService: VehicleService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.toast.pageName = 'Assets Details'; // Set page name for toast service
  }

  ngOnInit() {
    this.roleId = sessionStorage.getItem('roleid') || '';
    // Get route parameters
    this.route.params.subscribe(params => {
      this.filter = params['filter'] || 'TotalDevice';
      this.vendor = params['vendor'] || '0';
      this.rto = params['rto'] || '0';
      
      // Map filter to display name
      this.mapFilterToDisplayName();
      
      // Reload devices with new params
      this.loadDevices();
    });
    
  }
  redirectInsert() {
    this.router.navigate(['device/entry']);
  }
onTypeChange() {
  this.currentPage = 1;
  this.loadDevices();
}
  mapFilterToDisplayName() {
    if (this.filter === 'TotalDevice' || this.filter === 'Total Device' || this.filter === 'TOTAL DEVICE') {
      this.filterType = 'Total Device';
    } else if (this.filter === 'ACTIVATED') {
      this.filterType = 'Activated';
    } else if (this.filter === 'PENDING') {
      this.filterType = 'Pending';
    } else if (this.filter === 'TODAYINSTALLED' || this.filter === 'Installed') {
      this.filterType = 'Today\'s Installation';
    } else if (this.filter === 'NeverReceived') {
      this.filterType = 'Never Received';
    } else if (this.filter === 'NotReceived') {
      this.filterType = 'Not Received';
    } else {
      this.filterType = this.filter;
    }
  }

  loadDevices() {
    this.loading = true;
    this.errorMessage = '';
    // this.devices = [];

    // Normalize filter value - pass it directly to API as original JSP does
    // The original passes $routeParams.filter directly to param2
    let filterValue = this.filter;
    if (filterValue === 'Total') {
      filterValue = 'TotalDevice';
    }
    // Backend API doesn't seem to recognize "Installed" as a valid filter
    // Map "Installed" to "TotalDevice" since installed devices = all devices that have been installed
    // This is a workaround for backend API limitation
    if (filterValue === 'Installed') {
      console.warn('⚠️ Backend API does not support "Installed" filter. Mapping to "TotalDevice" as workaround.');
      filterValue = 'TotalDevice';
    }

  const request: AssetsDetailsRequest = {
  param1: this.searchText,
  param2: this.currentPage,
  param3: this.pageSize,
  param4: this.deviceType,
  param5: this.vendor !== '0' ? this.vendor : '',
  param6: this.rto !== '0' ? this.rto : '',
  param7: '',
  pdfexcel: '' // Add this line to include pdfexcel in the request
};

    //console.log('Loading devices with request:', {
    //   ...request,
    //   filterValue: filterValue,
    //   originalFilter: this.filter
    // });

    this.deviceService.getAssetsDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        const statuscode = (response as any)?.statuscode;
        // //console.log('Device API Response (Full):', JSON.stringify(response, null, 2));
        // //console.log('Device API Response (Summary):', {
        //   status: response?.status,
        //   statuscode: statuscode,
        //   hasEntity: !!response?.entity,
        //   listDataLength: response?.entity?.listData?.length,
        //   totalCount: response?.entity?.param1,
        //   currentPage: this.currentPage,
        //   pageSize: this.pageSize,
        //   filter: this.filter,
        //   filterValue: filterValue,
        //   entityKeys: response?.entity ? Object.keys(response.entity) : [],
        //   isEmptyEntity: response?.entity ? Object.keys(response.entity).length === 0 : true
        // });

        // Log warning if filter is "Installed" but returns empty
        if (this.filter === 'Installed' && String(response?.entity?.param1) === '0') {
          // console.warn('⚠️ API returned 0 records for "Installed" filter. This might indicate:');
          // console.warn('1. Backend API does not recognize "Installed" as a valid filter value');
          // console.warn('2. Backend query needs to be checked/fixed');
          // console.warn('3. The filter value might need to be converted (e.g., "TotalDevice" or "TODAYINSTALLED")');
        }

        // Check statuscode==200 like original JSP controller does
        if ((response?.status && statuscode === 200) || (response?.status && !statuscode)) {
          if (Object.keys(response.entity).length === 0) {
            this.devices = [];
            if (this.currentPage === 1) {
              this.totalCount = 0;
              this.pageCount = 0;
            }
          } else if (response.entity.listData !== undefined) {
            this.devices = response.entity.listData || [];
            // Parse totalCount - it might be string or number
            if (response.entity.param1 !== undefined && response.entity.param1 !== null) {
              const totalCountValue = Number(response.entity.param1) || 0;
              if (this.totalCount !== totalCountValue) {
                // //console.log(`Total count updated: ${this.totalCount} -> ${totalCountValue}`);
              }
              this.totalCount = totalCountValue;
            }
          } else if (Array.isArray(response.entity)) {
            this.devices = response.entity;
            this.totalCount = response.entity.length;
          } else {
            this.devices = [];
          }

          this.pageCount = this.devices.length < this.pageSize ? this.devices.length : this.pageSize;
          this.updatePageSizeOptions();
          this.cdr.detectChanges();
        } else {
          const errorMsg = typeof response?.entity === 'string'
            ? response.entity
            : 'Failed to load devices';
          this.errorMessage = errorMsg;
          this.devices = [];
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error loading devices. Please try again.';
        this.devices = [];
        console.error('Error loading devices:', error);
        this.cdr.detectChanges();
      }
    });
  }

  updatePageSizeOptions() {
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 0 && this.totalCount < 100) options.push(this.totalCount);
    this.pageSizeOptions = options;
  }

  onPageSizeChange(size: number | string) {
    if (size === 'All' || size === this.totalCount) {
      this.pageSize = this.totalCount;
    } else {
      this.pageSize = Number(size);
    }
    this.currentPage = 1;
    this.loadDevices();
  }

  onPageChange(page: number) {
    if (page < 1) return;
    const totalPages = this.getTotalPages();
    if (this.totalCount > 0 && page > totalPages) return;
    this.currentPage = page;
    this.loadDevices();
  }

  reloadData() {
    this.searchText = '';
    this.currentPage = 1;
    this.pageSize = 20;
    this.loadDevices();
  }

  getSearchDetails() {
    this.currentPage = 1;
    this.loadDevices();
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    this.cdr.detectChanges();
  }

  goHome() {
    this.router.navigate(['/dashboard']);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const total = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = 8;
    
    if (total <= maxPages) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(total);
      } else if (this.currentPage >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(total);
      }
    }
    return pages;
  }

  shouldShowPage(page: number): boolean {
    return page !== -1;
  }

  // Helper method to convert value to string for template usage
  toString(value: any): string {
    return value ? String(value) : '';
  }

  // Helper method to check if string has length
  hasLength(value: any): boolean {
    return value && String(value).length > 0;
  }

  printReceipt(d: any) {
    let request  = {
      param1: d.param19,
      param10: "pdf"
    }
    this.deviceService.getReceiptGeneratedDevices1(request).subscribe({
      next: (response: any) => {
        if( response.statuscode == 200) {
          let  receiptUrl: string = response.entity;
          if (receiptUrl) {
            window.open(receiptUrl, '_blank');
          }
          
        }

      },
      error: (error) => {
        console.error('Error generating receipt:', error);
  this.toast.show('Error generating receipt. Please try again.', 'error');

      }
    });

  }

  closeDeleteModal(){
  this.showDeleteModal = false;
}

openDeleteModal(device: any){
  this.selectedVehicle = device;
  this.deleteRemark = '';
  this.showDeleteModal = true;
}
submitDelete(){

  if(!this.deleteRemark || this.deleteRemark.length < 5){
    this.toast.show('Remark must be minimum 5 characters','error');
    return;
  }

  const payload = {
    param1: this.selectedVehicle.param10,   // vehicleid
    param3: this.deleteRemark
  };

  //console.log("Delete Vehicle Payload:", payload);

  this.deviceService.removeVehicle(payload).subscribe({

    next:(response:any)=>{

      if(response.statuscode == 200){

        this.toast.show('Vehicle deleted successfully','success');

        this.closeDeleteModal();

        this.loadDevices();

      }else{

        this.toast.show(response.entity || 'Delete failed','error');

      }

    },

    error:(err)=>{
      console.error(err);
      this.toast.show('Server error','error');
    }

  });

}
  setdataData(details: any) {
    this.openUntagModal(details);
  }

  untagDevice(details: any) {
    this.openUntagModal(details);
  }

  private openUntagModal(details: any) {
    this.requestForm?.resetForm();
    this.untagRemarks = '';
    this.status = '';
    this.requestType = '';
    this.requestData = new RequestData();
    this.selectedDeviceId = details?.param2 || details?.param3 || '';
    this.activationStatus = details?.param25 || details?.param34 || '';
    this.selectedDeviceImei = details?.param4 || details?.param5 || '';
    this.requestStatus = details?.param71 || '';
    this.requestedFor = details?.param70 || '';
    this.requestId = details?.param69 || '';
    this.showUntagModal = true;

    if (this.requestId) {
      this.requestDetails();
    }
  }

  closeUntagModal() {
    this.showUntagModal = false;
    this.untagRemarks = '';
    this.selectedDeviceId = '';
    this.selectedDeviceImei = '';
    this.activationStatus = '';
    this.requestStatus = '';
    this.status = '';
    this.requestedFor = '';
    this.requestId = '';
    this.requestType = '';
    this.requestData = new RequestData();
    this.loadDevices();
  }

  untagOperation(): boolean {
    if (this.requestStatus === 'Pending' && !this.status) {
      this.toast.show('Please select Approve or Reject', 'error');
      return false;
    }

    this.isSubmitting = true;
    const request = {
      param2: this.selectedDeviceId,
      param3: this.untagRemarks
    };

    this.vehicleService.untagDevice(request).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res?.statuscode == 200 || res?.statuscode == '200' || res?.status) {
          this.toast.show(res?.entity || 'Device untagged successfully', 'success');
          this.closeUntagModal();
        } else {
          this.toast.show(res?.entity || 'Error untagging device', 'error');
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.toast.show('Error untagging device', 'error');
      }
    });

    return true;
  }

  deleteOperation() {
    this.isSubmitting = true;
    const request = {
      param1: this.selectedDeviceId,
      param2: this.untagRemarks,
      param3: false
    };

    this.deviceService.deleteDevice(request).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res?.statuscode == 200 || res?.statuscode == '200' || res?.status) {
          this.toast.show(res?.entity || 'Device deleted successfully', 'success');
          this.closeUntagModal();
        } else {
          this.toast.show(res?.entity || 'Delete failed', 'error');
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.toast.show('Error deleting device', 'error');
      }
    });
  }

  requestInitialize() {
    this.isSubmitting = true;
    const request = {
      requestpage: 'device',
      assetid: this.selectedDeviceId,
      requestvalues_new: '',
      reasonid: '',
      requesttype: this.requestType,
      requestvalues_old: '',
      remarks: this.untagRemarks
    };

    this.deviceService.requestInitialize(request).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res?.statuscode == 200 || res?.statuscode == '200' || res?.status) {
          this.toast.show(res?.entity || 'Request submitted successfully', 'success');
          this.closeUntagModal();
        } else {
          this.toast.show(res?.entity || 'Request failed', 'error');
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.toast.show('Error submitting request', 'error');
      }
    });
  }

  updateChangeRequestStatus(operationType: string) {
    if (this.requestStatus === 'Pending' && !this.status) {
      this.toast.show('Please select Approve or Reject', 'error');
      return;
    }

    this.isSubmitting = true;
    const request = {
      requestid: this.requestId,
      status: this.status,
      remarks: this.untagRemarks
    };

    this.deviceService.updateChangeRequestStatus(request).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res?.statuscode == 200 || res?.statuscode == '200' || res?.status) {
          this.toast.show(res?.entity || 'Request updated successfully', 'success');
          if (this.status === 'Approved') {
            operationType === 'delete' ? this.deleteOperation() : this.untagOperation();
          } else {
            this.closeUntagModal();
          }
        } else {
          this.toast.show(res?.entity || 'Request update failed', 'error');
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.toast.show('Error updating request status', 'error');
      }
    });
  }

  performOperation(type: string) {
    if (!this.untagRemarks?.trim() || this.untagRemarks.trim().length < 5) {
      this.toast.show('Remarks must be at least 5 characters', 'error');
      return;
    }

    if (this.activationStatus === 'Pending OTP') {
      type === 'delete' ? this.deleteOperation() : this.untagOperation();
      return;
    }

    if (this.activationStatus === 'Activated' && ['11', '61', '13'].includes(this.roleId)) {
      this.requestType = type;
      this.requestInitialize();
      return;
    }

    if (this.activationStatus === 'Activated' && this.roleId === '10') {
      if (this.requestStatus) {
        this.updateChangeRequestStatus(type);
      } else {
        type === 'delete' ? this.deleteOperation() : this.untagOperation();
      }
    }
  }

  requestDetails() {
    const request = {
      param2: '1', // page no
      param3: '10', // item per page
      param4: '', // search by
      param5: this.requestId
    };

    this.deviceService.requestDetails(request)
        .subscribe({
          next: (res: any) => {
            if (res?.statuscode == 200 || res?.statuscode == '200' || res?.status) {
              this.requestData = res?.entity?.listData?.[0] || new RequestData();
            } else {
              this.toast.show(res?.entity || 'Error fetching request details', 'error');
            }
          },
          error: () => {
            this.toast.show('Error fetching request details', 'error');
          }
        });
  }

  exportPDFExcel(type: any) {
     const request: AssetsDetailsRequest = {
  param1: this.searchText,
  param2: '',//this.currentPage,
  param3: '', //this.pageSize,
  param4: this.deviceType,
  param5: this.vendor !== '0' ? this.vendor : '',
  param6: this.rto !== '0' ? this.rto : '',
  param7: '',
  pdfexcel: 'excel' // Add this line to include pdfexcel in the request
};
    this.deviceService.getAssetsDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if(response.statuscode == 200) {
          const fileUrl: string = response?.entity;
          if (fileUrl) {
            this.toast.commonFileDownload(fileUrl);
          }
        this.loading = false;
        }
      },
      error: (error) => {
        this.loading = false;
        this.toast.show('Error exporting data. Please try again.', 'error');
      }

    });
  }
}

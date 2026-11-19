import { Component, OnInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PermitHolderService } from '../../../core/services/permit-holder.service';
import { ToastService } from '../../../core/services/toast.service'; // Import ToastService
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { VehicleService } from '../../../core/services/vehicle.service';
import { Device } from '../../dashboard/new-date-filter-dashboard/new-date-filter-dashboard.component';
import { DeviceService } from '../../../core/services/device.service';
import { UntagRequestDetailsComponent } from './untag-request-details/untag-request-details.component';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { DataTableColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
export class RequestData {
  "param1": string =''; //"1",
  "param2": string =''; //"requestid",
  "param3": string =''; //"vendorid",
  "param4": string =''; //"vendorname",
  "param5": string =''; //"assetid",
  "param6": string =''; //"assetname",
  "param7": string =''; //"requestvalues_new",
  "param8": string =''; //"requestvalues_old",
  "param9": string =''; //"requesttime",
  "param10":string =''; // "requeststatus",
  "param11":string =''; // "requesttype",
  "param12":string =''; // "remarks"
}
@Component({
    selector: 'app-untag-vehicle-new',
    imports: [CommonModule, FormsModule, RouterModule, NgSelectModule, UntagRequestDetailsComponent,
      CommonDataToolbarComponent, DataTableComponent, PaginationComponent],
    templateUrl: './untag-vehicle-new.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './untag-vehicle-new.component.scss'
})
export class UntagVehicleNewComponent  implements OnInit {
  dataDetails: any[] = [];
  loading = false;

  searchText: string = '';
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;

  readonly tableColumns: DataTableColumn<any>[] = [
    { header: '#' },
    { header: 'IMEI / Serial No / ICCID' },
    { header: 'Vendor / Dealer' },
    { header: 'Vehicle No / Chassis / Engine' },
    { header: 'Type / Model / Make' },
    { header: 'Customer / Mobile' },
    { header: 'RTO' },
    { header: 'Activation / Validity' },
    { header: 'Polling / Last Time' },
    { header: 'Status / Action Status' },
    { header: 'MVI Approval Status / Approved By / Approved On', visible: () => this.roleId == 10 || this.roleId == 64 },
    { header: 'Action' }
  ];
  selectedDeviceId: string = '';
  selectedDeviceImei: string = '';
  untagRemarks: string = '';
  showUntagModal: boolean = false;
  isSubmitting: boolean =false;
  roleId: any = sessionStorage.getItem('roleid') || '';
  requestType: any;
  requestData: RequestData = new RequestData();
  pageTitle: string = "Device Details For Untag";
  tabTitle: string = "alldevice";
  searchByType: string = "TotalDevice";
  constructor(
    private vehicleService: VehicleService,
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService // Inject ToastService
  ) {
    this.roleId = sessionStorage.getItem('roleid') || '';
    this.toastService.pageName = 'Device Details For Untag'; // Set page name for toast service

  }

  ngOnInit() {
    this.getDetails(1);
  }

  toggleFlag:boolean=false;
  togglefun() {
      this.toggleFlag = !this.toggleFlag;
  }
 
   updatePageSizeOptions() {
    // Generate page size options based on total count
    const options = [20];
    if (this.totalCount > 50) options.push(50);
    if (this.totalCount > 100) options.push(100);
    if (this.totalCount > 200) options.push(200);
    if (this.totalCount > 500) options.push(500);
    if (this.totalCount > 0 && this.totalCount < 100 && !options.includes(this.totalCount)) {
      options.push(this.totalCount);
    }
    this.pageSizeOptions = options;
  }

  getDetails(pageNumber: number) {
    this.toggleFlag = false;
    this.loading = true;
    this.currentPage = pageNumber;

    const request = {
      param1: this.searchText || '',   // 🔍 search
      param2: this.currentPage,  // 📄 page no
      param3: this.pageSize,// 📄 page size
      param8: '',
      param9: '',
      param10: this.searchByType

    };

    this.vehicleService.getDeviceMasterDetails(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status && response.entity) {
          this.dataDetails = response.entity.listData || [];
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.dataDetails.length;
          this.updatePageSizeOptions()
        } else if (response.entity) {
          this.dataDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.toastService.show('No Data Found: ' + response.entity, 'error');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.dataDetails = [];
        this.totalCount = 0;
        this.pageCount = 0;
        console.error('Error fetching details:', error);
        this.toastService.show('Error fetching details.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  getSearchDetails() {
    this.getDetails(1);
  }

  reloadData() {
    this.searchText = '';
    this.pageSize = 20;
    this.currentPage = 1;
    this.getDetails(1);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.getDetails(this.currentPage);
  }

  onPageSizeChange(size: number | string) {
    this.pageSize = size === 'All' || Number(size) === this.totalCount ? this.totalCount : Number(size);
    this.currentPage = 1;
    this.getDetails(this.currentPage);
  }
  // 🔹 Open Untag Modal
  @ViewChild('requestForm') requestForm!: NgForm;
  activationStatus: any = "";
  requestStatus: any = "";
  status: any = "";
  requestedFor: any = "";
  requestId: any = "";
  
  setdataData(details: any) {
      this.requestForm.resetForm(); // Reset form to clear previous values and validation states
      this.showUntagModal = true;
      this.untagRemarks = '';
      this.selectedDeviceId = details.param2;
      this.activationStatus = details.param34;
      this.selectedDeviceImei = details.param5;
      this.requestStatus = details.param71;
      this.requestedFor = details.param70;
      this.requestId = details.param69;
      if(this.requestId !='') {
        this.requestDetails()
      }
  }

  untagDevice(details: any) {
    this.requestForm.resetForm();
    this.selectedDeviceId = details.param2;
    this.activationStatus = details.param34;
    this.selectedDeviceImei = details.param5;
    this.requestStatus = details.param71 ? details.param71 : '';
    this.requestedFor = details.param70;
    this.requestId = details.param69;
    this.untagRemarks = '';
    this.showUntagModal = true;
    if(this.requestId !='') {
      this.requestDetails();
    }
  }

  // 🔹 Close Modal
  closeUntagModal() {
    this.showUntagModal = false;
    this.untagRemarks = '';
    this.selectedDeviceId = '';    
    this.selectedDeviceImei = '';  
    this.getDetails(this.currentPage);
  }

  // 🔹 Submit Untag with Remarks
  untagOperation() {
    console.log('Request Status:', this.requestStatus);
    if ( this.requestStatus == 'Pending' && (this.status == '' || this.status == undefined)) {
      this.toastService.show('Please select Approve or Reject', 'error');
      return false
    }
    else {

      const request = {
          param2: this.selectedDeviceId,
          param3: this.untagRemarks
        };
    
        this.vehicleService.untagDevice(request)
          .subscribe({
            next: (res: any) => {
              this.isSubmitting = false;
              if (res?.statuscode == '200') {
                this.toastService.show(res.entity, 'success');
                this.closeUntagModal();
              } else {
                this.toastService.show(res?.entity, 'error');
              }
            },
            error: () => {
              this.isSubmitting = false;
              this.toastService.show('Error untagging device', 'error');
            }
          });
      return true;
    }

  }

  deleteOperation() {
    const request = {
        param1: this.selectedDeviceId,
        param2: this.untagRemarks,
        param3: false, // loginId can be added here if needed
      };
  
      this.deviceService.deleteDevice(request)
        .subscribe({
          next: (res: any) => {
            this.isSubmitting = false;
            if (res?.statuscode == '200') {
              this.toastService.show(res.entity, 'success');
              this.closeUntagModal();
            } else {
              this.toastService.show(res?.entity, 'error');
            }
          },
          error: () => {
            this.isSubmitting = false;
            this.toastService.show('Error untagging device', 'error');
          }
        });
  }

  requestInitialize() {
    let request = {
      "requestpage":"device",
      "assetid": this.selectedDeviceId,
      "requestvalues_new":"",
      "reasonid":"",
      "requesttype": this.requestType,
      "requestvalues_old":"",
      "remarks":this.untagRemarks
    }
    this.deviceService.requestInitialize(request)
        .subscribe({
          next: (res: any) => {
            this.isSubmitting = false;
            if (res?.statuscode == '200') {
              this.toastService.show(res.entity, 'success');
              this.closeUntagModal();
            } else {
              this.toastService.show(res?.entity, 'error');
            }
          },
          error: () => {
            this.isSubmitting = false;
            this.toastService.show('Error untagging device', 'error');
          }
        });

  }
  updateChangeRequestStatus(status: string) {
    if(this.status == '' || this.status == undefined && this.requestStatus == 'Pending') {
      this.toastService.show('Please select Approve or Reject', 'error');
      return;
    }
    let request = {
      requestid: this.requestId,
      status: this.status,
      remarks: this.untagRemarks
    }
    console.log('Change Request Update Payload:', request); 
    this.deviceService.updateChangeRequestStatus(request)
        .subscribe({
          next: (res: any) => {
            this.isSubmitting = false;
            if (res?.statuscode == '200') {
              this.toastService.show(res.entity, 'success');
              if(status == 'untag') {
                this.untagOperation();
              }
              else if(status == 'delete') {
                this.deleteOperation();
              }
            } else {
              this.toastService.show(res?.entity, 'error');
            }
          },
          error: () => {
            this.isSubmitting = false;
            this.toastService.show('Error updating request status', 'error');
          }
        });
  }

  performOperation(type: string) {
    if(this.activationStatus=='Pending OTP') {  
      if(type == 'untag') {
        this.untagOperation();
      }
      else if(type == 'delete') {
        this.deleteOperation();
      }
    } else if(this.activationStatus=='Activated') {
      if(this.roleId =='11' || this.roleId == '61' || this.roleId == '13') {

        this.requestInitialize();
      }
      else if((this.roleId =='10' || this.roleId =='64') && this.requestStatus == '' && this.activationStatus=='Activated') {
        if(type == 'untag') {
          this.untagOperation();
        }
        else if(type == 'delete') {
          this.deleteOperation();
        }

      }
      else if((this.roleId =='10' || this.roleId =='64') && this.requestStatus != '' && this.activationStatus=='Activated') {
        // this.updateChangeRequestStatus(type);
        this.untagOperation();
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
            if (res?.statuscode == '200') {
              this.requestData = res.entity.listData[0]; // Assuming listData is an array and we need the first item
              console.log('Request Details:', res.entity.listData);
            } else {
              this.toastService.show(res?.entity, 'error');
            }
          },
          error: () => {
            this.toastService.show('Error fetching request details', 'error');
          }
        });
  }

  // submitUntagRequest() {
  //   if (!this.untagRemarks.trim()) {
  //     this.toastService.show('Please enter a remark', 'error');
  //     return;
  //   }

  //   this.isSubmitting = true;
  //   if(this.activationStatus === 'Activated') {

  //   }
  //   if(this.activationStatus === 'Pending OTP') {
  //     const request = {
  //       param2: this.selectedDeviceId,
  //       param3: this.untagRemarks
  //     };
  
  //     this.vehicleService.untagDevice(request)
  //       .subscribe({
  //         next: (res: any) => {
  //           this.isSubmitting = false;
  //           if (res?.status) {
  //             this.toastService.show('Device Untagged Successfully', 'success');
  //             this.closeUntagModal();
              
  //           }
  //         },
  //         error: () => {
  //           this.isSubmitting = false;
  //           this.toastService.show('Error untagging device', 'error');
  //         }
  //       });
  //   }
  // }

  
  
  

  

  
}
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';// I'll assume getVehicleDetailsByType is added to VehicleService and returns an Observable<any>
import { GetStatusService, ReceiptStatusResponse } from '../../../core/services/get-status.service';
import { MapboxService } from '../../../core/services/mapbox.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;
declare var moment: any;
@Component({
  selector: 'app-reneval-activation',
  standalone: true,
  imports: [FormsModule, CommonModule, ToastComponent, CommonDataToolbarComponent, CommonTableComponent],
  templateUrl: './reneval-activation.component.html',
  styleUrl: './reneval-activation.component.scss'
})
export class RenevalActivationComponent  implements OnInit, OnDestroy {
  searchBy: string = "";
  responseData: ReceiptStatusResponse = new ReceiptStatusResponse();
  
  isDataLoaded: boolean = false;
  errorMessage: string | null = null;

  // New properties for the vehicle list table
  vehicleDetails: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: '#', width: '40px' },
    { key: 'param7', label: 'Vendor', sortable: true, visible: () => this.task != 11 },
    { key: 'param11', headers: ['Vehicle No.', 'Chassis No.'], sortable: true },
    { key: 'param5', label: 'Serial No.', sortable: true },
    { key: 'param4', label: 'IMEI No.', sortable: true },
    { key: 'param6', label: 'ICCID No.', sortable: true },
    { key: 'param28', label: 'Customer Details', sortable: true },
    { key: 'param19', label: 'Vehicle Type', sortable: true },
    { key: 'param16', label: 'Manufacturing Year', sortable: true },
    { key: 'param14', label: 'Activation Date', sortable: true },
    { key: 'param64', label: 'Valid Upto', sortable: true, sortKey: 'param53' },
    { key: 'param75', label: 'RTO Approved', sortable: true, sortKey: 'param53' },
    { key: 'view', label: 'View' }
  ];
  isVehicleListLoaded: boolean = false;
  sortKey: string = '';
  reverse: boolean = false;
  task: any | null = sessionStorage.getItem('roleid'); // For conditional columns in the template, assuming it's a number.
  private noTrackDataSubscription: Subscription | undefined;
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [20, 50, 100, 200, 500];
  totalCount = 0;
  pageCount = 0;
  detailsflag: boolean = false;
  receiptstatusflag: boolean = false;   
  searchText: string = '';
  vehicleData: any = null;
  otpTimerFlag: boolean = false;
  selectedDownloadType: string = '';
isExporting: boolean = false;

  constructor(
    private getStatusService: GetStatusService,
    public mapBoxService: MapboxService,
    private vehicleService: VehicleService,
    private router: Router,
    private dashboardService: DashboardService
  ) {
    this.isDataLoaded = false;
  }

  ngOnInit(): void {
    // Subscribe to the event from MapboxService to know when to close the modal.
    this.noTrackDataSubscription = this.mapBoxService.noTrackData$.subscribe((message) => {
      $('#staticBackdrop').modal('hide');
      if (message) {
        this.errorMessage = message;
      }
    });
    this.getStatusOnInitDetails(1);
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks.
    this.noTrackDataSubscription?.unsubscribe();
  }

getStatusOnInitDetails(pageNumber: number) {
  this.isVehicleListLoaded = false;
  const requestBody = {
    param1: this.searchBy,
    param2: "Old System Data",
    param3: String(pageNumber),
    param4: String(this.pageSize),
    param5: "",
    param6: "",
    pdfexcel: "" // Add this if you want to support export functionality
  };
    // Assuming VehicleService has a method like 'getVehicleDetailsByType' for 'psv_get_vehicledetailsbytype' API
    this.vehicleService.getVehicleDetailsByType(requestBody).subscribe({
      next: (response: any) => {
if (response && response.status && response.entity && Array.isArray(response.entity.listData)) {
          this.vehicleDetails = response.entity.listData;
          this.isVehicleListLoaded = true;
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.vehicleDetails.length;
          this.detailsflag = true;
          this.receiptstatusflag = false; // Set receiptstatusflag
        } else {
          this.errorMessage = 'Failed to load vehicle details or data is not in the expected format.';
          this.msgType = 'error';
          this.vehicleDetails = [];
          this.totalCount = 0;
          this.pageCount = 0;
          this.detailsflag = true;
          this.receiptstatusflag = false; 
          this.isVehicleListLoaded = true;
        }
      },
      error: (error: any) => {
        this.isVehicleListLoaded = true;
        this.errorMessage = 'Error fetching vehicle details.';
        this.msgType = 'error';
        // this.vehicleDetails = [];
              }
    });
}

  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }

    this.vehicleDetails.sort((a, b) => {
      const valA = a[key] ?? '';
      const valB = b[key] ?? '';
      if (valA < valB) return this.reverse ? 1 : -1;
      if (valA > valB) return this.reverse ? -1 : 1;
      return 0;
    });
  }

  getSearchDetails() {
    this.getStatusOnInitDetails(1);
  }

  reloadData() {
    this.searchBy = '';
    this.getStatusOnInitDetails(1);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.getStatusOnInitDetails(this.currentPage);
  }

  onPageSizeChange(event: Event) {
    const newSize = (event.target as HTMLSelectElement).value;
    this.pageSize = newSize === 'All' ? this.totalCount : Number(newSize);
    this.currentPage = 1;
    this.vehicleDetails = [];
    this.totalCount = 0;
    this.getStatusOnInitDetails(this.currentPage);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.currentPage;
    const maxPagesToShow = 7; // Show 7 page numbers at a time

    if (totalPages <= maxPagesToShow) {
      // If total pages are 7 or less, show all page numbers
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
    const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
    let startPage: number;
    let endPage: number;

    if (currentPage <= maxPagesBeforeCurrent + 1) {
      startPage = 1;
      endPage = maxPagesToShow;
    } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
      startPage = totalPages - maxPagesToShow + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - maxPagesBeforeCurrent;
      endPage = currentPage + maxPagesAfterCurrent;
    }
    return Array.from({ length: (endPage - startPage + 1) }, (_, i) => startPage + i);
  }

  getPaginatedData(): any[] {
    return this.vehicleDetails;
  }


  onSearch(item:any) {
    let paramValue = item.param5;
    this.getStatusService.getStatusDetails({ param1: paramValue, param10: '' }).pipe()
      .subscribe({
        next: (response) => {
          if (response.status && response.entity && Object.keys(response.entity).length > 0) {
          this.isDataLoaded = true;
          this.responseData = response.entity;
          //console.log('Response Data:', this.responseData);
          this.detailsflag = false;
          this.receiptstatusflag = true; 
          } else {
            this.detailsflag = true;
          this.receiptstatusflag = false; 
            this.isDataLoaded = false;
            this.errorMessage = 'No data found for the given search criteria.';
          }
        },
        error: (error) => {
          this.isDataLoaded = false;
          console.error('Error fetching status details:', error);
        }
      });
  }

  openMapModal(serialNo: string) {
    $('#staticBackdrop').modal('show');
    setTimeout(() => {
      this.mapBoxService.initializeMap('mapContainer');
      this.mapBoxService.liveVehicleTrack(serialNo);
    }, 500);
  }

  approveReport() {
    if (!this.responseData || !this.responseData.param12) {
      alert('Cannot approve: Vehicle or Device information is missing.');
      console.error('Vehicle ID (param21) or Device ID (param22) not found in responseData', this.responseData);
      return;
    }

    // Remarks can be captured from a user input if needed.
    const remarks = "ok";

    const request = {
      param1: this.responseData.param12, // vehicleid
      param2: '1', // status
      param3: remarks
    };

    this.vehicleService.updateVehicleActivationStatus(request).subscribe({
      next: (response: any) => {
        if (response.status) {
          let msg = response?.entity;
          this.errorMessage = msg;

          this.onSearch(''); // Refresh the data
        } else {
          let msg = response?.entity || 'An error occurred while approving the report.';
          this.errorMessage = msg;
        }
      },
      error: (err) => {
        let msg = err?.entity;
        this.errorMessage = msg;
      }
    });
  }

  DownloadReport() {
    if (!this.responseData || !this.responseData.param12) {
      this.errorMessage = 'Cannot download report: Vehicle information is missing.';
      console.error('Vehicle ID (param12) not found in responseData', this.responseData);
      return;
    }

    const vehicleId = this.responseData.param12; // As per approveReport, param12 is the vehicleId

    this.getStatusService.getReceiptPdfPath(vehicleId).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          const filePath = response.entity;
           window.open(filePath, '_blank');
          // The backend returns a server-side absolute path. We assume a web-accessible
          // path can be constructed by finding a known public directory in the path.
          //const psvImagesIndex = filePath.indexOf('/psvimages/');

          // if (psvImagesIndex !== -1) {
          //   const webPath = filePath.substring(psvImagesIndex);
          //   const downloadUrl = window.location.origin + webPath;

          //   const link = document.createElement('a');
          //   link.href = downloadUrl;
          //   link.setAttribute('download', webPath.split('/').pop() || 'receipt.pdf');
          //   link.setAttribute('target', '_blank');
          //   document.body.appendChild(link);
          //   link.click();
          //   document.body.removeChild(link);
          // } else {
          //   this.errorMessage = 'Could not construct a valid download URL from the path received from the server.';
          //   console.error('File path from server does not contain "/psvimages/":', filePath);
          // }
        } else {
          this.errorMessage = response.message || 'Failed to get PDF download link.';
        }
      },
      error: (err) => {
        this.errorMessage = 'An error occurred while trying to download the report.';
        console.error('Error downloading report:', err);
      }
    });
  }

  

  otpResponseCode: any = null;
  msgType: any | null = null;
  showActivation: boolean = false;
  otp: string = '';
  @ViewChild('otpForm') otpForm!: NgForm;
  sendOTP() {
    const request = {
      param1: this.responseData.param1, //this.deviceId,
      param3: this.responseData.param24, //this.mobileNo,
      param4: this.responseData.param12, //this.deviceDetails.param19 || '',
      param6: this.responseData.param24, //this.deviceDetails.param17 || '',
      param10: this.responseData.param14, //this.chassisNo,
      param11: this.responseData.param4 //this.imeiNo
    };
    this.vehicleService.sendActivationOtp(request).subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          this.otpResponseCode = response.statuscode;
          this.msgType = "success";
          this.errorMessage = 'OTP sent successfully';
          this.showActivation = true;
          this.otpTimerFlag = false
          this.start2MinCounter();
          setTimeout(() => {
            this.otp = "";
            this.otpForm.resetForm();
            this.msgType = null;
            this.errorMessage = null;
          }, 3000);
        }
      },
      error: (error) => {
        this.msgType = 'error';
        this.errorMessage = 'Error sending OTP';
      }
    }); 
  }
  BackToDetails() {
      this.receiptstatusflag = false;
      this.detailsflag = true;
      this.otpResponseCode = null;
      this.showActivation = false;
      this.isDataLoaded = false;
    
    }
  activateVehicle() {
    if (!this.otp || this.otp.length !== 6) {
      this.msgType = "error";
      this.errorMessage = 'Please enter valid OTP';
      return;
    }
    
    
    
    const request = {
      "param1": this.responseData.param1 ? this.responseData.param1 : '',//deviceid,
      "param2": this.otp,//otp,
      "param3": this.responseData.param24 ? this.responseData.param24 : '',//mobileno,
      "param4": this.responseData.param12 || '',//vehicleid
       "param6": "renewal",
    };

    
    this.vehicleService.activateVehicle(request).subscribe({
      next: (response) => {
        if (response.status && response.entity) {

          if (response.entity.includes('Successfully')) {
            this.msgType = "success";
            this.errorMessage = response.entity;
            this.router.navigate(['/getstatus']);
          }
        }
      },
      error: (error) => {
        this.msgType = "error";
        this.errorMessage = error;
      }
    });
  }

  isButtonEnabled(givenDate: string | Date): boolean {
    if (givenDate == undefined) {
      return true;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 2); // +2 months
    endDate.setHours(23, 59, 59, 999);

    const inputDate = new Date(givenDate);
    inputDate.setHours(0, 0, 0, 0);

    // Enable if inputDate is before today or within [today, endDate]
    return inputDate < today || (inputDate >= today && inputDate <= endDate);
  }
sendOtpBtnDisabled() {
  if(this.responseData.param25 == "Connected") {return false} else {return true};
}
updateSimValidity() {

    const deviceData = {
      param1: this.responseData.param6 ? this.responseData.param6 : '',   // device iccid no
      param2: this.responseData.param8 ? this.responseData.param8 : '',  // vendor name
      param3: this.responseData.param9 ? this.responseData.param9 : '',  // mgf code
      param4: this.responseData.param42 ? this.responseData.param42 : ''  // m2m code
    };

    
    this.dashboardService.updateSimValidity(deviceData).subscribe({
      next: (response) => {
        const message = response?.entity;

        if (message === 'Successfully saved' || message === 'Successfully updated') {
          this.msgType = "success";
        this.errorMessage = 'Sim Validity Updated Successfully';
          // this.validityFlag = true;
          this.refreshStatus();
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
  refreshStatus() {
    let paramValue = this.responseData.param5;
    this.getStatusService.getStatusDetails({ param1: paramValue, param10: '' }).pipe()
      .subscribe({
        next: (response) => {
          if (response.status && response.entity && Object.keys(response.entity).length > 0) {
          this.isDataLoaded = true;
          this.responseData = response.entity;
          //console.log('Response Data:', this.responseData);
          this.detailsflag = false;
          this.receiptstatusflag = true; 
          } else {
            this.detailsflag = true;
          this.receiptstatusflag = false; 
            this.isDataLoaded = false;
            this.errorMessage = 'No data found for the given search criteria.';
          }
        },
        error: (error) => {
          this.isDataLoaded = false;
          console.error('Error fetching status details:', error);
        }
      });
  }
  timerText: string = '02:00';
private intervalRef: any;

start2MinCounter() {
  let totalSeconds = 2 * 60; // 2 minutes
  this.otpTimerFlag = true;
  // clear old timer if running
  if (this.intervalRef) clearInterval(this.intervalRef);

  this.intervalRef = setInterval(() => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;

    this.timerText = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

    totalSeconds--;

    if (totalSeconds < 0) {
      this.otpTimerFlag = false;
      clearInterval(this.intervalRef);
      this.timerText = '00:00';
      //console.log('Timer finished');
    }
  }, 1000);
}

exportToExcel() {
  
  this.isExporting = true;

  const requestBody = {
    param1: this.searchBy,
    param2: "Old System Data",
    param3: "",
    param4: "",
    param5: "",
    param6: "",
    pdfexcel: this.selectedDownloadType === 'Excel' ? 'receipt_excel_old' : ''
  };

  this.vehicleService.getVehicleDetailsByType(requestBody)
    .subscribe({
      next: (response: any) => {

        this.isExporting = false;

        if (response?.status && response?.entity) {

          // ✅ Success Toast
          this.msgType = 'success';
          this.errorMessage = 'Excel generated successfully';

          window.open(response.entity, '_blank');

          // Auto hide toast after 3 sec
          setTimeout(() => {
            this.errorMessage = null;
            this.msgType = null;
          }, 3000);

        } else {

          this.msgType = 'error';
          this.errorMessage = 'Failed to generate Excel';

        }
      },

      error: () => {

        this.isExporting = false;

        this.msgType = 'error';
        this.errorMessage = 'Error exporting Excel';
      }
    });
}

onDownloadChange() {

  if (this.selectedDownloadType === 'Excel') {
    this.exportToExcel();
  }

  // Reset dropdown after action
  setTimeout(() => {
    this.selectedDownloadType = '';
  }, 300);
}


}

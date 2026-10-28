import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';// I'll assume getVehicleDetailsByType is added to VehicleService and returns an Observable<any>
import { GetStatusService, ReceiptStatusResponse } from '../../../core/services/get-status.service';
import { MapboxService } from '../../../core/services/mapbox.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ToastComponent } from '../../assets/inactive-assets/toast.component';
import { Subscription } from 'rxjs';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import moment from 'moment';
import { ChangeDetectorRef } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { NgSelectModule } from '@ng-select/ng-select';
import{UserService} from '../../../core/services/user.service';
import { LoaderService } from '../../../core/services/loader.service';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
// import { ToastService } from '../../../core/services/toast.service';
@Component({
    selector: 'app-report-generation-status',
    imports: [
        FormsModule,
        CommonModule,
        ToastComponent,
        NgxDaterangepickerMd, // ✅ REQUIRED,
        NgSelectModule,
        CommonTableComponent
    ],
    templateUrl: './report-generation-status.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './report-generation-status.component.scss'
})
export class ReportGenerationStatusComponent implements OnInit, OnDestroy {
  searchBy: string = "";
  responseData: ReceiptStatusResponse = new ReceiptStatusResponse();
  maxDate: any = moment().format('DD-MMM-YYYY'); // Set max date to today
  isDataLoaded: boolean = false;
  errorMessage: string | null = null;
  errorType: 'error' | 'success' = 'error';
  // New properties for the vehicle list table
  vehicleDetails: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'param1', label: 'Sr.No' },
    { key: 'param7', label: 'Vendor Name' },
    { key: 'param18', label: 'RTO Code' },
    { key: 'param11', headers: ['Vehcile.No', 'Chassis No.'] },
    { key: 'param5', headers: ['Device Sr.No.', 'IMEI.No', 'ICCID.No'] },
    { key: 'param28', label: 'Customer Details' },
    { key: 'param19', headers: ['Vehicle Type', 'Vehicle Class', 'MFG. Year'] },
    { key: 'param66', label: 'Installation Type' },
    { key: 'param43', label: 'Installation Date' },
    { key: 'param14', headers: ['Activation Status', 'Activation Date'] },
    { key: 'param64', label: 'Valid Upto' },
    { key: 'param80', headers: ['MVI Approval Status', 'Approved By', 'Approved On'], width: '170px' },
    { key: 'view', label: 'View' }
  ];
  isVehicleListLoaded: boolean = false;
  sortKey: string = '';
  reverse: boolean = false;
  task: any | null = sessionStorage.getItem('roleid'); // For conditional columns in the template, assuming it's a number.
  companyid: any | null = sessionStorage.getItem('ownersid');
  private noTrackDataSubscription: Subscription | undefined;
  pageSize: number = 20;
selectedPageSize: number | string = 20;

pageSizeOptions = [20, 50, 100, 200, 500];
  currentPage = 1;

  totalCount = 0;
  pageCount = 0;
  detailsflag: boolean = false;
  receiptstatusflag: boolean = false;
  searchText: string = '';
  alertType: string = 'New System Data';
 activationFilter: string = 'Activated';
  showMviDiv = false;
  mviFilter: string = 'All';
  downloadType: string = '';
  rtoList: any[]=[];
  vendorList: any[] = [];
vendorObj: any = null;
  rtoObj: any = null;
  constructor(
    private cd: ChangeDetectorRef,
    private getStatusService: GetStatusService,
    public mapBoxService: MapboxService,
    private vehicleService: VehicleService,
    public toastService: ToastService,
    public dashboardService: DashboardService,
    public userService: UserService,
    public loader: LoaderService
  ) {
    this.toastService.pageName = 'Receipt Generation Details (New)'; // Set page name for toast service
    this.isDataLoaded = false;
  }

  ngOnInit(): void {
    this.loadRTOList();
    this.loadVendorList();
    this.task = sessionStorage.getItem('roleid');
    // Subscribe to the event from MapboxService to know when to close the modal.
    this.noTrackDataSubscription = this.mapBoxService.noTrackData$.subscribe((message) => {
      this.getStatusService.closeModal('staticBackdrop');
      if (message) {
        this.errorMessage = message;
      }
    });
    this.getStatusOnInitDetails(1);
  }
  onChangeVendor() {
  this.currentPage = 1;
  this.getStatusOnInitDetails(this.currentPage);
}
loadVendorList() {
  const request = {};

  this.userService.getVendorListApi(
    request,
    this.task,
    sessionStorage.getItem('stateid')
  ).subscribe({
    next: (response: any) => {
      if (response.status) {
        this.vendorList = response.entity || [];
      }
    },
    error: (err) => {
      console.error('Vendor List Error', err);
    }
  });
}
  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks.
    this.noTrackDataSubscription?.unsubscribe();
  }

  loadRTOList() {
  this.dashboardService.getRTOList('').subscribe({
    next: (response) => {
      if (response.status && response.entity) {
        this.rtoList = response.entity;
      }
    },
    error: (error) => {
      console.error('Error loading RTO list:', error);
    }
  });
}
onChangeRTO() {
  this.vehicleDetails = [];
  this.totalCount = 0;
  this.pageCount = 0;
  this.pageSize = 20;
  this.getStatusOnInitDetails(1);
}
pageno=0
  getStatusOnInitDetails(pageNumber: number) {
    this.detailsflag = true;
    this.isVehicleListLoaded = false;
    const fromDate = this.selectedRange?.startDate
      ? this.selectedRange.startDate.format('YYYY-MM-DD')
      : '';

    const toDate = this.selectedRange?.endDate
      ? this.selectedRange.endDate.format('YYYY-MM-DD')
      : '';
this.pageno=1;
const requestBody = {
  param1: this.searchBy || '',
  param2: this.alertType,
  param3: String(pageNumber),
  param4: String(this.pageSize),
  param5: fromDate,
  param6: toDate,
  param7: this.companyid,
  param8: this.task,
  param9: this.vendorObj ? this.vendorObj.param1 : '',
  param10: this.rtoObj ? this.rtoObj.param1 : '',
  param11: '',
  param12: '',
  param13: '',
  param14: this.activationFilter,
  param15: this.mviFilter
};
    this.loader.show();
    this.vehicleService.getVehicleDetailsByType(requestBody).subscribe({
      next: (response: any) => {
        this.loader.show();
        if (response?.status && Array.isArray(response?.entity?.listData)) {
          this.vehicleDetails = response.entity.listData;
          this.totalCount = response.entity.param1 || 0;
          this.pageCount = this.vehicleDetails.length;
          this.detailsflag = true;
          this.receiptstatusflag = false;
          this.isVehicleListLoaded = true;
        } else {
          this.vehicleDetails = [];
          this.pageCount = 0;
          this.totalCount = 0;
          this.detailsflag = true;
          this.receiptstatusflag = false;
          this.errorMessage = 'No data found.';
          this.isVehicleListLoaded = true;
        }
      },
      error: (error) => {
        this.isVehicleListLoaded = true;
        this.vehicleDetails = [];
        this.errorMessage = 'Error fetching vehicle details.';
        console.error(error);
      }
    });
  }
  // selectedRange: any = undefined;
  //  selectedRange: any = null; 
  // 🔹 Date Range Picker Model
  selectedRange: any = {
    startDate: moment(),
    endDate: moment()
  };
  // activationFilter: string = 'Activated';
  applyFilters() {
    this.currentPage = 1;
    this.getStatusOnInitDetails(this.currentPage);
  }
  hasValidDateRange(): boolean {
    return (
      !!this.selectedRange?.startDate &&
      !!this.selectedRange?.endDate
    );
  }

  exportData() {
        const fromDate = this.selectedRange?.startDate
      ? this.selectedRange.startDate.format('YYYY-MM-DD')
      : '';

    const toDate = this.selectedRange?.endDate
      ? this.selectedRange.endDate.format('YYYY-MM-DD')
      : '';
    //console.log('downloadType:', this.downloadType);
    if (!this.downloadType) return;




    const requestBody = {
      param1: this.searchBy || '',
      param2: this.alertType,
    param3: String(this.pageno),
  param4: String(this.pageSize),
       param5: fromDate,
  param6: toDate,
  param7: this.companyid,
  param8: this.task,
  param9: this.vendorObj ? this.vendorObj.param1 : '',
  param10: this.rtoObj ? this.rtoObj.param1 : '',
      param11: "",
      param12: "",
      param13: "",
      param14: this.activationFilter,
      param15: this.mviFilter,
      pdfexcel: this.downloadType == 'Excel' ? 'receipt_excel_new' : 'receipt_pdf_new' // Assuming backend can handle this parameter to determine export format
    };

    this.vehicleService.getVehicleDetailsByType(requestBody).subscribe({
      next: (response: any) => {
        if (response?.entity) {
          const filePath = response.entity;
          window.open(filePath, '_blank');
        } else {
          this.errorMessage = 'Failed to export data.';
        }
      },
      error: (error) => {
        this.errorMessage = 'Error exporting data.';
        this.errorType = 'error';
        console.error(error);
      }
    });

  }

  onDateApply(event: any) {
    const start = event?.startDate || event?.picker?.startDate;
    const end = event?.endDate || event?.picker?.endDate;

    if (!start || !end) {
      this.selectedRange = {
        startDate: moment(),
        endDate: moment()
      };
      return;
    }

    this.selectedRange = { startDate: start, endDate: end };
    this.cd.detectChanges();

    this.currentPage = 1;
    this.getStatusOnInitDetails(this.currentPage);
  }



  getFromDate(): string {
    return this.selectedRange?.startDate
      ? moment(this.selectedRange.startDate).format('YYYY-MM-DD')
      : '';
  }

  getToDate(): string {
    return this.selectedRange?.endDate
      ? moment(this.selectedRange.endDate).format('YYYY-MM-DD')
      : '';
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
  this.alertType = 'New System Data';
  this.activationFilter = 'Activated';
  this.mviFilter = 'All';
  this.rtoObj = null;

  this.pageSize = 20;
  this.selectedPageSize = '20';
  this.currentPage = 1;

  this.getStatusOnInitDetails(1);
}

  onPageChange(page: number) {
    this.currentPage = page;
    this.getStatusOnInitDetails(this.currentPage);
  }

onPageSizeChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;

  if (value === 'ALL') {
    this.selectedPageSize = 'ALL';
    this.pageSize = this.totalCount;
  } else {
    this.selectedPageSize = Number(value);
    this.pageSize = Number(value);
  }

  this.currentPage = 1;
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


  onSearch(item: any) {

    let paramValue = item?.param5 || item;   // item object ho ya direct param5

    this.getStatusService.getStatusDetails({ param1: paramValue, param10: '' })
      .subscribe({
        next: (response) => {

          if (response.status && response.entity && Object.keys(response.entity).length > 0) {

            this.isDataLoaded = true;
            this.responseData = response.entity;
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

  BackToDetails() {
    this.detailsflag = true;
    this.receiptstatusflag = false;
  }

  openMapModal(serialNo: string) {
    this.toastService.openModal('staticBackdrop');
    // $('#staticBackdrop').modal('show');
    setTimeout(() => {
      this.mapBoxService.initializeMap('mapContainer');
      this.mapBoxService.liveVehicleTrack(serialNo);
    }, 500);
  }

  remarks: string = '';
  actionType: string = '';
  confirmAction() {
    // $('#remarkModal').modal('show');
      this.toastService.openModal('remarkModal');
    // this.approveReport();
    // Implement the logic to approve or reject the report based on user confirmation.
  }

  approveReport() {
    if (!this.responseData || !this.responseData.param12) {
      this.errorType = 'error';
      this.errorMessage = 'Cannot approve: Vehicle information is missing.';
      return;
    }
    //console.log('Approving report for vehicle ID (param12):', this.responseData.param12);

    // Remarks can be captured from a user input if needed.
    const remarks = this.remarks || "ok";

    const request = {
      param1: this.responseData.param12, // vehicleid
      param2: this.actionType, // status Approve - 1, Reject - 2
      param3: remarks
    };

    this.vehicleService.updateVehicleActivationStatus(request).subscribe({
      next: (response: any) => {
        if (response.status) {
          let msg = response?.entity;
          this.errorMessage = msg;
          this.toastService.closeModal('remarkModal');
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
    this.toastService.show('Vehicle information is missing.', 'error');
    return;
  }

  const vehicleId = this.responseData.param12;

  this.getStatusService.getReceiptPdfPath(vehicleId).subscribe({
    next: (response) => {

      if (
        response?.status &&
        typeof response.entity === 'string' &&
        response.entity.trim().toUpperCase() === 'NO DATA FOUND'
      ) {
        this.toastService.show('No Data Found', 'error');
        return;
      }

      if (
        response?.status &&
        typeof response.entity === 'string' &&
        response.entity.startsWith('http')
      ) {
        window.open(response.entity, '_blank');
        return;
      }

      this.toastService.show(
        response?.message || 'Failed to get PDF download link.',
        'error'
      );
    },

    error: (err) => {
      console.error('Error downloading report:', err);
      this.toastService.show(
        'An error occurred while trying to download the report.',
        'error'
      );
    }
  });
}
  clearSosAlert() {

    const alertId = this.responseData?.param50 || '10';
    const imeiNo = this.responseData?.param4;

    if (!alertId || !imeiNo) {
      this.errorType = 'error';
      this.errorMessage = 'AlertId or IMEI not found';
      return;
    }

    if (!confirm('Are you sure you want to clear SOS alert?')) {
      return;
    }

    this.getStatusService.clearMviSosAlert(alertId, imeiNo, 'Alert cleared')
      .subscribe({
        next: (res: any) => {

          if (res?.status) {

            this.errorType = 'success';
            this.errorMessage = 'SOS Alert cleared successfully';

            // 🔹 refresh details using same function
            this.onSearch(this.responseData?.param5);

          } else {

            this.errorType = 'error';
            this.errorMessage = res?.entity || 'Failed to clear SOS';
          }

        },
        error: (err) => {
          this.errorType = 'error';
          this.errorMessage = 'Error clearing SOS alert';
          console.error(err);
        }
      });
  }
getInstallationType(value: string): string {
  const val = value?.trim();

  switch (val) {
    case 'Renewal Payment':
      return 'Renewal';

    case 'Installed Payment':
      return 'Installation';

    default:
      return val || 'NA';
  }
}
  ChangeFilter(){
    if (this.activationFilter === 'Activated') {
      this.showMviDiv = true;
    }
    else if (this.activationFilter === 'Deactivated') {
      this.showMviDiv = false;
    }
      else if (this.activationFilter === 'Not Activated') {

      }
  }
}

import { ReportService } from './../../../core/services/report.service';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ToastService } from '../../../core/services/toast.service';
import dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import { PvtParseDataResponse } from '../../../core/model/response.model';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonTableColumn } from '../../../shared/components/common-table/common-table.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
declare var $: any;
@Component({
    selector: 'app-pvt-parsed-data',
    imports: [FormsModule, NgxDaterangepickerMd, CommonDataToolbarComponent, DataTableComponent, PaginationComponent],
    templateUrl: './pvt-parsed-data.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './pvt-parsed-data.component.scss'
})
export class PvtParsedDataComponent implements OnInit, AfterViewInit {
  readonly tableColumns: CommonTableColumn<PvtParseDataResponse>[] = [
    { key: 'column1', label: '#' },
    { key: 'column2', label: 'IMEI No.' },
    { key: 'column3', label: 'Alert Name' },
    { key: 'column4', label: 'Polling Time' },
    { key: 'column5', label: 'Speed(Km/hrs)' },
    { key: 'column6', label: 'Vehicle Direction' },
    { key: 'column7', label: 'GPS Status' }
  ];


  loading = false;
  filtersExpanded = true;
  showSummary = false;
deviceType: 'NEW' | 'OLD' = 'NEW'; // default NEW
  filterBy= '';

  selectedVendor = '';
  selectedRTO = '';
  selectedVehicle = '';
  selectedAlertType = '';
  selectedDateFilter = '';

  fromDate = '';
  toDate = '';
  fromTime = '00:00';
  toTime = '23:59';

  vendorList: any[] = [];
  rtoList: any[] = [];
  vehicleList: any[] = [];
  visibleVehicleList: any[] = [];
  vehicleLoading = false;
  isVehicleLoaded = false;
  vehicleLimit = 100;
  private vehicleRequestId = 0;
  alertTypeList: any[] = [];
  alertData: PvtParseDataResponse[] = [];
  roleId: string = '';
  packetcount: string = "";
  vehicleregno: string = "";
  customername: string = "";
  customermobileno: string = "";
  rtoname: string = "";
  vendorname: string = "";
  vehicleclassname: string = "";
  constructor(
    private toast: ToastService,
    private ReportService: ReportService,
    private alertService: AlertService,
    private dashboardService: DashboardService,
    private vehicleService: VehicleService,
    private cdr: ChangeDetectorRef
  ) {  
    this.toast.pageName = 'PVT Parsed Data'; // Set page name for toast service
    this.roleId = sessionStorage.getItem('roleid') || '';
  }

 ngOnInit() {
  this.loadAlertTypes();
  this.loadVendorList();
  this.filterBy = 'Vendor';
  const today = new Date();
  this.fromDate = this.formatDate(today);
  this.toDate = this.formatDate(today);
}
today: Dayjs = dayjs();

selectedDateRange = {
  startDate: dayjs().startOf('day'),
  endDate: dayjs().endOf('day')
};


onDateRangeChange(e: any) {
  if (!e?.startDate || !e?.endDate) return;

  const start = e.startDate.toDate();
  const end = e.endDate.toDate();

  this.fromDate = this.formatDate(start);
  this.toDate = this.formatDate(end);
}

clearFilters(): void {
  const today = new Date();

  this.filterBy = 'Vendor';
  this.selectedVendor = '';
  this.selectedRTO = '';
  this.resetVehicleList();
  this.selectedAlertType = '';
  this.selectedDateFilter = '';
  this.selectedDateRange = {
    startDate: dayjs().startOf('day'),
    endDate: dayjs().endOf('day')
  };
  this.fromDate = this.formatDate(today);
  this.toDate = this.fromDate;
  this.fromTime = '00:00';
  this.toTime = '23:59';
  this.searchText = '';
  this.alertData = [];
  this.showSummary = false;
  this.page = 1;
  this.totalPages = 0;
  this.pageCount = 0;
  this.totalCount = 0;
  this.packetcount = '';
  this.vehicleregno = '';
  this.customername = '';
  this.customermobileno = '';
  this.rtoname = '';
  this.vendorname = '';
  this.vehicleclassname = '';
}

  ngAfterViewInit() {
    
  }

  initializeDatePickers() {
    setTimeout(() => {
      $('#fromdate').datepicker({ autoclose: true, format: 'dd-M-yyyy' })
        .on('changeDate', (e: any) => this.fromDate = this.formatDate(e.date));

      $('#todate').datepicker({ autoclose: true, format: 'dd-M-yyyy' })
        .on('changeDate', (e: any) => this.toDate = this.formatDate(e.date));
    }, 200);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).replace(/ /g, '-');
  }

 onFilterByChange(type: 'Vendor' | 'RTO') {
  this.filterBy = type;

  // 🔥 RESET ALL FIELDS
  this.selectedVendor = '';
  this.selectedRTO = '';
  this.resetVehicleList();
  this.selectedAlertType = '';

  this.alertData = [];
  this.showSummary = false;

  // OPTIONAL: reset date/time if needed
  // this.fromDate = '';
  // this.toDate = '';

  // 🔄 LOAD NEW DATA
  if (type === 'Vendor') {
    this.loadVendorList();
  } else {
    this.loadRTOList();
  }
}

private resetVehicleList(): void {
  this.vehicleRequestId++;
  this.selectedVehicle = '';
  this.visibleVehicleList = [];
  this.vehicleLoading = false;
  this.isVehicleLoaded = false;
}

  loadVendorList() {
    this.dashboardService.getVendorList().subscribe(res => {
      if (res.status) this.vendorList = res.entity;
    });
  }

  loadRTOList() {
    this.dashboardService.getRTOList().subscribe(res => {
      if (res.status) this.rtoList = res.entity;
    });
  }

  loadAlertTypes() {
    this.alertService.getAlertTypeDetails().subscribe(res => {
      if (res.status) this.alertTypeList = res.entity;
    });
  }
onVendorChange() {
  this.resetVehicleList();
  if (this.selectedVendor) {
    this.loadVehicleList();
  }
}
onRTOChange() {
  this.resetVehicleList();
  if (this.selectedRTO) {
    this.loadVehicleList();
  }
}

private loadVehicleList(): void {
  const requestId = ++this.vehicleRequestId;
  this.vehicleLoading = true;

  const req = {
    selectvendorid: this.selectedVendor || '',
    selectroleid: '',
    routeid: '',
    poiid: '',
    selectcustomerid: '',
    vehicleclassid: '',
    searchtype: '',
    rtoid: this.selectedRTO || '',
    searchby: ''
  };

  this.vehicleService.getVehicleListV2(req).subscribe({
    next: (res: any) => {
      if (requestId !== this.vehicleRequestId) {
        return;
      }

      const data = Array.isArray(res?.entity) ? res.entity : [];
      this.visibleVehicleList = data.slice(0, this.vehicleLimit);
      this.isVehicleLoaded = true;
      this.vehicleLoading = false;

      if (data.length === 0) {
        this.toast.show('No vehicle found', 'error');
      }

      this.cdr.detectChanges();
    },
    error: () => {
      if (requestId !== this.vehicleRequestId) {
        return;
      }

      this.vehicleLoading = false;
      this.isVehicleLoaded = false;
      this.toast.show('Something went wrong', 'error');
    }
  });
}

page=1
totalPages = 0
getAlertOverview() {

  // 🔥 VALIDATIONS START

  if (this.filterBy === 'Vendor' && !this.selectedVendor) {
    this.toast.show('Please select vendor', 'error');
    return;
  }

  if (this.filterBy === 'RTO' && !this.selectedRTO) {
    this.toast.show('Please select RTO', 'error');
    return;
  }

  if (!this.selectedVehicle) {
    this.toast.show('Please select vehicle', 'error');
    return;
  }

  // if (!this.selectedAlertType) {
  //   this.toast.show('Please select alert type', 'error');
  //   return;
  // }

  if (!this.fromDate || !this.toDate) {
    this.toast.show('Please select date range', 'error');
    return;
  }

  // 🔥 VALIDATIONS END


  let companyId = '';

  if (this.filterBy === 'Vendor') {
    companyId = this.selectedVendor !== 'All' ? this.selectedVendor : '';
  }

  if (this.filterBy === 'RTO') {
    companyId = this.selectedRTO !== 'All' ? this.selectedRTO : '';
  }

  // 📅 Date format sync
  if (this.selectedDateRange?.startDate && this.selectedDateRange?.endDate) {
    this.fromDate = this.formatDate(this.selectedDateRange.startDate.toDate());
    this.toDate = this.formatDate(this.selectedDateRange.endDate.toDate());
  }

 const req = {
  param1: this.searchText || '',     // searchby

  param2: this.page,                      // pageno
  param3: this.pageSize,                  // itemperpage

  param4: this.fromDate,                  // fromdate
  param5: this.toDate,                    // todate

  param6: this.fromTime || '00:00:00',    // fromtime
  param7: this.toTime || '23:59:59',      // totime

  param8: this.selectedVehicle || '',          // vehicleid
  param9:  '',              // imeino
};

  this.loading = true;

 this.ReportService.getpsvreport(req).subscribe(res => {
  this.loading = false;

  const listData = res?.entity?.listData || [];
  const total = Number(res?.entity?.param1 || 0);
  const summary = res?.entity;

  this.totalCount = total;
  this.totalPages = Math.ceil(total / this.pageSize);
  this.packetcount = summary?.param1 || '';//packetcount
  this.vehicleregno = summary?.param2 || ''; //vehicleregno
  this.customername = summary?.param3 || ''; //customername
  this.customermobileno = summary?.param4 || ''; //customermobileno
  this.vehicleclassname = summary?.param5 || ''; //vehicleclassname
  this.vendorname = summary?.param6 || ''; //vendorname
  this.rtoname = summary?.param7 || ''; //rtoname


  // ❌ NO DATA
  if (!listData || listData.length === 0) {
    this.alertData = [];
    this.showSummary = false;
    this.toast.show('No data found', 'success');
    return;
  }

  // ✅ DATA FOUND
  this.alertData = listData;
  this.pageCount = listData.length;
  this.showSummary = true;
  this.packetcount = summary?.param1 || '';//packetcount
  this.vehicleregno = summary?.param2 || ''; //vehicleregno
  this.customername = summary?.param3 || ''; //customername
  this.customermobileno = summary?.param4 || ''; //customermobileno
  this.vehicleclassname = summary?.param5 || ''; //vehicleclassname
  this.vendorname = summary?.param6 || ''; //vendorname
  this.rtoname = summary?.param7 || ''; //rtoname

  this.cdr.detectChanges();

}, err => {
  this.loading = false;
  this.toast.show('Something went wrong', 'error');
});
}
// 🔍 search text
searchText = '';

// pagination
pageSize :number = 20;
pageCount = 0;
totalCount = 0;
pageSizeOptions = [10, 20, 50, 100];


// 🔎 SEARCH
getSearchDetails() {
  this.getAlertOverview();

  // agar backend search hai to yaha API call karo
  // abhi ke liye existing data filter example

  if (!this.searchText) {
    return this.getAlertOverview();
  }

  const text = this.searchText.toLowerCase();

  this.alertData = this.alertData.filter((item: any) =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(text)
    )
  );
 
}


// 🔄 RELOAD
reloadData() {
  this.searchText = '';
  this.getAlertOverview();
}


// 📄 PAGE SIZE CHANGE
onPageSizeChange(size: any) {

  if (size === 'All') {
    this.pageSize = this.totalCount;
  } else {
    this.pageSize = Number(size);
  }

  this.pageCount = Math.min(this.pageSize, this.totalCount);
}


eventPage = 1;
eventPageSize = 10;
eventTotal = 0;
eventTotalPages = 0;


showEventModal = false;
eventList: any[] = [];
filteredEventList: any[] = [];
eventSearch = '';
totalEventCount = 0;

filterEventData() {
  const text = this.eventSearch.toLowerCase();

  this.filteredEventList = this.eventList.filter(e =>
    Object.values(e).some(val =>
      String(val).toLowerCase().includes(text)
    )
  );
}
closeEventModal() {
  this.showEventModal = false;
}
selectedRow: any; // 🔥 store clicked row
onEventCountClick(d: any) {

  this.selectedRow = d; // ✅ store row
  this.eventPage = 1;   // ✅ reset page

  this.loadEventData();
}
loadEventData() {

  const request = {
    param1: '',
    param2: this.eventPage.toString(),
    param3: this.eventPageSize.toString(),

    param4: this.selectedVehicle,
    param5: this.selectedAlertType,

    param6: this.fromDate,
    param7: this.fromTime,
    param8: this.toTime,

    param9: '',
    param10: this.selectedVendor || this.selectedRTO,
    param11: this.toDate
  };

  this.loading = true;

  this.ReportService.getAlertActivityReport(request).subscribe({
    next: (res: any) => {
      this.loading = false;

      const data = res?.entity?.listData || [];

      this.eventList = data;
      this.filteredEventList = [...data];

      this.eventTotal = Number(res?.entity?.param1 || 0);

      // 🔥 TOTAL PAGES CALCULATION
      this.eventTotalPages = Math.ceil(this.eventTotal / this.eventPageSize);

      this.showEventModal = true;
    },
    error: () => {
      this.loading = false;
    }
  });
}
changeEventPage(page: number) {

  if (page < 1 || page > this.eventTotalPages) return;

  this.eventPage = page;

  this.loadEventData(); // 🔥 reload API
}


onEventPageSizeChange(size: any) {

  if (size === 'All') {
    this.eventPageSize = this.eventTotal;
  } else {
    this.eventPageSize = Number(size);
  }

  this.eventPage = 1;   // 🔥 reset page
  this.loadEventData(); // 🔄 reload API
}
changePage(p: number) {

  if (p < 1 || p > this.totalPages) return;

  this.page = p;

  this.getAlertOverview(); // 🔥 reload API
}
onPageSizeChanged(size: any) {

  if (size === 'All') {
    this.pageSize = this.totalCount;
  } else {
    this.pageSize = Number(size);
  }

  this.page = 1; // 🔥 reset page
  this.getAlertOverview(); // 🔄 reload
}


}

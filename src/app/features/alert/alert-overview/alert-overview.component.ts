import { ReportService } from './../../../core/services/report.service';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ToastService } from '../../../core/services/toast.service';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
import dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
declare var $: any;


@Component({
    selector: 'app-alert-overview',
    imports: [NgxDaterangepickerMd, FormsModule, CommonDataToolbarComponent, CommonTableComponent],
    templateUrl: './alert-overview.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./alert-overview.component.scss']
})
export class AlertOverviewComponent implements OnInit, AfterViewInit {

  loading = false;
  showSummary = false;
deviceType: 'NEW' | 'OLD' = 'NEW'; // default NEW
  filterBy= 'Vendor';

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
  alertTypeList: any[] = [];
  alertData: any[] = [];
  readonly tableColumns: CommonTableColumn<any>[] = [
    { key: 'index', label: '#' },
    { key: 'param5', label: 'Vehicle No.' },
    { key: 'param2', headers: ['IMEI No.', 'Serial No.'] },
    { key: 'param11', label: 'Customer Name' },
    { key: 'param7', label: 'RTO Name' },
    { key: 'param9', headers: ['Alert Name', 'Alert Date'] },
    { key: 'param14', label: 'Event Counts' }
  ];
roleId: string = '';
  constructor(
    private toast: ToastService,
    private ReportService: ReportService,
    private alertService: AlertService,
    private dashboardService: DashboardService,
    private vehicleService: VehicleService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef
  ) {
    this.toast.pageName = 'Alert Overview'; // Set page name for toast service  
    this.roleId = sessionStorage.getItem('roleid') || '';}

 ngOnInit() {
   this.filterBy = 'Vendor';
  this.loadAlertTypes();
  this.loadVendorList();
  const today = new Date();
  this.fromDate = this.formatDate(today);
  this.toDate = this.formatDate(today);
}
today: Dayjs = dayjs();

selectedDateRange = dayjs();
// {
//   startDate: dayjs().startOf('day'),
//   endDate: dayjs().endOf('day')
// };

onDateRangeChange(event: any): void {
    const selectedDate = event.startDate;
    console.log('Selected Date:', selectedDate.format('DD-MMM-YYYY'));
      this.fromDate = this.formatDate(selectedDate);
      this.toDate = this.formatDate(selectedDate);
  }
// onDateRangeChange(e: any) {
//   if (!e?.startDate || !e?.endDate) return;

//   const start = e.startDate.toDate();
//   const end = e.endDate.toDate();
//   console.log(start, end);
//   this.fromDate = this.formatDate(start);
//   this.toDate = this.formatDate(end);
// }
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
  this.selectedVehicle = '';
  this.selectedAlertType = '';

  this.vehicleSearch = '';

  this.fullVehicleList = [];
  this.visibleVehicleList = [];

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
  onVehicleSearchChange() {

  if (!this.vehicleSearch) {
    // 🔥 input empty → reset everything
    this.fullVehicleList = [];
    this.visibleVehicleList = [];
    this.selectedVehicle = '';
    this.isVehicleLoaded = false;
  }

}
onVendorChange() {
  this.selectedVehicle = '';
  this.vehicleSearch = '';
  this.fullVehicleList = [];
  this.visibleVehicleList = [];
  this.isVehicleLoaded = false;
}
searchVehicle() {

  if (!this.vehicleSearch) {
    this.toast.show('Please enter vehicle number', 'error');
    return;
  }

  if (!this.selectedVendor && !this.selectedRTO) {
    this.toast.show('Please select vendor or RTO', 'error');
    return;
  }

  const req = {
    selectvendorid: this.selectedVendor || '',
    selectroleid: '',
    routeid: '',
    poiid: '',
    selectcustomerid: '',
    vehicleclassid: '',
  //  searchtype: this.deviceType === 'NEW' ? 'TCP' : 'HTTP',
  searchtype:'',
    rtoid: this.selectedRTO || '',
    searchby: this.vehicleSearch
  };

  this.vehicleService.getVehicleListV2(req).subscribe(res => {

    const data = res?.entity || [];

    // ❌ NO DATA
    if (!data || data.length === 0) {

      this.fullVehicleList = [];
      this.visibleVehicleList = [];
      this.isVehicleLoaded = false;

      this.toast.show('No vehicle found', 'error');   // 🔥 DIRECT

      return;
    }

    // ✅ DATA FOUND
    this.fullVehicleList = data;
    this.visibleVehicleList = data.slice(0, this.vehicleLimit);
    this.isVehicleLoaded = true;

    this.toast.show('Vehicle loaded successfully', 'success'); // optional

    this.cdr.detectChanges();

  }, err => {

    this.toast.show('Something went wrong', 'error'); // 🔥 DIRECT
    this.isVehicleLoaded = false;

  });
}

  onRTOChange() {
 this.selectedVehicle = '';
  this.vehicleSearch = '';
  this.fullVehicleList = [];
  this.visibleVehicleList = [];
  this.isVehicleLoaded = false;
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

  if (!this.selectedAlertType) {
    this.toast.show('Please select alert type', 'error');
    return;
  }

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
  // if (this.selectedDateRange?.startDate && this.selectedDateRange?.endDate) {
  //   this.fromDate = this.formatDate(this.selectedDateRange.startDate.toDate());
  //   this.toDate = this.formatDate(this.selectedDateRange.endDate.toDate());
  // }

  const req = {
    param1: this.searchText,

param2: this.page.toString(),
    param3: this.pageSize,

    param4: this.fromDate,
    param5: this.fromTime || '00:00',
    param6: this.toTime || '23:59',

    param7: this.selectedVehicle,
    param8: this.selectedAlertType,

    param9: this.fromDate,

    param10: this.filterBy === 'Vendor' ? 'company' : 'rto',

    param11: this.selectedVendor || this.selectedRTO,
    pdfexcel: ""
  };

  this.loading = true;

  this.alertService.getAlertAnalysis(req).subscribe(res => {

       this.loading = false;

    const data = res?.entity?.listData || res?.entity || [];
const total = Number(res?.entity?.param1 || 0);


this.totalCount = total;

// ✅ FIRST assign data
this.alertData = data;

// ✅ THEN count
this.pageCount = this.alertData.length;

// ✅ pages
this.totalPages = Math.ceil(total / this.pageSize);

    // ❌ NO DATA

    if (!data || data.length === 0) {
      this.toast.show('No data found', 'success');
      this.showSummary = false;
      return;
    }

    // ✅ DATA FOUND
    this.alertData = data;
    this.showSummary = true;

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


fullVehicleList: any[] = [];
visibleVehicleList: any[] = [];

vehicleLimit = 100;   // 🔥 only 100 items render
vehicleSearch = '';


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


isVehicleLoaded = false;


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
downloadexcelmodel(event: any) {
  const value = event.target.value;

  if (value === 'excel') {
    this.exportToExcelmodel();
  }
}

onFormatChange(event: any) {
  const value = event.target.value;

  if (value === 'excel') {
    this.exportToExcel();
  }
}
exportToExcelmodel() {

  // 🔥 1. CHECK TABLE DATA FIRST
  if (!this.alertData || this.alertData.length === 0) {
    this.toast.show('No data available to export', 'error');
    return;
  }

  // 🔥 2. VALIDATIONS (same as your API)
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

  if (!this.selectedAlertType) {
    this.toast.show('Please select alert type', 'error');
    return;
  }

  if (!this.fromDate || !this.toDate) {
    this.toast.show('Please select date range', 'error');
    return;
  }

const vehicleObj = this.fullVehicleList.find(
  (v: any) => v.param1 === this.selectedVehicle
);

const alertObj = this.alertTypeList.find(
  (a: any) => a.param1 === this.selectedAlertType
);

const vendorObj = this.vendorList.find(
  (v: any) => v.param1 === (this.selectedVendor )
);
const rtoObj = this.rtoList.find(
  (v: any) => v.param1 === ( this.selectedRTO)
);


  // 🔥 4. REQUEST
  const request = {
    param1: this.searchText,
   
  param2: (this.showEventModal ? this.eventPage : this.page).toString(),
  param3: (this.showEventModal ? this.eventPageSize : this.pageSize).toString(),

    param4: this.selectedVehicle,
    param5: this.selectedAlertType,

    param6: this.fromDate,
    param7: this.fromTime,
    param8: this.toTime,

    param9: '',
    param10: this.selectedVendor || this.selectedRTO,
    param11: this.toDate,
vehicleno: vehicleObj?.param2 || '',
  alertname: alertObj?.param2 || '',
  vendorname: vendorObj?.param2 || rtoObj?.param2  , 
    pdfexcel: 'EXCEL'
  };

  // console.log('Excel Request:', request);

  this.loading = true;

  // 🔥 5. API CALL
  this.ReportService.  psv_get_historysignlevehiclealertdetailsexcel(request)
    .subscribe({
    next: (res: any) => {
  this.loading = false;

  // ✅ STRICT VALIDATION
  if (
    res &&
    res.status === true &&
    typeof res.entity === 'string' &&
    res.entity.startsWith('http')
  ) {
    const fileUrl = res.entity;

    // 🔥 DIRECT DOWNLOAD (NO CUSTOM DATA)
    const a = document.createElement('a');
    a.href = fileUrl;
    a.target = '_blank';
    a.download = ''; // 🔥 IMPORTANT: server filename use hone de
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    this.toast.show('Excel downloaded successfully', 'success');

  } else {
    // ❌ ANY OTHER RESPONSE = ERROR ONLY
    console.error('Invalid response:', res);
    this.toast.show('File download failed (Invalid server response)', 'error');
  }
},
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.toast.show('Excel download failed', 'error');
      }
    });
}
exportToExcel() {

  // 🔥 1. CHECK TABLE DATA FIRST
  if (!this.alertData || this.alertData.length === 0) {
    this.toast.show('No data available to export', 'error');
    return;
  }

  // 🔥 2. VALIDATIONS (same as your API)
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

  if (!this.selectedAlertType) {
    this.toast.show('Please select alert type', 'error');
    return;
  }

  if (!this.fromDate || !this.toDate) {
    this.toast.show('Please select date range', 'error');
    return;
  }

const vehicleObj = this.fullVehicleList.find(
  (v: any) => v.param1 === this.selectedVehicle
);

const alertObj = this.alertTypeList.find(
  (a: any) => a.param1 === this.selectedAlertType
);

const vendorObj = this.vendorList.find(
  (v: any) => v.param1 === (this.selectedVendor )
);
const rtoObj = this.rtoList.find(
  (v: any) => v.param1 === ( this.selectedRTO)
);


  // 🔥 4. REQUEST
  const request = {
    param1: this.searchText,
  param2: (this.showEventModal ? this.eventPage : this.page).toString(),
  param3: (this.showEventModal ? this.eventPageSize : this.pageSize).toString(),



    param4: this.fromDate,
    param5: this.fromTime || '00:00',
    param6: this.toTime || '23:59',

    param7: this.selectedVehicle,
    param8: this.selectedAlertType,

    param9: this.toDate,

    param10: this.filterBy === 'Vendor' ? 'company' : 'rto',

    param11: this.selectedVendor || this.selectedRTO,
vehicleno: vehicleObj?.param2 || '',
  alertname: alertObj?.param2 || '',
  vendorname: vendorObj?.param2 || rtoObj?.param2  , 
    pdfexcel: 'EXCEL'
  };

  // console.log('Excel Request:', request);

  this.loading = true;

  // 🔥 5. API CALL
  this.ReportService. psv_get_all_alert_datadetailsexcel(request)
    .subscribe({
    next: (res: any) => {
  this.loading = false;

  // ✅ STRICT VALIDATION
  if (
    res &&
    res.status === true &&
    typeof res.entity === 'string' &&
    res.entity.startsWith('http')
  ) {
    const fileUrl = res.entity;

    // 🔥 DIRECT DOWNLOAD (NO CUSTOM DATA)
    const a = document.createElement('a');
    a.href = fileUrl;
    a.target = '_blank';
    a.download = ''; // 🔥 IMPORTANT: server filename use hone de
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    this.toast.show('Excel downloaded successfully', 'success');

  } else {
    // ❌ ANY OTHER RESPONSE = ERROR ONLY
    console.error('Invalid response:', res);
    this.toast.show('File download failed (Invalid server response)', 'error');
  }
},
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.toast.show('Excel download failed', 'error');
      }
    });
}
}

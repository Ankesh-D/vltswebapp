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
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonTableColumn } from '../../../shared/components/common-table/common-table.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
declare var $: any;
@Component({
    selector: 'app-alert-activity-report',
    imports: [NgxDaterangepickerMd, FormsModule, CommonDataToolbarComponent, DataTableComponent, PaginationComponent],
    templateUrl: './alert-activity-report.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./alert-activity-report.component.scss']
})
export class AlertActivityReportComponent implements OnInit, AfterViewInit {
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'column1', label: '#' },
    { key: 'column2', label: 'IMEI No.' },
    { key: 'column3', label: 'Alert Type' },
    { key: 'column4', label: 'Polling Time' },
    { key: 'column5', label: 'Speed(Km/hrs)' },
    { key: 'column6', label: 'Ignition' },
    { key: 'column7', label: 'GPS Status' },
    { key: 'column8', headers: ['Latitude', 'Longitude'] }
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
  alertTypeList: any[] = [];
  alertData: any[] = [];
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
    this.toast.pageName = 'Alert Activity Report'; // Set page name for toast service
    this.roleId = sessionStorage.getItem('roleid') || '';
  }

 ngOnInit() {
  this.filterBy = 'Vendor';
  this.loadAlertTypes();
  this.loadVendorList();
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
  const today = dayjs();

  this.filterBy = 'Vendor';
  this.selectedVendor = '';
  this.selectedRTO = '';
  this.resetVehicleList();
  this.selectedAlertType = '';
  this.selectedDateFilter = '';
  this.selectedDateRange = {
    startDate: today.startOf('day'),
    endDate: today.endOf('day')
  };
  this.fromDate = this.formatDate(today.toDate());
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
  this.selectedVendor = '';
  this.selectedRTO = '';
  this.resetVehicleList();
  this.selectedAlertType = '';
  this.alertData = [];
  this.showSummary = false;
  this.page = 1;
  this.totalPages = 0;
  this.pageCount = 0;
  this.totalCount = 0;

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
  private resetVehicleList(): void {
    this.vehicleRequestId++;
    this.selectedVehicle = '';
    this.fullVehicleList = [];
    this.visibleVehicleList = [];
    this.vehicleLoading = false;
    this.isVehicleLoaded = false;
  }

  onVendorChange(): void {
    this.resetVehicleList();
    if (this.selectedVendor) {
      this.loadVehicleList();
    }
  }

  onRTOChange(): void {
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

        const entity = res?.entity?.listData ?? res?.entity;
        const data = Array.isArray(entity) ? entity : [];
        this.fullVehicleList = data;
        this.visibleVehicleList = data.slice(0, this.vehicleLimit);
        this.vehicleLoading = false;
        this.isVehicleLoaded = true;

        if (data.length === 0) {
          this.toast.show('No vehicle found', 'error');
        }

        this.cdr.detectChanges();
      },
      error: () => {
        if (requestId !== this.vehicleRequestId) {
          return;
        }

        this.fullVehicleList = [];
        this.visibleVehicleList = [];
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
  if (this.selectedDateRange?.startDate && this.selectedDateRange?.endDate) {
    this.fromDate = this.formatDate(this.selectedDateRange.startDate.toDate());
    this.toDate = this.formatDate(this.selectedDateRange.endDate.toDate());
  }

  const req = {
    param1: this.searchText,

param2: this.page.toString(),
    param3: this.pageSize.toString(),

    param4: this.selectedVehicle,
    param5:this.selectedAlertType,
    param6: this.fromDate,

    param7:  this.fromTime || '00:00',
    param8: this.toTime || '23:59',

    param9:    this.filterBy === 'Vendor' ? 'company' : 'rto',

    param10: this.selectedVendor || this.selectedRTO,

    param11:  this.toDate,
  };

  this.loading = true;

  this.ReportService.getAlertActivityReport(req).subscribe(res => {
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
vehicleLoading = false;
private vehicleRequestId = 0;
vehicleLimit = 100;


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
onFormatChange(event: any) {
  const value = event.target.value;

  if (value === 'excel') {
    this.exportToExcel();
  }
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
    param1: '',
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
  this.ReportService.psv_get_historysignlevehiclealertdetailsexcel(request)
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

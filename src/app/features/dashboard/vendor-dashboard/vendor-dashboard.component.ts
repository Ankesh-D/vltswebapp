import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DeviceService,AssetsDetailsRequest } from '../../../core/services/device.service';
import { BaseApiService } from '../../../core/services/base-api.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { DashboardService, CompanyWiseDevice, RTOWiseDevice } from '../../../core/services/dashboard.service';
declare var AmCharts: any;
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { DealerService } from '../../../core/services/dealer.service';
import { ToastService } from '../../../core/services/toast.service';

dayjs.extend(utc);
// import { Dayjs } from 'dayjs';
@Component({
    selector: 'app-vendor-dashboard',
    imports: [CommonModule, FormsModule, RouterModule, NgxDaterangepickerMd],
    templateUrl: './vendor-dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./vendor-dashboard.component.scss']
})
export class VendorDashboardComponent implements OnInit, OnDestroy {
  constructor(
    private dashboardService: DashboardService,
    private dealerService: DealerService,
    private toastService: ToastService,
    private deviceService: DeviceService, private cdr: ChangeDetectorRef
  ) {
    this.toastService.pageName = 'Vendor Dashboard';
  }
  private destroy$ = new Subject<void>();
  private baseApiService = inject(BaseApiService);
  private router = inject(Router);

  // Dashboard Counts
  all_installed = 0;
  all_devices = 0;
  sold = 0;
  approved_devices = 0;
  pending_devices = 0;
  vendor_dealer_count = 0;
  currentday_installed = 0;
  received = 0;
  notreceived = 0;
  neverreceived = 0;
  isTableLoading = false;
  // Panic Counts
  totalpanic = 0;
  before_panic_activation = 0;
  panic_activation = 0;

  // Data Lists
  vendorDetails: any[] = [];
  panicdetails: any[] = [];

  // UI State
  todaydate: Date = new Date();
  type: string = 'ACTIVATED';
  details_label: string = 'Activated Device';
  excelfilename: string = 'ActivatedDevice';
  searchdata: string = '';

  // Toolbar
  downloadType: string = '';

  // Pagination
  pageno = 1;
  pagesint = 20;
  total_count = 0;
  page_count = 0;

  // Sorting
  sortKey = '';
  reverse = false;

  // Chart
  chart: any = null;
alertInterval: any;

openPicker() {
  const el = document.getElementById('hiddenDateInput') as any;

  if (el) {
    el.focus(); // 🔥 important
    el.dispatchEvent(new Event('click')); // 🔥 trigger properly
  }
}
lockBackButton() {
  
  for (let i = 0; i < 100; i++) {
    history.pushState(null, '', location.href);
   
  }

 
  window.onpopstate = () => {
    history.pushState(null, '', location.href);
  };
}
ngOnInit(): void {

  this.lockBackButton(); 

  const today = dayjs();

  // ✅ ONLY TODAY (no yesterday)
  this.selectedRange = {
    startDate: today,
    endDate: today,
    fromDate: today.format('DD-MMM-YYYY'),
    toDate: today.format('DD-MMM-YYYY')
  };

  // ✅ API safe call
  this.getInstallationActivationCount(false);
  this.getAlerts(false);
  this.getDashboardCount(false);

  // this.alertInterval = setInterval(() => {
  //   this.getInstallationActivationCount(false);
  //   this.getAlerts(false);
  //   this.getDashboardCount(false);
  // }, 10000);
}

  ngOnDestroy(): void {

  if (this.alertInterval) {
    clearInterval(this.alertInterval);
  }

    this.destroy$.next();
    this.destroy$.complete();

    try {
      if (this.chart) {
        this.chart.clear();
        this.chart = null;
      }
    } catch (e) {
      //console.log('Chart destroy error:', e);
    }
  }
 Installation = 0;
 Activation = 0;
  // ✅ Vendor Dashboard Count
getDashboardCount(showLoader: boolean = true): void {
  this.baseApiService.apiCall('psv_get_vendor_dashboard_count', 'POST', {}, showLoader)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const entity = res?.entity;
          if (res?.status && entity) {
            this.all_installed = Number(entity.param5) || 0;
            this.all_devices = Number(entity.param3) || 0;
            this.sold = Number(entity.param4) || 0;
            this.approved_devices = Number(entity.param6) || 0;
            this.pending_devices = Number(entity.param7) || 0;
            this.vendor_dealer_count = Number(entity.param12) || 0;
            this.currentday_installed = Number(entity.param9) || 0;
            this.received = Number(entity.param13) || 0;
            this.notreceived = Number(entity.param16) || 0;
            this.neverreceived = Number(entity.param15) || 0;
// this.Installation = Number(entity.param9) || 0;
// this.Activation = Number(entity.param8) || 0;
            setTimeout(() => this.initChart(), 200);
            this.getPanicCounts(false);
          } else {
            this.resetDashboard();
          }
        },
        error: (err: any) => {
          console.error('Dashboard count error', err);
          this.resetDashboard();
        }
      });
  }

  resetDashboard(): void {
    this.all_installed = 0;
    this.all_devices = 0;
    this.sold = 0;
    this.approved_devices = 0;
    this.pending_devices = 0;
    this.vendor_dealer_count = 0;
    this.currentday_installed = 0;
    this.received = 0;
    this.notreceived = 0;
    this.neverreceived = 0;
    this.vendorDetails = [];
  }

  // ✅ Panic Count
  getPanicCounts(showLoader: boolean = true): void {
    this.baseApiService.apiCall('psv_get_vendor_panic_counts', 'POST', {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const entity = res?.entity;
          if (res?.status && entity) {
            this.totalpanic = Number(entity.param1) || 0;
            this.before_panic_activation = Number(entity.param2) || 0;
            this.panic_activation = Number(entity.param3) || 0;
          }
          // this.getDeviceDetails(1);
        },
        error: (err: any) => {
          console.error('Panic count error', err);
          // this.getDeviceDetails(1);
        }
      });
  }

  // ✅ Device Details Table
  getDeviceDetails(page: number): void {


  this.isTableLoading = true;        // ✅ START table loader
  this.pageno = page;

  const payload = {
    param1: this.searchdata,
    param2: this.type,
    param3: this.pageno,
    param4: this.pagesint,
    param9: "",
    param10: "",
    pdfexcel: "" // Add this if you want to support export functionality
  };

  this.baseApiService.apiCall('psv_get_vehicledetailsbytype', 'POST', payload)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: any) => {
        if (res?.statuscode === 200 && res?.entity) {
          this.vendorDetails = res.entity.listData || [];
          this.total_count = Number(res.entity.param1) || 0;
          this.page_count = this.vendorDetails.length;
        } else {
          this.vendorDetails = [];
          this.total_count = 0;
          this.page_count = 0;
        }
        this.isTableLoading = false;   // ✅ STOP loader
      },
      error: (err: any) => {
        console.error('Device details error', err);
        this.vendorDetails = [];
        this.isTableLoading = false;   // ✅ STOP loader
      }
    });
}


  // ✅ Toolbar Actions
  onSearch(): void {
    this.pageno = 1;
    this.getDeviceDetails(1);
  }

  onReload(): void {
    this.searchdata = '';
    this.pageno = 1;
    this.getDeviceDetails(1);
  }

  onRowsChange(): void {
    this.pageno = 1;
    this.getDeviceDetails(1);
  }

  onDownload(): void {
    // backend download logic if needed
    // currently just reset dropdown after selection
    //console.log("Download selected:", this.downloadType);
  }

  // ✅ Widget Click Filter
  filterDevices(type: string): void {
    this.type = type;
    this.searchdata = '';
    this.pageno = 1;

    switch (type) {
      case 'TotalDevice':
      case 'TOTALDEVICE':
        this.details_label = "Total Device";
        this.excelfilename = "TotalDevice";
        break;

      case 'ACTIVATED':
        this.details_label = "Activated Device";
        this.excelfilename = "ActivatedDevice";
        break;

      case 'PENDING':
        this.details_label = "Pending Device";
        this.excelfilename = "PendingDevice";
        break;

      case 'Installed':
        this.details_label = "Assets";
        this.excelfilename = "Assets";
        break;

      case 'TODAYINSTALLED':
        this.details_label = "Todays Installation Device";
        this.excelfilename = "TodaysInstallationDevice";
        break;

      case 'DownVehicles':
        this.details_label = "Inactive Assets";
        this.excelfilename = "InactiveAssetsDevice";
        break;

      default:
        this.details_label = type;
        this.excelfilename = type;
        break;
    }

    this.getDeviceDetails(1);
  }

  // ✅ Sorting
  sortingDetails(keyname: string): void {
    this.sortKey = keyname;
    this.reverse = !this.reverse;

    this.vendorDetails.sort((a, b) => {
      const valA = a?.[keyname] ?? '';
      const valB = b?.[keyname] ?? '';

      if (valA < valB) return this.reverse ? 1 : -1;
      if (valA > valB) return this.reverse ? -1 : 1;
      return 0;
    });
  }

  // ✅ Panic Details
  panicDetails(type: string): void {
    const payload = {
      param1: this.searchdata,
      param2: "NA",
      param3: "NA",
      param4: "Panic",
      param5: type
    };

    this.baseApiService.apiCall('psv_vigilant_alert_count_on_buzzer', 'POST', payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.panicdetails = res?.entity?.listData || [];
        },
        error: (err: any) => console.error('Panic details error', err)
      });
  }

  // ✅ Chart
  initChart(): void {
    if (typeof AmCharts === 'undefined') return;

    try {
      if (this.chart) {
        this.chart.clear();
        this.chart = null;
      }
    } catch (e) {}

    this.chart = AmCharts.makeChart("chart_status_for_polling", {
      theme: "none",
      hideCredits: true,
      orderByField: "value",
      type: "serial",
      startDuration: 1,
      dataProvider: [
        { title: "Received", short: "Recei...", value: this.received, color: "#046e64" },
        { title: "Not Received", short: "Not R...", value: this.notreceived, color: "#046e64" },
        { title: "Never Received", short: "Never...", value: this.neverreceived, color: "#046e64" }
      ],
      graphs: [{
        balloonText: "[[title]]: <b>[[value]]</b>",
        colorField: "color",
        fillAlphas: 0.85,
        lineAlpha: 0.1,
        type: "column",
        valueField: "value",
        fixedColumnWidth: 20,
        autoColor: true
      }],
      depth3D: 10,
      angle: 10,
      categoryField: "short",
      categoryAxis: {
        gridPosition: "start",
        axisAlpha: 0,
        gridAlpha: 0,
        labelRotation: 30
      },
      chartCursor: {
        categoryBalloonEnabled: true,
        cursorAlpha: 0,
        zoomable: false
      },
      export: { enabled: false }
    });

    this.chart.addListener("clickGraphItem", (event: any) => {
      const title = event?.item?.dataContext?.title || '';

      this.details_label = title + " Device";

      if (title === "Not Received") {
        this.type = "NotReceived";
        this.excelfilename = "NotReceivedDevice";
      } else if (title === "Never Received") {
        this.type = "NeverReceived";
        this.excelfilename = "NeverReceivedDevice";
      } else {
        this.type = "Received";
        this.excelfilename = "ReceivedDevice";
      }

      this.getDeviceDetails(1);
    });
  }

  // ✅ Pagination
  onPageChange(newPage: number): void {
    if (newPage >= 1) {
  this.getDeviceDetails(newPage);
}
  }
  //-------------------Date Filter Demo---------------------


alertsList: any[] = [];
alertSearch = '';
alertSort = 'highest';

get filteredAlerts(): any[] {
  const query = this.alertSearch.trim().toLowerCase();
  return this.alertsList.filter(item => String(item.param3 || '').toLowerCase().includes(query))
    .sort((a, b) => this.alertSort === 'name'
      ? String(a.param3).localeCompare(String(b.param3))
      : (Number(b.param4) || 0) - (Number(a.param4) || 0));
}

alertPercentage(value: unknown): number {
  const max = Math.max(0, ...this.alertsList.map(item => Number(item.param4) || 0));
  return max > 0 ? Math.max(0, Math.min(100, (Number(value) || 0) / max * 100)) : 0;
}

alertBarColor(name: string): string {
  const label = (name || '').toLowerCase();
  if (/battery/.test(label)) return '#4186d8';
  if (/ignition|entry/.test(label)) return '#199b6c';
  if (/rash|acceleration|speed/.test(label)) return '#dc941e';
  return '#d94b54';
}


getAlerts(showLoader: boolean = true): void {

  const payload = {
    param1: "",
    param2: "NA",
    param3: "NA",
    param4: ""
  };

  this.baseApiService.apiCall('psv_count_vigilant_alert_on_buzzer', 'POST', payload)
    .subscribe({
      next: (res: any) => {
        this.alertsList = res?.entity?.listData || [];
      },
      error: (err) => {
        console.error('Alerts API error', err);
        this.alertsList = [];
      }
    });
}
onAlertClick(item: any): void {

  this.details_label = item.param3 + ' Alert';

  const payload = {
    param1: "",
    param2: item.param2,  // alert type id
    param3: "",
    param4: "Alert"
  };

  this.isTableLoading = true;

  this.baseApiService.apiCall('psv_get_vehicledetailsbytype', 'POST', payload)
    .subscribe({
      next: (res: any) => {
        this.vendorDetails = res?.entity?.listData || [];
        this.total_count = this.vendorDetails.length;
        this.page_count = this.vendorDetails.length;
        this.isTableLoading = false;
      },
      error: () => {
        this.vendorDetails = [];
        this.isTableLoading = false;
      }
    });
}
// -----------demo---------------------


installationDate: string = '';
activationDate: string = '';
selectedDate: string = '';
selectedRange: any;
// selectedDate: string = '';
installationCount: number = 0;
activationCount: number = 0;

onInstallationDateChange(): void {
  //console.log('Installation date:', this.installationDate);

  // 🔥 Dummy logic (random data simulate)
  this.installationCount = Math.floor(Math.random() * 50);
}

onActivationDateChange(): void {
  //console.log('Activation date:', this.activationDate);

  // 🔥 Dummy logic
  this.activationCount = Math.floor(Math.random() * 50);
}
onDateChange(): void {
  //console.log('Selected Date:', this.selectedDate);

  // Dummy data (API ke jagah)
  this.installationCount = Math.floor(Math.random() * 50);
  this.activationCount = Math.floor(Math.random() * 50);
}
onDateRangeSelected(event: any): void {

  let fromDate: string;
  let toDate: string;

  if (event && event.startDate && event.endDate) {
    fromDate = event.startDate.format('DD-MMM-YYYY');
    toDate = event.endDate.format('DD-MMM-YYYY');
  } else {
    // ✅ fallback = TODAY
    const today = dayjs().format('DD-MMM-YYYY');
    fromDate = today;
    toDate = today;
  }

  this.selectedRange = {
    fromDate,
    toDate
  };

  this.getInstallationActivationCount();
}
getAlertIcon(name: string, index: number): string {

  const map: any = {
    'Over Speed': 'bx bx-tachometer',
    'Rash Turning': 'bx bx-refresh',
    'Harsh Braking': 'bx bx-stop-circle',
    'Harsh Acceleration': 'bx bx-up-arrow',
    'Geo-Fence Exit': 'bx bx-log-out',
    'Geo-Fence Entry': 'bx bx-log-in',
    'Tampered': 'bx bx-error',
    'Emergency Wire Tampered': 'bx bx-bell',
    'Tilt Alert': 'bx bx-rotate-right',
    'Main Battery Disconnect': 'bx bx-power-off'
  };

  // 🔥 fallback icons (different for each)
  const fallbackIcons = [
    'bx bx-bell',
    'bx bx-alarm',
    'bx bx-error-circle',
    'bx bx-time',
    'bx bx-notification'
  ];

  return map[name] || fallbackIcons[index % fallbackIcons.length];
}
getAlertColor(name: string, index: number): string {

  const map: any = {
    'Over Speed': '#ffb3b3',
    'Rash Turning': '#ffd699',
    'Harsh Braking': '#ff9999',
    'Harsh Acceleration': '#ffcc99',
    'Geo-Fence Exit': '#cce5ff',
    'Geo-Fence Entry': '#d4edda',
    'Tampered': '#f8d7da',
    'Emergency Wire Tampered': '#f5c6cb',
    'Tilt Alert': '#fff3cd'
  };

  const fallbackColors = [
    '#e3f2fd',
    '#fce4ec',
    '#e8f5e9',
    '#fff3e0',
    '#ede7f6'
  ];

  return map[name] || fallbackColors[index % fallbackColors.length];
}

  loading = false;
getAlertBg(name: string): string {

  const map: any = {
    'Over Speed': 'linear-gradient(135deg, #ffe5e5, #ffcccc)',
    'Rash Turning': 'linear-gradient(135deg, #fff0e0, #ffd9b3)',
    'Harsh Braking': 'linear-gradient(135deg, #ffe6e6, #ffb3b3)',
    'Harsh Acceleration': 'linear-gradient(135deg, #fff5e6, #ffcc99)',
    'Geo-Fence Exit': 'linear-gradient(135deg, #e6f2ff, #cce0ff)',
    'Geo-Fence Entry': 'linear-gradient(135deg, #e6fff2, #ccffe0)',
    'Tampered': 'linear-gradient(135deg, #ffe6e6, #ff9999)',
    'Emergency Wire Tampered': 'linear-gradient(135deg, #ffe6f0, #ffb3d9)',
    'Tilt Alert': 'linear-gradient(135deg, #fff9e6, #fff0b3)'
  };

  return map[name] || '#f5f5f5';
}
// ----------------------------------------------------------------
// sortKey: string = '';
//  reverse: boolean = false;
  sort(key: string) {
    if (this.sortKey === key) {
      this.reverse = !this.reverse;
    } else {
      this.sortKey = key;
      this.reverse = false;
    }
    this.cdr.detectChanges();
  }
  isExporting: boolean = false;
   pageSizeOptions = [20, 50, 100, 200, 500];
   onPageSizeChange(size: number) {
  this.pageSize = size;
  this.currentPage = 1;

  this.loadVehicleData(); // ✅ vehicleType lost नहीं होगा
}
loadVehicleData() {
  const request: AssetsDetailsRequest = {
    param1: this.searchText.trim(),
    param2: this.currentPage,
    param3: this.pageSize,
    param4: this.vehicleType, // ✅ हमेशा same रहेगा
    param5: '',
    param6: '',
    param7: ''
  };

  this.deviceService.getAssetsDetails(request).subscribe({
    next: (response) => {    
      if (response?.status) {                    
        this.vehicledet = response.entity.listData || [];
        this.totalCount = Number(response.entity.param1) || 0;
        this.pageCount = this.vehicledet.length;
        // this.pageCount = Math.ceil(this.totalCount / this.pageSize);
      }
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error("API Error:", error);
    }
  });
}

navigateToVehicle(type: string) {
  this.vehicleType = type;   // ✅ store filter
  this.currentPage = 1;

  this.showTrackModal = true;
  this.selectedVehicleNo = type;

  this.loadVehicleData(); // ✅ use common function
}
  vehicledet: Device[] = [];
    showTrackModal: boolean = false;
  totalCount = 0;
  pageCount = 0;
selectedDownloadType: string = '';
currentPage = 1;
  pageSize = 20;

  globtype: string = '';
  vehicleType: string = '';
    searchText = '';
      selectedVehicleNo: any;
    closeModal() {
  this.showTrackModal = false;

  // ✅ reset all modal related data
  this.vehicledet = [];
  this.totalCount = 0;
  this.pageCount = 0;

  // ✅ reset pagination
  this.currentPage = 1;
  this.pageSize = 20;

  


  // ✅ reset filters
  this.vehicleType = '';
  this.globtype = '';
  this.searchText = '';

  // ✅ reset selection
  this.selectedVehicleNo = null;

  this.cdr.detectChanges();
}
 getSearchDetails() {
    this.currentPage = 1;
    this.navigateToVehicle('');
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
//   onPageChange(page: number) {
//     if (page < 1) return;
//     const totalPages = this.getTotalPages();
//     if (this.totalCount > 0 && page > totalPages) return;
//     this.currentPage = page;
//  this.loadVehicleData();
//   }



getInstallationActivationCount(showLoader: boolean = true): void {

  const payload = {
    param1: this.selectedRange?.fromDate || dayjs().format('DD-MMM-YYYY'),
    param2: this.selectedRange?.toDate || dayjs().format('DD-MMM-YYYY')
  };

  this.baseApiService.apiCall('vehicleinstallactivatcount', 'POST', payload)
    .subscribe({
   next: (res: any) => {

  const data = res?.entity?.listData?.[0];

  this.Installation = Number(data?.param2) || 0;
  this.Activation = Number(data?.param3) || 0;

},
      error: (err: any) => {
        console.error('Install/Activation API error', err);
        this.Installation = 0;
        this.Activation = 0;
      }
    });
}

dealerList: any[] = [];
showDealerModal = false;
dealerLoading = false;

getDealerDetails() {

  const request = {
    param1: "",
    param2: "1",
    param3: "20",
    param4: ""
  };

  this.dealerLoading = true;

  this.dealerService.getDealerDetails(request).subscribe({
    next: (res: any) => {

      if (res?.status && res?.entity) {
        this.dealerList = res.entity.listData || [];
      } else {
        this.dealerList = [];
      }

      this.dealerLoading = false;
    },

    error: (err) => {
      console.error("Dealer API Error", err);
      this.dealerList = [];
      this.dealerLoading = false;
    }
  });
}
 onDownloadChange() {

    if (this.selectedDownloadType === 'Excel') {
      // this.exportToExcel();
    }

    // reset dropdown
    setTimeout(() => {
      this.selectedDownloadType = '';
    }, 300);
  }
    reloadData() {
    // if (this.timerFlag) {
    //   this.timeOut = setInterval(() => {
    //     // this.loadCompanyWiseDevices();
    //     // this.loadClasswiseAlerts();
    //     // this.loadRTOWiseDevices();
    //     // this.getDashboardCounts();
    //   }, 30000);
    }
    openDeviceModal(type: string) {
        if (type === 'Dealers') {
    this.showDealerModal = true;
    this.getDealerDetails();
    return;
  }

  this.vehicleType = type;     // store type
  this.currentPage = 1;

  this.showTrackModal = true;  // ✅ modal open

  this.loadVehicleData();  
  
  // ✅ data load inside modal
}closeDealerModal() {
  this.showDealerModal = false;
}
  }
export interface Device {
  param1: string;      // rowNumber
  param2?: string;     // Vehicle ID or other
  param3?: string;     // Device ID or other
  param4: string;      // IMEI No
  param5: string;      // Serial No
  param6: string;      // ICCID No
  param7: string;      // Vendor Name
  param8?: string;     // Dealer Name
  param11?: string;    // Vehicle/Chassis No
  param14?: string;    // Activation Date
  param18?: string;    // RTO Name
  param19?: string;    // Vehicle Type
  param26: string;     // Activation Status
  param28?: string;    // Customer Name
  param29?: string;    // Customer Mobile
  param43?: string;    // Installation Date
  param45?: string;    // Polling Status
  param56?: string;    // M2M Code
  param67?: string;    // Installation Date (alternative format)
  [key: string]: any;  // Additional properties for flexible response handling
}
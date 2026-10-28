import { addMapBasemapControl } from '../../../shared/components/map-layer-options/map-basemaps';
import { ReportService } from './../../../core/services/report.service';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService, SOSSessionReportReq, SOSSessionResponse } from '../../../core/services/alert.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ToastService } from '../../../core/services/toast.service';
import dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { Subject } from 'rxjs';
import moment from 'moment';
import { LoaderService } from '../../../core/services/loader.service';
import { RouteDeviationReportReq } from '../../../core/model/request.model';
import { RouteDeviationReportResp } from '../../../core/model/response.model';
import { RouteService } from '../../../core/services/route.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import * as L from 'leaflet';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;

@Component({
    selector: 'app-route-deviation-report',
    imports: [CommonModule, FormsModule, NgxDaterangepickerMd, NgSelectModule, TimepickerModule, NgbPaginationModule, CommonDataToolbarComponent, CommonTableComponent],
    templateUrl: './route-deviation-report.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './route-deviation-report.component.scss'
})
export class RouteDeviationReportComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'column1', label: '#' },
    { key: 'column2', label: 'Vehicle No.' },
    { key: 'column3', headers: ['IMEI No.', 'Serial No.'] },
    { key: 'column4', headers: ['Permit Holder', 'Mobile No.'] },
    { key: 'column5', label: 'Route Name' },
    { key: 'column6', label: 'Deviation Start Time' },
    { key: 'column7', label: 'Deviation End Time' },
    { key: 'column8', label: 'Duration' },
    { key: 'column9', label: 'Status' },
    { key: 'column10', label: 'Track' }
  ];

  today: Dayjs = dayjs();
  selectedDateRange = {
    startDate: dayjs().startOf('month').toDate(),
    endDate: dayjs().endOf('month').toDate()
  };
  locale = {
    format: 'DD-MMM-YYYY'
  };
  loading = false;
  showSummary = false;
  deviceType: 'NEW' | 'OLD' = 'NEW'; // default NEW
  filterBy = 'Vendor';

  selectedVendor: any = null;
  selectedRTO: any = null;
  selectedVehicle: any = null;
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
  alertData: RouteDeviationReportResp[] = [];
  roleId: string = '';
  formReq: RouteDeviationReportReq = new RouteDeviationReportReq();
  // Search/Request objects (Mocking CommonRequest)
  routedetailsReq = {
    searchParameter: '',
    pageNo: 1,
    itemPerPage: 20
  };
  routeData: any[] = [];
  searchInput = new Subject<string>();
  filteredOptions: any[] = [];
  loadingVehicle: boolean = false;
  showPoliceStations = true;
  private policeStationMarkers: L.Marker[] = [];

  constructor(
    private toast: ToastService,
    private ReportService: ReportService,
    private alertService: AlertService,
    private dashboardService: DashboardService,
    private vehicleService: VehicleService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    public loader: LoaderService, private routeService: RouteService,
  ) { this.roleId = sessionStorage.getItem('roleid') || ''; }


  ngOnInit() {
    this.initializeDatePicker();
    this.filterBy = 'Vendor';
    this.loadAlertTypes();
    this.loadVendorList();
    // this.fromDate = this.formatDate(this.selectedDateRange.startDate);
    // this.toDate = this.formatDate(this.selectedDateRange.endDate);

    this.searchInput.subscribe((value: string) => {
      const vehicleSearch = String(value || '').trim();

      if (vehicleSearch.length < 4) {
        this.loadingVehicle = false;
        this.fullVehicleList = [];
        this.visibleVehicleList = [{ param1: 'All', param2: 'All' }];
        return;
      }

      if (!this.selectedVendor && !this.selectedRTO) {
        this.loadingVehicle = false;
        return;
      }

      const req = {
        selectvendorid: this.selectedVendor || '',
        selectroleid: '',
        routeid: '',
        poiid: '',
        selectcustomerid: '',
        vehicleclassid: '',
        searchtype: '',
        rtoid: this.selectedRTO || '',
        searchby: vehicleSearch
      };

      this.loadingVehicle = true;
      this.vehicleService.getVehicleListV2(req).subscribe({
        next: (res: any) => {
          const vehicles = Array.isArray(res?.entity)
            ? res.entity
            : (res?.entity?.listData || []);
          this.fullVehicleList = vehicles;
          this.visibleVehicleList = [
            { param1: 'All', param2: 'All' },
            ...vehicles
          ];
          this.loadingVehicle = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.fullVehicleList = [];
          this.visibleVehicleList = [{ param1: 'All', param2: 'All' }];
          this.loadingVehicle = false;
        }
      });
    });
  }
  initializeDatePicker() {
    // this.selectedDate = moment().format('DD-MMM-YYYY');

    $(() => {
      const $dateInput = $('input[name="date"]');

      $dateInput.daterangepicker({
        singleDatePicker: false,
        showDropdowns: true,
        autoApply: true,
        timePicker: false,
        startDate: moment().subtract(6, 'days'),
        endDate: moment(),
        maxDate: moment(),
        minYear: moment().subtract(2, 'year').year(),
        maxYear: moment(),
        opens: 'center',
        drops: 'down',
        locale: {
          format: 'DD-MMM-YYYY'
        }
      });

      // On date selection
      $dateInput.on('apply.daterangepicker', (ev: any, picker: any) => {

      });

      // On picker close
      $dateInput.on('hide.daterangepicker', (ev: any, picker: any) => {
      });
    });
  }


  // {
  //   startDate: dayjs().startOf('day'),
  //   endDate: dayjs().endOf('day')
  // };

  onDateRangeChange(e: any) {
    if (!e?.startDate || !e?.endDate) return;

    const start = e.startDate.toDate();
    const end = e.endDate.toDate();

    this.fromDate = this.formatDate(start);
    this.toDate = this.formatDate(end);
  }

  formatDate(date: Date): string {
    return moment(date).format('DD-MMM-YYYY');
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

  onFilterByChange(type: 'Vendor' | 'RTO') {
    this.filterBy = type;

    // 🔥 RESET ALL FIELDS
    this.selectedVendor = null;
    this.selectedRTO = null;
    this.selectedVehicle = null;
    this.selectedAlertType = '';

    this.vehicleSearch = '';

    this.fullVehicleList = [];
    this.visibleVehicleList = [{ param1: 'All', param2: 'All' }];

    this.alertData = [];
    this.showSummary = false;
    this.pageCount = 0;
    this.totalCount = 0;
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
      this.visibleVehicleList = [{ param1: 'All', param2: 'All' }];
      this.selectedVehicle = null;
      this.isVehicleLoaded = false;
    }

  }
  onVendorChange() {
    this.selectedVehicle = null;
    this.vehicleSearch = '';
    this.fullVehicleList = [];
    this.visibleVehicleList = [{ param1: 'All', param2: 'All' }];
    this.isVehicleLoaded = false;
    // Vehicle list is loaded only after the user enters at least four digits.
  }
  searchVehicle() {

    // if (!this.vehicleSearch) {
    //   this.toast.show('Please enter vehicle number', 'error');
    //   return;
    // }

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
      searchtype: '',
      rtoid: this.selectedRTO || '',
      searchby: this.vehicleSearch
    };

    this.vehicleService.getVehicleListV2(req).subscribe(res => {

      const data = res?.entity || [];

      // ❌ NO DATA
      if (!data || data.length === 0) {

        this.fullVehicleList = [];
        this.visibleVehicleList = [{ param1: 'All', param2: 'All' }];
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
    this.selectedVehicle = null;
    this.vehicleSearch = '';
    this.fullVehicleList = [];
    this.visibleVehicleList = [{ param1: 'All', param2: 'All' }];
    this.isVehicleLoaded = false;
    // this.searchVehicle()
  }
  customSearchFn(term: string, item: any): boolean {
    return item.param2
      ?.toLowerCase()
      .includes(term.toLowerCase());
  }

  page = 1
  totalPages = 0
  getAlertOverview() {
    let daterange = $('#datepicker').val().split(" - ")
    this.formReq.param4 = daterange[0];
    this.formReq.param5 = daterange[1];
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

    // if (!this.fromDate || !this.toDate) {
    //   this.toast.show('Please select date range', 'error');
    //   return;
    // }

    // 🔥 VALIDATIONS END


    let companyId = '';

    if (this.filterBy === 'Vendor') {
      companyId = this.selectedVendor !== 'All' ? this.selectedVendor : '';
    }

    if (this.filterBy === 'RTO') {
      companyId = this.selectedRTO !== 'All' ? this.selectedRTO : '';
    }
    this.formReq.param1 = this.searchText;
    this.formReq.param2 = this.page;
    this.formReq.param3 = this.pageSize;
    // this.formReq.param4 = this.fromDate;
    // this.formReq.param5 = this.toDate;
    this.formReq.param6 = this.fromTime || '00:00';
    this.formReq.param7 = this.toTime || '23:59';
    // this.formReq.param10 = this.selectedRTO ? this.selectedRTO : ""; //rtoid
    // this.formReq.param11 = ''; //classid
    this.formReq.param8 = this.selectedVehicle ? this.selectedVehicle : '';
    // this.formReq.vendoridlist = this.selectedVendor ? [this.selectedVendor] : [];
    this.formReq.pdfexcel = '';

    // this.formReq ={"param1":"","param2":1,"param3":20,"param4":"01-Jun-2026","param5":"10-Jun-2026","param6":"00:00","param7":"23:59","vehicleidlist":["All"],"vendoridlist":["30011"],"param10":"","param11":"","pdfexcel":""}
    this.loading = true;
    this.loader.show();
    this.alertService.getRouteDeviationReport(this.formReq).subscribe(
      {

        next: (res: any) => {
          if (res.statuscode == 200) {
            this.loading = false;
            this.alertData = res?.entity?.listData || res?.entity || [];
            const total = Number(res?.entity?.param1 || 0);
            this.totalCount = total;
            this.pageCount = this.alertData.length;
            // ✅ pages
            this.totalPages = Math.ceil(total / this.pageSize);
          } else {
            this.toast.show('No data found', 'error');
            this.alertData = [];
            this.totalCount = 0;
            this.pageCount = 0;
            this.totalPages = 0;
          }
          this.cdr.detectChanges();

        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          this.toast.show('Something went wrong', 'error');
        }
      });
  }
  // 🔍 search text
  searchText = '';

  // pagination
  pageSize: number = 20;
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
  visibleVehicleList: any[] = [{ param1: 'All', param2: 'All' }];

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

    const request =
    {
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

    // if (!this.fromDate || !this.toDate) {
    //   this.toast.show('Please select date range', 'error');
    //   return;
    // }

    const vehicleObj = this.fullVehicleList.find(
      (v: any) => v.param1 === this.selectedVehicle
    );

    const alertObj = this.alertTypeList.find(
      (a: any) => a.param1 === this.selectedAlertType
    );

    const vendorObj = this.vendorList.find(
      (v: any) => v.param1 === (this.selectedVendor)
    );
    const rtoObj = this.rtoList.find(
      (v: any) => v.param1 === (this.selectedRTO)
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
      vendorname: vendorObj?.param2 || rtoObj?.param2,
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
  exportToExcel() {

    // 🔥 1. CHECK TABLE DATA FIRST
    // if (!this.alertData || this.alertData.length === 0) {
    //   this.toast.show('No data available to export', 'error');
    //   return;
    // }

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

    // if (!this.selectedAlertType) {
    //   this.toast.show('Please select alert type', 'error');
    //   return;
    // }

    // if (!this.fromDate || !this.toDate) {
    //   this.toast.show('Please select date range', 'error');
    //   return;
    // }


    this.loading = true;

    // 🔥 5. API CALL
    this.formReq.param2 = "";
    this.formReq.param3 = "";
    this.formReq.pdfexcel = "EXCEL";
    this.alertService.getRouteDeviationReport(this.formReq).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.statuscode == 200) {
          this.toast.commonFileDownload(response.entity);
        } else {
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
  selectedVehicleNo: string = "";
  private mapView?: L.Map;
  // Keep the assigned route and travelled tracks on independent layers.
  private routeLayer?: L.Polyline;
  private deviationLayer?: L.Polyline;
  private trackingRouteLayer?: L.Polyline;
  private directionLayer?: L.LayerGroup;
  private deviationDirectionLayer?: L.LayerGroup;
  private baseRouteDirectionLayer?: L.LayerGroup;
  private historyEndpointLayer?: L.LayerGroup;
  private liveAlertLayer?: L.LayerGroup;
  private historyAlertLayer?: L.LayerGroup;
  private liveAlertKeys = new Set<string>();
  private vehicleMarker?: L.Marker;
  private liveRouteLayer?: L.Polyline;
  private liveTimer?: ReturnType<typeof setInterval>;
  private liveRequestPending = false;
  private animationFrame?: number;
  private playbackTimer?: ReturnType<typeof setTimeout>;
  selectedDeviation: any;
  panelOpen = false;
  panelCollapsed = false;
  activeTrackingTab: 'live' | 'history' = 'live';
  historyDate: any = dayjs();
  historyFromTime = new Date(new Date().setHours(0, 0, 0, 0));
  historyToTime = new Date(new Date().setHours(23, 59, 0, 0));
  historyPathCoordinates: [number, number][] = [];
  historyDataList: any[] = [];
  historyPlaybackIndex = 0;
  isHistoryPlaying = false;
  speedSliderValue = 5;
  trackingData: any = { vehicleno: '', speed: 0, time: null, ignition: 'Off', lat: 0, lng: 0 };
  private readonly alertIconMappings: Record<string, string> = {
    overspeed: 'overspeed_new.png', impact: 'emergency.png', 'main battery reconnect': 'batterycharge.png',
    'power disconnect': 'powerDisconnect.png', 'ignition on': 'ignitionOn.png', 'ignition off': 'ignitionOff.png',
    'harsh acceleration': 'harshacceleration_new.png', 'harsh brake': 'harshbrake_new.png', 'geofence entry': 'geofenceentry.png',
    'geofence exit': 'geofenceexit.png', panic: 'panic.png', 'low battery': 'batterylow.png',
    'route deviation': 'routedev3.png', tamper: 'tamper.png', tilt: 'tilt.png', default: 'others.png'
  };

  viewMapModal(d: any) {
    this.selectedVehicleNo = d?.param5 || '-';
    this.selectedDeviation = d;
    this.panelOpen = false;
    this.stopTracking();
    $("#mapviewModal").modal('show');
    setTimeout(() => {
      this.ensureMap();
      this.clearMapTracks();
      this.getRouteDetails(d?.param15 || '');
      this.plotDeviationTrack(d);
    }, 200);
  }

  closeModal() {
    this.stopTracking();
    $("#mapviewModal").modal('hide');
  }

  ngOnDestroy(): void {
    this.stopTracking();
    this.mapView?.remove();
  }

  private ensureMap(): void {
    const container = document.getElementById('routeDeviationMap');
    if (!container) return;
    if (!this.mapView) {
      this.mapView = L.map(container, { zoomControl: true, attributionControl: false }).setView([22.5726, 88.3639], 14);
      addMapBasemapControl(this.mapView, 'leaflet');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.mapView);
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('Power by DIMTS')
        .addTo(this.mapView);
    }
    this.mapView.invalidateSize();
    // Leaflet's initial load can fire during setView(), so load these directly.
    this.loadPoliceStations();
  }

  private loadPoliceStations(): void {
    this.clearPoliceStationMarkers();
    if (!this.showPoliceStations) return;

    this.alertService.getPoliceStationDetails({ param1: '', param2: 1, param3: 20 }).subscribe({
      next: (response: any) => {
        const stations = response?.entity?.listData;
        const mapView = this.mapView;
        if (!mapView || !this.showPoliceStations || !Array.isArray(stations)) return;

        mapView.setZoom(Math.max(mapView.getZoom(), 14));

        stations.forEach((station: any) => {
          const lat = Number(station?.param9); const lng = Number(station?.param10);
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
          const icon = L.icon({
            iconUrl: 'assets/mapimages/police-station.png',
            iconSize: [24, 24],
            iconAnchor: [27, 27],
            popupAnchor: [0, -30]
          });
          const marker = L.marker([lat, lng], { icon })
            .bindPopup(this.createPoliceStationPopup(station, lat, lng), {
              className: 'police-station-popup',
              maxWidth: 235
            })
            .addTo(mapView);
          this.policeStationMarkers.push(marker);
        });
      },
      error: () => { /* Alert map remains usable if police station API fails. */ }
    });
  }

  private createPoliceStationPopup(station: any, lat: number, lng: number): HTMLElement {
    const root = document.createElement('div'); root.className = 'police-popup-card';
    const header = document.createElement('div'); header.className = 'police-popup-card__header';
    const image = document.createElement('img'); image.src = 'assets/mapimages/police-station.png'; image.alt = 'Police station';
    const heading = document.createElement('div'); const title = document.createElement('strong'); const type = document.createElement('small');
    title.textContent = String(station?.param2 || 'Police Station'); type.textContent = String(station?.param3 || 'Police Station');
    heading.append(title, type); header.append(image, heading); root.append(header);
    const body = document.createElement('div'); body.className = 'police-popup-card__body';
    [['District', station?.param7 || '-'], ['State', station?.param8 || '-'], ['Location', `${lat.toFixed(5)}, ${lng.toFixed(5)}`]].forEach(([label, value]) => {
      const row = document.createElement('div'), key = document.createElement('span'), val = document.createElement('b'); key.textContent = String(label); val.textContent = String(value); row.append(key, val); body.append(row);
    });
    const link = document.createElement('a'); link.target = '_blank'; link.rel = 'noopener noreferrer';
    const stationName = String(station?.param2 || 'Police Station');
    const googleMapsQuery = `${stationName} Police Station, ${lat},${lng}`;
    link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleMapsQuery)}`;
    link.title = `Show ${stationName} on Google Maps`;
    link.textContent = 'Locate Police Station'; body.append(link); root.append(body); return root;
  }

  private clearPoliceStationMarkers(): void {
    this.policeStationMarkers.forEach(marker => marker.remove());
    this.policeStationMarkers = [];
  }

  private splitDateTime(value: any): { date: string; time: string } {
    const parsed = moment(value, ['DD-MMM-YYYY hh:mm A', 'DD-MMM-YYYY HH:mm:ss', 'DD-MMM-YYYY HH:mm', moment.ISO_8601], true);
    const safe = parsed.isValid() ? parsed : moment(value);
    return { date: safe.isValid() ? safe.format('DD-MMM-YYYY') : moment().format('DD-MMM-YYYY'), time: safe.isValid() ? safe.format('hh:mm A') : '12:00 AM' };
  }

  private plotDeviationTrack(row: any): void {
    const start = this.splitDateTime(row?.param9);
    const end = this.splitDateTime(row?.param10);
    this.loading = true;
    this.vehicleService.getVehicleHistory({ param1: this.selectedVehicleNo, param2: start.date, param3: start.time, param4: end.time })
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          if (this.panelOpen) return;
          const points = this.validHistoryPoints(res?.entity?.listData || res?.entity || []);
          if (points.length < 2) {
            this.toast.show('No route data found in deviation time range.', 'error');
            this.plotCurrentVehicle();
            return;
          }
          this.drawDeviationTrack(points);
        },
        error: () => {
          this.loading = false;
          this.toast.show('Route Deviation not loaded.', 'error');
          this.plotCurrentVehicle();
        }
      });
  }

  private plotCurrentVehicle(): void {
    this.vehicleService.getLiveTrack(this.selectedVehicleNo, false).subscribe({
      next: (res: any) => {
        if (this.panelOpen) return;
        const item = res?.entity?.listData?.[0] || res?.entity?.[0] || res?.entity;
        const lat = Number(item?.param38 ?? item?.param4 ?? item?.latitude ?? item?.lat);
        const lng = Number(item?.param39 ?? item?.param5 ?? item?.longitude ?? item?.lng);
        if (item && Number.isFinite(lat) && Number.isFinite(lng)) this.setVehicle(item);
      }
    });
  }

  private clearMapTracks(): void {
    if (!this.mapView) return;
    [this.routeLayer, this.deviationLayer, this.trackingRouteLayer, this.liveRouteLayer]
      .filter((layer): layer is L.Polyline => !!layer)
      .forEach(layer => this.mapView!.removeLayer(layer));
    this.routeLayer = undefined;
    this.deviationLayer = undefined;
    this.trackingRouteLayer = undefined;
    this.liveRouteLayer = undefined;
    this.directionLayer?.clearLayers();
    this.deviationDirectionLayer?.clearLayers();
    this.baseRouteDirectionLayer?.clearLayers();
    this.historyEndpointLayer?.clearLayers();
    this.liveAlertLayer?.clearLayers(); this.historyAlertLayer?.clearLayers(); this.liveAlertKeys.clear();
    if (this.vehicleMarker) this.mapView.removeLayer(this.vehicleMarker);
    this.vehicleMarker = undefined;
  }

  private drawDeviationTrack(points: any[]): void {
    if (!this.mapView) return;
    if (this.deviationLayer) this.mapView.removeLayer(this.deviationLayer);
    this.deviationDirectionLayer?.clearLayers();
    const latLngs = points.map(p => this.pointLatLng(p));
    this.deviationLayer = L.polyline(latLngs, {
      color: '#0b58b9', weight: 6, opacity: .96, lineJoin: 'round', lineCap: 'round'
    }).addTo(this.mapView);
    this.deviationLayer.bringToFront();
    this.deviationDirectionLayer = this.deviationDirectionLayer || L.layerGroup().addTo(this.mapView);
    this.addDirectionArrows(latLngs, this.deviationDirectionLayer, true);
    this.setVehicle(points[points.length - 1]);
    this.fitAllRouteBounds();
  }

  private validHistoryPoints(list: any[]): any[] {
    return (Array.isArray(list) ? list : []).filter(p => {
      const lat = Number(p?.param4 ?? p?.latitude ?? p?.lat);
      const lng = Number(p?.param5 ?? p?.longitude ?? p?.lng);
      return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0);
    });
  }

  private pointLatLng(item: any): L.LatLngExpression {
    // Live-track uses param38/param39; history uses param4/param5.
    return [
      Number(item?.param38 ?? item?.latitude ?? item?.lat ?? item?.param4),
      Number(item?.param39 ?? item?.longitude ?? item?.lng ?? item?.param5)
    ];
  }

  private drawTrack(points: any[], color: string, deviation = false): void {
    if (!this.mapView) return;
    if (this.trackingRouteLayer) this.mapView.removeLayer(this.trackingRouteLayer);
    this.directionLayer?.clearLayers();
    const latLngs = points.map(p => this.pointLatLng(p));
    this.trackingRouteLayer = L.polyline(latLngs, { color, weight: deviation ? 6 : 4, opacity: .92, lineJoin: 'round', lineCap: 'round' }).addTo(this.mapView);
    this.directionLayer = this.directionLayer || L.layerGroup().addTo(this.mapView);
    this.addDirectionArrows(latLngs, this.directionLayer);
    this.setVehicle(points[points.length - 1]);
    this.fitAllRouteBounds();
  }

  private addDirectionArrows(latLngs: L.LatLngExpression[], layer: L.LayerGroup, isDeviation = false): void {
    for (let i = 0; i < latLngs.length - 1; i += Math.max(1, Math.floor(latLngs.length / 12))) {
      const a = L.latLng(latLngs[i]); const b = L.latLng(latLngs[Math.min(i + 1, latLngs.length - 1)]);
      const bearing = Math.atan2(b.lng - a.lng, b.lat - a.lat) * 180 / Math.PI;
      L.marker(a, {
        interactive: false,
        icon: this.createReferenceArrowIcon(bearing),
        zIndexOffset: isDeviation ? 900 : 500
      }).addTo(layer);
    }
  }

  private fitAllRouteBounds(): void {
    if (!this.mapView) return;
    const layers = [this.routeLayer, this.deviationLayer, this.trackingRouteLayer].filter(
      (layer): layer is L.Polyline => !!layer && layer.getLatLngs().length > 0
    );
    if (!layers.length) return;
    const bounds = L.latLngBounds([]);
    layers.forEach(layer => bounds.extend(layer.getBounds()));
    if (bounds.isValid()) this.mapView.fitBounds(bounds, { padding: [35, 35] });
  }

  private setVehicle(item: any): void {
    if (!this.mapView) return;
    this.updateTrackingData(item);
    const icon = L.divIcon({
      className: 'live-vehicle-marker-div',
      html: `<div class="live-vehicle-marker tracking-car" style="background-image:url('assets/mapimages/car/green.png')"></div>`,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -21]
    });
    if (this.vehicleMarker) this.mapView.removeLayer(this.vehicleMarker);
    this.vehicleMarker = L.marker(this.pointLatLng(item), { icon, zIndexOffset: 1000 }).addTo(this.mapView);
    this.bindVehiclePopup();
  }

  private bindVehiclePopup(): void {
    if (!this.vehicleMarker) return;
    const d = this.trackingData;
    const lat = Number.isFinite(Number(d.lat)) ? Number(d.lat).toFixed(6) : '-';
    const lng = Number.isFinite(Number(d.lng)) ? Number(d.lng).toFixed(6) : '-';
    const ignitionText = this.escapeHtml(d.ignition || 'Off');
    const ignitionClass = d.ignition === 'On' ? 'is-on' : 'is-off';

    this.vehicleMarker.bindPopup(`
      <div class="deviation-vehicle-popup">
        <header class="deviation-popup-header">
          <span class="deviation-popup-badge"><i class="fa fa-random"></i></span>
          <div class="deviation-popup-title">
            <strong>${this.escapeHtml(d.vehicleno || this.selectedVehicleNo)}</strong>
            <small>Route deviation vehicle</small>
          </div>
          <span class="deviation-popup-speed">${Number(d.speed || 0)} km/h</span>
        </header>
        <div class="deviation-popup-body">
          <div class="deviation-popup-row">
            <i class="fa fa-barcode"></i>
            <span>IMEI</span>
            <b>${this.escapeHtml(this.selectedDeviation?.param3 || d.imei || '-')}</b>
          </div>
          <div class="deviation-popup-row">
            <i class="fa fa-bolt"></i>
            <span>Ignition</span>
            <b class="${ignitionClass}">${ignitionText}</b>
          </div>
          <div class="deviation-popup-row">
            <i class="fa fa-clock-o"></i>
            <span>Time</span>
            <b>${this.escapeHtml(String(d.time || '-'))}</b>
          </div>
          <div class="deviation-popup-row deviation-popup-row--coord">
            <i class="fa fa-map-marker"></i>
            <span>Lat/Lng</span>
            <b>${lat}, ${lng}</b>
          </div>
        </div>
        <footer class="deviation-popup-actions">
          <button type="button" id="deviationLiveBtn" class="deviation-popup-btn deviation-popup-btn--live">
            <i class="fa fa-location-arrow"></i>
            <span>Live Track</span>
          </button>
          <button type="button" id="deviationHistoryBtn" class="deviation-popup-btn deviation-popup-btn--history">
            <i class="fa fa-history"></i>
            <span>History</span>
          </button>
        </footer>
      </div>`,
      { minWidth: 245, maxWidth: 265, className: 'route-deviation-popup' }
    );
    this.vehicleMarker.off('popupopen').on('popupopen', () => setTimeout(() => {
      document.getElementById('deviationLiveBtn')?.addEventListener('click', () => this.openTrackingPanel('live'));
      document.getElementById('deviationHistoryBtn')?.addEventListener('click', () => this.openTrackingPanel('history'));
    }));
  }

  openTrackingPanel(tab: 'live' | 'history'): void {
    this.stopLiveTimer();
    this.stopHistory();
    this.clearTrackingModeLayers();
    this.panelOpen = true; this.panelCollapsed = false; this.activeTrackingTab = tab;
    this.vehicleMarker?.closePopup();
    if (tab === 'live') this.startLiveTracking();
    this.cdr.detectChanges();
  }

  /** Clears every plotted overlay so the selected tracking mode is shown alone. */
  private clearTrackingModeLayers(): void {
    if (!this.mapView) return;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = undefined;
    if (this.liveRouteLayer) this.mapView.removeLayer(this.liveRouteLayer);
    if (this.trackingRouteLayer) this.mapView.removeLayer(this.trackingRouteLayer);
    if (this.routeLayer) this.mapView.removeLayer(this.routeLayer);
    if (this.deviationLayer) this.mapView.removeLayer(this.deviationLayer);
    this.liveRouteLayer = undefined;
    this.trackingRouteLayer = undefined;
    this.routeLayer = undefined;
    this.deviationLayer = undefined;
    this.directionLayer?.clearLayers();
    this.deviationDirectionLayer?.clearLayers();
    this.baseRouteDirectionLayer?.clearLayers();
    this.historyEndpointLayer?.clearLayers();
    this.liveAlertLayer?.clearLayers(); this.historyAlertLayer?.clearLayers(); this.liveAlertKeys.clear();
    if (this.vehicleMarker) this.mapView.removeLayer(this.vehicleMarker);
    this.vehicleMarker = undefined;
    this.historyDataList = [];
    this.historyPathCoordinates = [];
    this.historyPlaybackIndex = 0;
    this.isHistoryPlaying = false;
  }

  startLiveTracking(): void {
    this.stopLiveTimer();
    const refresh = () => {
      if (this.liveRequestPending) return;
      this.liveRequestPending = true;
      this.vehicleService.getLiveTrack(this.selectedVehicleNo, false).subscribe({
        next: (res: any) => {
          this.liveRequestPending = false;
          if (this.activeTrackingTab !== 'live' || !this.panelOpen) return;
          const item = res?.entity?.listData?.[0] || res?.entity?.[0] || res?.entity;
          if (item) this.moveVehicleSmoothly(item, 4800, () => this.plotLiveAlert(item));
        },
        error: () => { this.liveRequestPending = false; }
      });
    };
    refresh(); this.liveTimer = setInterval(refresh, 5000);
  }

  private moveVehicleSmoothly(item: any, duration: number, onArrive?: () => void): void {
    if (!this.mapView || !this.vehicleMarker) {
      this.setVehicle(item);
      this.mapView?.flyTo(this.pointLatLng(item), 14);
      onArrive?.();
      return;
    }
    const from = this.vehicleMarker.getLatLng(); const to = L.latLng(this.pointLatLng(item));
    if (!Number.isFinite(to.lat) || !Number.isFinite(to.lng) || Math.abs(to.lat) > 90 || Math.abs(to.lng) > 180 || (to.lat === 0 && to.lng === 0)) return;
    // A stationary GPS packet should update panel/popup without restarting animation.
    if (Math.abs(from.lat - to.lat) < 0.0000001 && Math.abs(from.lng - to.lng) < 0.0000001) {
      this.updateTrackingData(item);
      this.bindVehiclePopup();
      this.cdr.detectChanges();
      onArrive?.(); return;
    }
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    const startAt = performance.now();
    const bearing = Math.atan2(to.lng - from.lng, to.lat - from.lat) * 180 / Math.PI;
    const el = this.vehicleMarker.getElement()?.querySelector('.tracking-car') as HTMLElement;
    if (el) el.style.transform = `rotate(${bearing}deg)`;
    const animate = (now: number) => {
      const t = Math.min((now - startAt) / duration, 1); const eased = t * t * (3 - 2 * t);
      const pos = L.latLng(from.lat + (to.lat - from.lat) * eased, from.lng + (to.lng - from.lng) * eased);
      this.vehicleMarker?.setLatLng(pos);
      if (this.activeTrackingTab === 'live') {
        if (!this.liveRouteLayer) this.liveRouteLayer = L.polyline([from], { color: '#009C4E', weight: 4, lineJoin: 'round', lineCap: 'round' }).addTo(this.mapView!);
        this.liveRouteLayer.addLatLng(pos);
      }
      if (t < 1) this.animationFrame = requestAnimationFrame(animate); else { this.updateTrackingData(item); this.bindVehiclePopup(); this.cdr.detectChanges(); onArrive?.(); }
    };
    this.animationFrame = requestAnimationFrame(animate);
  }

  private getAlertIcon(name: string): string { const value = name.toLowerCase(); const key = Object.keys(this.alertIconMappings).find(k => k !== 'default' && value.includes(k)) || 'default'; return `assets/mapimages/alertimage/${this.alertIconMappings[key]}`; }
  private plotLiveAlert(item: any): void { const id = String(item?.param47 || '').trim(), name = String(item?.param48 || '').trim(); if (!id || id === '01' || !name || name.toLowerCase() === 'na') return; const point = L.latLng(this.pointLatLng(item)), key = `${id}|${item?.param35 || ''}|${point.lat}|${point.lng}`; if (this.liveAlertKeys.has(key)) return; this.liveAlertKeys.add(key); this.liveAlertLayer = this.liveAlertLayer || L.layerGroup().addTo(this.mapView!); const icon = L.icon({ iconUrl: this.getAlertIcon(name), iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -18] }); L.marker(point, { icon, zIndexOffset: 1200 }).bindPopup(this.createAlertPopup(name, this.selectedVehicleNo, item?.param35, item?.param40, point.lat, point.lng)).addTo(this.liveAlertLayer); }
  private renderHistoryAlerts(points: any[]): void { if (!this.mapView) return; this.historyAlertLayer = this.historyAlertLayer || L.layerGroup().addTo(this.mapView); this.historyAlertLayer.clearLayers(); points.forEach(item => { const id = String(item?.param12 || '').trim(), name = String(item?.param13 || '').trim(); if (!id || id === '01' || !name || name.toLowerCase() === 'na') return; const point = L.latLng(this.pointLatLng(item)), icon = L.icon({ iconUrl: this.getAlertIcon(name), iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -18] }); L.marker(point, { icon, zIndexOffset: 900 }).bindPopup(this.createAlertPopup(name, this.selectedVehicleNo, item?.param3, item?.param6, point.lat, point.lng)).addTo(this.historyAlertLayer!); }); }
  private createAlertPopup(name: any, vehicle: any, time: any, speed: any, lat: number, lng: number): HTMLElement { const root = document.createElement('div'); root.className = 'compact-alert-card'; const header = document.createElement('div'); header.className = 'compact-alert-card__header'; const badge = document.createElement('span'); badge.className = 'compact-alert-card__badge'; badge.textContent = '!'; const title = document.createElement('strong'); title.textContent = String(name || 'Alert'); header.append(badge, title); root.append(header); const body = document.createElement('div'); body.className = 'compact-alert-card__body';[['Vehicle', vehicle || '-'], ['Speed', `${Number(speed || 0)} km/h`], ['Time', time || '-'], ['Location', `${lat.toFixed(5)}, ${lng.toFixed(5)}`]].forEach(([label, value]) => { const row = document.createElement('div'), k = document.createElement('span'), v = document.createElement('b'); k.textContent = String(label); v.textContent = String(value); row.append(k, v); body.append(row); }); root.append(body); return root; }

  private updateTrackingData(item: any): void {
    this.trackingData = { ...this.trackingData, vehicleno: item?.param13 || item?.param15 || item?.vehicleno || this.selectedVehicleNo, imei: item?.param4 || item?.imei, speed: Number(item?.param40 ?? item?.param6 ?? item?.speed ?? 0), time: item?.param35 || item?.param3 || item?.pollingdate || item?.time, ignition: String(item?.param45 ?? item?.param12 ?? item?.ignition) === '1' ? 'On' : 'Off', lat: Number(item?.param38 ?? item?.param4 ?? item?.latitude ?? item?.lat), lng: Number(item?.param39 ?? item?.param5 ?? item?.longitude ?? item?.lng) };
  }

  /** Same vehicle-class/status icon selection used by Map Tracking New. */
  private getVehicleIconUrl(item: any): string {
    const vehicleClass = String(item?.vehicleclassname || item?.vehicleClassName || this.selectedDeviation?.vehicleclassname || '').toLowerCase();
    const speed = Number(item?.param40 ?? item?.param8 ?? item?.param6 ?? item?.speed ?? 0);
    let ignitionOn = item?.param45 === '1' || item?.param12 === '1' || item?.ignitionstatus === '1' || String(item?.ignitionstatus || '').toLowerCase() === 'on';
    if (speed > 0) ignitionOn = true;
    if (vehicleClass.includes('ambulance')) return 'assets/mapimages/NewVehiles/ambulance.png';
    if (vehicleClass.includes('goodscarrier')) return 'assets/mapimages/NewVehiles/goodscarrier-.png';
    if (vehicleClass.includes('motorcab')) return 'assets/mapimages/NewVehiles/motorcab.png';
    if (vehicleClass.includes('police')) return 'assets/mapimages/NewVehiles/police.png';
    if (vehicleClass.includes('privatecar')) return 'assets/mapimages/NewVehiles/privatecar.png';
    if (vehicleClass.includes('schoolbus')) return 'assets/mapimages/NewVehiles/schoolbus-.png';
    return ignitionOn
      ? (speed > 0 ? 'assets/mapimages/car/green.png' : 'assets/mapimages/car/yellow.png')
      : 'assets/mapimages/car/red.png';
  }

  /** Map Tracking New navigation-arrow shape, colored for the assigned route. */
  private createModernArrowIcon(heading: number, color = '#2563eb'): L.DivIcon {
    return L.divIcon({
      className: 'modern-vts-arrow',
      html: `<div style="transform:rotate(${heading}deg);width:22px;height:22px;position:relative;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))"><div style="position:absolute;inset:0;background:white;clip-path:polygon(50% 0%,100% 100%,50% 78%,0% 100%)"></div><div style="position:absolute;inset:2.5px;background:${color};clip-path:polygon(50% 0%,100% 100%,50% 78%,0% 100%)"></div></div>`,
      iconSize: L.point(22, 22),
      iconAnchor: L.point(11, 11)
    });
  }

  /** Leaflet equivalent of the white Mapbox route arrow with dark-green halo. */
  private createReferenceArrowIcon(heading: number): L.DivIcon {
    return L.divIcon({
      className: 'reference-route-arrow',
      html: `<span style="transform:rotate(${heading - 90}deg)">➤</span>`,
      iconSize: L.point(22, 22),
      iconAnchor: L.point(11, 11)
    });
  }

  private renderHistoryEndpoints(points: any[]): void {
    if (!this.mapView || !points.length) return;
    this.historyEndpointLayer = this.historyEndpointLayer || L.layerGroup().addTo(this.mapView);
    this.historyEndpointLayer.clearLayers();
    const addEndpoint = (item: any, type: 'start' | 'end') => {
      const title = type === 'start' ? 'Start Point' : 'End Point';
      const iconUrl = type === 'start' ? 'assets/mapimages/startpointroute.png' : 'assets/mapimages/endpointroute.png';
      const icon = L.icon({ iconUrl, iconSize: [35, 35], iconAnchor: [17, 35], popupAnchor: [0, -34] });
      L.marker(this.pointLatLng(item), { icon, zIndexOffset: 1100 })
        .bindPopup(`<b>${title}</b><br>${this.escapeHtml(this.selectedVehicleNo)}`)
        .addTo(this.historyEndpointLayer!);
    };
    addEndpoint(points[0], 'start');
    addEndpoint(points[points.length - 1], 'end');
  }

  private renderBaseRouteArrows(latLngs: L.LatLng[]): void {
    if (!this.mapView || latLngs.length < 2) return;
    this.baseRouteDirectionLayer = this.baseRouteDirectionLayer || L.layerGroup().addTo(this.mapView);
    this.baseRouteDirectionLayer.clearLayers();
    const stride = Math.max(1, Math.floor(latLngs.length / 18));
    for (let i = 1; i < latLngs.length; i += stride) {
      const previous = latLngs[Math.max(0, i - 1)];
      const current = latLngs[i];
      const heading = Math.atan2(current.lng - previous.lng, current.lat - previous.lat) * 180 / Math.PI;
      L.marker(current, { interactive: false, icon: this.createReferenceArrowIcon(heading) })
        .addTo(this.baseRouteDirectionLayer);
    }
  }

  showHistoryTrack(): void {
    this.stopLiveTimer(); this.stopHistory(); this.clearTrackingModeLayers(); this.activeTrackingTab = 'history';
    const date = (this.historyDate?.startDate || this.historyDate) ? moment(this.historyDate.startDate || this.historyDate).format('DD-MMM-YYYY') : moment().format('DD-MMM-YYYY');
    this.vehicleService.getVehicleHistory({ param1: this.selectedVehicleNo, param2: date, param3: moment(this.historyFromTime).format('hh:mm A'), param4: moment(this.historyToTime).format('hh:mm A') }).subscribe({
      next: (res: any) => {
        if (this.activeTrackingTab !== 'history' || !this.panelOpen) return;
        this.historyDataList = this.validHistoryPoints(res?.entity?.listData || res?.entity || []);
        this.historyPathCoordinates = this.historyDataList.map(p => this.pointLatLng(p) as [number, number]);
        if (this.historyDataList.length < 2) { this.toast.show('No history data found for selected time.', 'error'); return; }
        this.historyPlaybackIndex = 0;
        this.drawTrack(this.historyDataList, 'orange');
        this.setVehicle(this.historyDataList[0]);
        this.renderHistoryEndpoints(this.historyDataList);
        this.renderHistoryAlerts(this.historyDataList);
        this.cdr.detectChanges();
      }
    });
  }

  playHistory(): void { if (this.isHistoryPlaying || this.historyDataList.length < 2) return; this.isHistoryPlaying = true; this.playNextHistoryPoint(); }
  private playNextHistoryPoint(): void { if (!this.isHistoryPlaying || this.historyPlaybackIndex >= this.historyDataList.length - 1) { this.isHistoryPlaying = false; return; } this.historyPlaybackIndex++; this.moveVehicleSmoothly(this.historyDataList[this.historyPlaybackIndex], Math.max(150, 2200 / this.speedSliderValue)); this.playbackTimer = setTimeout(() => this.playNextHistoryPoint(), Math.max(180, 2300 / this.speedSliderValue)); }
  restartHistory(): void { this.stopHistory(); this.historyPlaybackIndex = 0; if (this.historyDataList[0]) { this.setVehicle(this.historyDataList[0]); this.playHistory(); } }
  stopHistory(): void { this.isHistoryPlaying = false; if (this.animationFrame) cancelAnimationFrame(this.animationFrame); if (this.playbackTimer) clearTimeout(this.playbackTimer); }
  onSpeedChange(_: Event): void { this.speedSliderValue = Number(this.speedSliderValue); }
  private stopLiveTimer(): void { if (this.liveTimer) clearInterval(this.liveTimer); this.liveTimer = undefined; this.liveRequestPending = false; }
  stopTracking(): void { this.stopLiveTimer(); this.stopHistory(); }

  private escapeHtml(value: any): string {
    const element = document.createElement('div');
    element.textContent = String(value ?? '');
    return element.innerHTML;
  }

  getRouteDetails(routeId: string = '') {
    this.loading = true;
    const req = {
      param1: '',
      param2: '1',
      param3: '20',
      param5: routeId
    };
    this.routeService.getRouteDetails(req).subscribe({
      next: (res: any) => {
        this.loading = false;
        if ((res?.status || res?.statuscode === 200) && res?.entity) {
          this.routeData = res.entity.listData || [];
        } else {
          this.routeData = [];
        }
        const selectedRoute = this.routeData.find(
          (route: any) => !routeId || String(route?.param2) === String(routeId)
        );
        if (!this.panelOpen) setTimeout(() => this.renderRouteMap(selectedRoute), 0);
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.loading = false;
        this.routeData = [];
        this.cdr.detectChanges();
      }
    });
  }

  private renderRouteMap(route: any): void {
    if (this.panelOpen) return;
    const container = document.getElementById('routeDeviationMap');
    if (!container) return;

    if (!this.mapView) {
      this.mapView = L.map(container, { attributionControl: false }).setView([22.5726, 88.3639], 10);
      addMapBasemapControl(this.mapView, 'leaflet');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(this.mapView);
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('Power by DIMTS')
        .addTo(this.mapView);
    }

    if (this.routeLayer) {
      this.mapView.removeLayer(this.routeLayer);
      this.routeLayer = undefined;
    }

    const coordinates = this.getRouteCoordinates(route);
    if (coordinates.length >= 2) {
      const latLngs = coordinates.map(([lng, lat]) => L.latLng(lat, lng));
      this.routeLayer = L.polyline(latLngs, {
        color: 'orange',
        weight: 5,
        opacity: .8,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(this.mapView);
      this.renderBaseRouteArrows(latLngs);
      // The complete assigned route stays below the dark-purple deviation overlay.
      this.routeLayer.bringToBack();
      this.deviationLayer?.bringToFront();
      // Base-route API may finish after deviation history. Re-raise every
      // deviation arrow so the purple segment and its direction stay visible.
      this.deviationDirectionLayer?.eachLayer((layer: any) => layer.setZIndexOffset?.(900));
      this.fitAllRouteBounds();
    } else {
      if (!this.deviationLayer) this.mapView.setView([22.5726, 88.3639], 10);
      this.toast.show('Route coordinates not found.', 'error');
    }

    setTimeout(() => this.mapView?.invalidateSize(), 100);
  }

  private getRouteCoordinates(route: any): [number, number][] {
    const geometryValue = route?.param5 || route?.geometry || route?.coordinates || route?.param4;
    if (!geometryValue) return [];

    try {
      const geometry = typeof geometryValue === 'string' ? JSON.parse(geometryValue) : geometryValue;
      const coordinates = geometry?.type === 'Feature'
        ? geometry.geometry?.coordinates
        : geometry?.coordinates || geometry;

      return Array.isArray(coordinates)
        ? coordinates.filter((point: any) =>
          Array.isArray(point) && point.length >= 2 &&
          Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1]))
        ).map((point: any) => [Number(point[0]), Number(point[1])])
        : [];
    } catch {
      return [];
    }
  }
}

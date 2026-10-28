import { createLeafletBasemap } from '../../../shared/components/map-layer-options/map-basemaps';
import { MapLayerOptionsComponent } from '../../../shared/components/map-layer-options/map-layer-options.component';
import { ReportService } from './../../../core/services/report.service';
import { Component, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { GeofenceInOutReportReq } from '../../../core/model/request.model';
import { DashboardService } from '../../../core/services/dashboard.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ToastService } from '../../../core/services/toast.service';
import dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import moment from 'moment';
import { LoaderService } from '../../../core/services/loader.service';
import { GeofenceInOutReportResp } from '../../../core/model/response.model';
import * as L from 'leaflet';
import { GeofenceService } from '../../../core/services/geofence.service';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { CommonDataToolbarComponent } from '../../../shared/components/common-data-toolbar/common-data-toolbar.component';
import { CommonTableColumn, CommonTableComponent } from '../../../shared/components/common-table/common-table.component';
declare var $: any;
@Component({
    selector: 'app-geofence-in-out-report',
    imports: [MapLayerOptionsComponent, CommonModule, FormsModule, NgxDaterangepickerMd, NgSelectModule, TimepickerModule, CommonDataToolbarComponent, CommonTableComponent],
    templateUrl: './geofence-in-out-report.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './geofence-in-out-report.component.scss'
})
export class GeofenceInOutReportComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly tableColumns: CommonTableColumn[] = [
    { key: 'column1', label: '#' },
    { key: 'column2', label: 'Vehicle No.' },
    { key: 'column3', label: 'Geofence Name' },
    { key: 'column4', label: 'In Time' },
    { key: 'column5', label: 'Out Time' },
    { key: 'column6', label: 'Duration' },
    { key: 'column7', label: 'IN/OUT Status' },
    { key: 'column8', label: 'Track' }
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
  reportData: GeofenceInOutReportResp[] = [];
  roleId: string = '';
  formReq: GeofenceInOutReportReq = new GeofenceInOutReportReq();
  constructor(
    private toast: ToastService,
    private ReportService: ReportService,
    private alertService: AlertService,
    private dashboardService: DashboardService,
    private vehicleService: VehicleService,
    private encryptionService: EncryptionService,
    private cdr: ChangeDetectorRef,
    public loader: LoaderService, private geofenceService: GeofenceService,
  ) { 
    this.roleId = sessionStorage.getItem('roleid') || '';
    this.toast.pageName = 'Geofence In Out Report'; // Set page name for toast service  
   }
  searchInput = new Subject<string>();
  filteredOptions: any[] = [];
  loadingVehicle: boolean = false;
  
  showPoliceStations = true;
  isLayersVisible = false;
  currentStyle = 'streets-v11';
  private policeStationMarkers: L.Marker[] = [];
  private currentTileLayer?: L.TileLayer;
  
  ngOnInit() {
    this.initializeDatePicker();
    this.filterBy = 'Vendor';
    this.loadAlertTypes();
    this.loadVendorList();
    // this.fromDate = this.formatDate(this.selectedDateRange.startDate);
    // this.toDate = this.formatDate(this.selectedDateRange.endDate);

    this.searchInput.subscribe((vehicleSearch: any) => {
    this.loading = true;
    const vehicleSearchText = String(vehicleSearch ?? '').trim();
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
      searchby: vehicleSearchText //this.vehicleSearch
    };
    if (vehicleSearchText.length >= 4) {
      this.loadingVehicle = true;
      this.vehicleService.getVehicleListV2(req).subscribe({ next: (res: any) => {
        const entity = res?.entity?.listData ?? res?.entity;
        const vehicles = Array.isArray(entity) ? entity : [];
        this.visibleVehicleList = [
            { param1: 'All', param2: 'All' },
            ...vehicles
          ];
        // this.visibleVehicleList.unshift({ param1: 'All', param2: 'All'});

        this.loadingVehicle = false;
        this.loading = false;
      }, error: () => {
        this.visibleVehicleList = [{ param1: 'All', param2: 'All' }];
        this.loadingVehicle = false;
        this.loading = false;
      }});
    } else {
      this.loadingVehicle = false;
      this.loading = false;
    }
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
    this.visibleVehicleList = [{param1: 'All', param2: 'All'}];

    this.reportData = [];
    this.showSummary = false;
    this.pageCount = 0;
    this.totalCount =0;
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
      this.visibleVehicleList = [{param1: 'All', param2: 'All'}];
      this.selectedVehicle = null;
      this.isVehicleLoaded = false;
    }

  }
  onVendorChange() {
    this.selectedVehicle = null;
    this.vehicleSearch = '';
    this.fullVehicleList = [];
    this.visibleVehicleList = [{param1: 'All', param2: 'All'}];
    this.isVehicleLoaded = false;
    // this.searchVehicle();
  }
  searchVehicle() {
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
      searchtype: '',
      rtoid: this.selectedRTO || '',
      searchby: this.vehicleSearch
    };

    this.vehicleService.getVehicleListV2(req).subscribe(res => {      
      const data = res?.entity || [];
      // ❌ NO DATA
      if (!data || data.length === 0) {
        this.fullVehicleList = [];
        this.visibleVehicleList = [{param1: 'All', param2: 'All'}];
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
    this.visibleVehicleList = [{param1: 'All', param2: 'All'}];
    this.isVehicleLoaded = false;
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
    this.formReq.param6 = this.fromTime || '00:00';
    this.formReq.param7 = this.toTime || '23:59';
    this.formReq.param8 = this.selectedVehicle || '';
    this.formReq.pdfexcel = '';
    this.loading = true;
    this.loader.show();
    this.alertService.getGeofenceInOutReport(this.formReq).subscribe(
      {
      
      next: (res: any) => {
        if(res.statuscode==200) {
          this.loading = false;
          this.reportData = res?.entity?.listData || res?.entity || [];
          const total = Number(res?.entity?.param1 || 0);
          this.totalCount = total;
          this.pageCount = this.reportData.length;
          // ✅ pages
          this.totalPages = Math.ceil(total / this.pageSize);
        } else {
          this.toast.show('No data found', 'error');
          this.reportData = [];
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
    if (!this.searchText) {
      return this.getAlertOverview();
    }
    const text = this.searchText.toLowerCase();
    this.reportData = this.reportData.filter((item: any) =>
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
  visibleVehicleList: any[] = [{param1: 'All', param2: 'All'}];
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
   detailsParam = {
    searchParameter: '',
    searchTyp: '',
    filter1: '',
    filter2: '',
    pageNo: '',
    itemPerPage: '',
    pageId: '1'
  };

  geofenceDetails: any[] = [];

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
    if (!this.reportData || this.reportData.length === 0) {
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
    this.loading = true;

    // 🔥 5. API CALL
    this.formReq.param2 = "";
    this.formReq.param3 = "";
    this.formReq.pdfexcel = "EXCEL";
    this.alertService.getGeofenceInOutReport(this.formReq).subscribe({
      next: (response: any) => {
        this.loading = false;
        if(response.statuscode==200) {
          this.toast.commonFileDownload(response.entity);
        } else {
          this.toast.show('File download failed (Invalid server response)', 'error');
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error(err);
        this.toast.show('Excel download failed', 'error');
      }
    });
  }

  selectedVehicleNo: string = "";
  private selectedVehicleId: string = "";
  private liveLookupValue: string = "";
  private mapView?: L.Map;
  private mapViewMarker?: L.Marker;
  private geofenceLayer?: L.Layer;
  private eventRouteLayer?: L.Polyline;
  private trackingRouteLayer?: L.Polyline;
  private arrowsLayer?: L.LayerGroup;
  private trackingArrowsLayer?: L.LayerGroup;
  private historyEndpointLayer?: L.LayerGroup;
  private historyAlertLayer?: L.LayerGroup;
  private liveAlertLayer?: L.LayerGroup;
  private liveTimer?: ReturnType<typeof setInterval>;
  private playbackTimer?: ReturnType<typeof setTimeout>;
  private animationFrame?: number;
  private liveRequestPending = false;
  selectedMapRow: any;
  panelOpen = false;
  panelCollapsed = false;
  activeTrackingTab: 'live' | 'history' = 'live';
  historyDate: any = dayjs();
  historyFromTime = new Date(new Date().setHours(0, 0, 0, 0));
  historyToTime = new Date(new Date().setHours(23, 59, 0, 0));
  historyPathCoordinates: [number, number][] = [];
  private historyDataList: any[] = [];
  private historyPlaybackIndex = 0;
  isHistoryPlaying = false;
  speedSliderValue = 5;
  trackingData: any = { vehicleno: '', imei: '', speed: 0, time: null, ignition: 'Off', lat: 0, lng: 0 };
  alertFeatures: any[] = [];
  readonly alertIconMappings = {
    'overspeed': { name: 'alert-overspeed', path: 'assets/mapimages/alertimage/overspeed_new.png' },
    'impact': { name: 'alert-impact', path: 'assets/mapimages/alertimage/emergency.png' },
    'main battery reconnect': { name: 'alert-battery-reconnect', path: 'assets/mapimages/alertimage/batterycharge.png' },
    'power disconnect': { name: 'alert-power-disconnect', path: 'assets/mapimages/alertimage/powerDisconnect.png' },
    'ignition on': { name: 'alert-ignition-on', path: 'assets/mapimages/alertimage/ignitionOn.png' },
    'ignition off': { name: 'alert-ignition-off', path: 'assets/mapimages/alertimage/ignitionOff.png' },
    'harsh acceleration': { name: 'alert-harsh-acceleration', path: 'assets/mapimages/alertimage/harshacceleration_new.png' },
    'harsh brake': { name: 'alert-harsh-brake', path: 'assets/mapimages/alertimage/harshbrake_new.png' },
    'geofence entry': { name: 'alert-geofence-entry', path: 'assets/mapimages/alertimage/geofenceentry.png' },
    'geofence exit': { name: 'alert-geofence-exit', path: 'assets/mapimages/alertimage/geofenceexit.png' },
    'panic': { name: 'alert-panic', path: 'assets/images/mapimages/alertimage/panic.png' },
    'low battery': { name: 'alert-low-battery', path: 'assets/mapimages/alertimage/batterylow.png' },
    'route deviation': { name: 'alert-route-deviation', path: 'assets/mapimages/alertimage/routedev3.png' },
    'tamper': { name: 'alert-tamper', path: 'assets/mapimages/alertimage/tamper.png' },
    'tilt': { name: 'alert-tilt', path: 'assets/mapimages/alertimage/tilt.png' },
    'default': { name: 'alert-default', path: 'assets/mapimages/alertimage/others.png' }
  };

  viewMapModal(d: any) {
    this.selectedVehicleNo = d?.param3 || d?.vehicleNo || '-';
    this.selectedVehicleId = String(d?.param2 || d?.vehicleId || '').trim();
    this.liveLookupValue = this.selectedVehicleId || this.selectedVehicleNo;
    this.selectedMapRow = d;

    // History API values come from the selected geofence in/out report row:
    // param1 = vehicle no, param2 = in-date, param3 = in-time, param4 = out-time.
    const inDateTime = this.splitDateTime(d?.param6);
    const outDateTime = this.splitDateTime(d?.param7);
    this.historyDate = dayjs(inDateTime.date, 'DD-MMM-YYYY');
    this.historyFromTime = moment(inDateTime.time, 'hh:mm A').toDate();
    this.historyToTime = moment(outDateTime.time, 'hh:mm A').toDate();

    this.panelOpen = false;
    this.stopTracking();
    $("#mapviewModal").modal('show');

    // Leaflet must be initialized only after the Bootstrap modal is visible,
    // otherwise it calculates a zero-sized map container.
    setTimeout(() => this.renderMap(d), 200);
  }

  closeModal() {
    this.stopTracking();
    this.mapView?.closePopup();
    this.isLayersVisible = false;
    $("#mapviewModal").modal('hide');
  }

  ngOnDestroy(): void { this.stopTracking(); this.mapView?.remove(); }

  private renderMap(data: any): void {
    const container = document.getElementById('geofenceReportMap');
    if (!container) return;

    let mapView = this.mapView;
    if (!mapView) {
      mapView = L.map(container, {
        zoomControl: true,
        attributionControl: false
      }).setView([22.5726, 88.3639], 16);
      this.mapView = mapView;
      this.currentTileLayer = this.createMapTileLayer(this.currentStyle);
      this.currentTileLayer.addTo(mapView);

      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('Power by DIMTS')
        .addTo(mapView);

      // Leaflet's initial load can fire during setView(), so load these directly.
      this.loadPoliceStations();
    }

    this.clearMapLayers();
    mapView.invalidateSize();
    this.loadGeofence(data);
    this.plotCurrentVehicle();
    this.loadEventTrack(data);
  }

  toggleLayers(): void {
    this.isLayersVisible = !this.isLayersVisible;
  }

  togglePoliceStations(): void {
    if (!this.showPoliceStations) {
      this.clearPoliceStationMarkers();
      return;
    }

    this.loadPoliceStations();
  }

  changeMapStyle(style: string): void {
    if (this.currentStyle === style) return;

    this.currentStyle = style;
    if (!this.mapView) return;

    if (this.currentTileLayer) {
      this.mapView.removeLayer(this.currentTileLayer);
    }

    this.currentTileLayer = this.createMapTileLayer(style);
    this.currentTileLayer.addTo(this.mapView);
    this.currentTileLayer.bringToBack();
  }

  private createMapTileLayer(style: string): L.TileLayer {
    return createLeafletBasemap(style);
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
        const row=document.createElement('div'),key=document.createElement('span'),val=document.createElement('b');key.textContent=String(label);val.textContent=String(value);row.append(key,val);body.append(row);
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

  private clearMapLayers(): void {
    if (!this.mapView) return;
    [this.geofenceLayer, this.eventRouteLayer, this.trackingRouteLayer, this.mapViewMarker]
      .filter((x): x is L.Layer => !!x).forEach(x => this.mapView!.removeLayer(x));
    this.geofenceLayer = this.eventRouteLayer = this.trackingRouteLayer = undefined;
    this.mapViewMarker = undefined;
    this.arrowsLayer?.clearLayers(); this.trackingArrowsLayer?.clearLayers();
    this.historyEndpointLayer?.clearLayers();
    this.historyAlertLayer?.clearLayers();
    this.liveAlertLayer?.clearLayers();
    this.alertFeatures = [];
  }

  private splitDateTime(value: any): { date: string; time: string } {
    const parsed = moment(value, ['DD-MMM-YYYY hh:mm A', 'DD-MMM-YYYY HH:mm:ss', 'DD-MMM-YYYY HH:mm', moment.ISO_8601], true);
    const safe = parsed.isValid() ? parsed : moment(value);
    return { date: safe.isValid() ? safe.format('DD-MMM-YYYY') : moment().format('DD-MMM-YYYY'), time: safe.isValid() ? safe.format('hh:mm A') : '12:00 AM' };
  }

  private loadGeofence(row: any): void {
    this.geofenceService.getGeofenceDetails({ param1: '', param2: '', param3: '', param4: '', param5: '' }).subscribe({ next: (res: any) => {
      if (this.panelOpen) return;
      const list = res?.entity?.listData || res?.entity || [];
      const item = (Array.isArray(list) ? list : []).find((g: any) => String(g?.param3 || '').toLowerCase() === String(row?.param4 || '').toLowerCase()) || list?.[0];
      if (item) this.drawGeofence(item);
    }});
  }

  private drawGeofence(item: any): void {
    if (!this.mapView) return;
    let geometry: any = item?.geometry || item?.param5 || item?.coord;
    try { geometry = typeof geometry === 'string' ? JSON.parse(geometry) : geometry; } catch { return; }
    const coords = geometry?.geometry?.coordinates || geometry?.coordinates || geometry?.center;
    const color = item?.param8 || '#16a34a';
    if (String(item?.param4 || item?.geofencetype).toLowerCase() === 'circle' || geometry?.type === 'Point') {
      const point = Array.isArray(coords) && !Array.isArray(coords[0]) ? coords : coords?.[0];
      if (point?.length >= 2) this.geofenceLayer = L.circle([Number(point[1]), Number(point[0])], { radius: Number(item?.param7 || item?.radius || geometry?.radius || 100), color, fillColor: color, fillOpacity: .16, weight: 3 }).addTo(this.mapView);
    } else if (Array.isArray(coords)) {
      const raw = Array.isArray(coords[0]?.[0]) ? coords[0] : coords;
      const latLngs = raw.map((p: any) => [Number(p[1]), Number(p[0])] as [number, number]);
      this.geofenceLayer = L.polygon(latLngs, { color, fillColor: color, fillOpacity: .16, weight: 3 }).addTo(this.mapView);
    }
    this.fitMapBounds();
  }

  private loadEventTrack(row: any): void {
    const start = this.splitDateTime(row?.param6); const end = this.splitDateTime(row?.param7);
    this.vehicleService.getVehicleHistory({ param1: this.selectedVehicleNo, param2: start.date, param3: start.time, param4: end.time }).subscribe({ next: (res: any) => {
      if (this.panelOpen) return;
      const points = this.validPoints(res?.entity?.listData || res?.entity || []);
      if (points.length < 1) { this.plotCurrentVehicle(); return; }
      const latLngs = points.map(p => this.point(p));
      if (latLngs.length >= 2) {
        this.eventRouteLayer = L.polyline(latLngs, { color: 'orange', weight: 4, opacity: .96, lineJoin: 'round', lineCap: 'round' }).addTo(this.mapView!);
        this.arrowsLayer = this.arrowsLayer || L.layerGroup().addTo(this.mapView!);
        this.drawArrows(points, this.arrowsLayer);
      }
      this.setVehicle(points[points.length - 1]); this.fitMapBounds();
    }, error: () => this.plotCurrentVehicle() });
  }

  private validPoints(list: any[]): any[] { return (Array.isArray(list) ? list : []).filter(p => { const [lat, lng] = this.point(p); return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0); }); }
  private point(item: any): [number, number] {
    const pairs = [
      [item?.param38, item?.param39],
      [item?.param21, item?.param22],
      [item?.param7, item?.param8],
      [item?.latitude, item?.longitude],
      [item?.lat, item?.lng],
      [item?.param4, item?.param5]
    ];

    for (const [latValue, lngValue] of pairs) {
      const lat = Number(latValue);
      const lng = Number(lngValue);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0)) {
        return [lat, lng];
      }
    }
    return [Number.NaN, Number.NaN];
  }
  private createArrow(heading: number): L.DivIcon { return L.divIcon({ className: 'reference-route-arrow', html: `<span style="transform:rotate(${heading - 90}deg)">➤</span>`, iconSize: [22,22], iconAnchor: [11,11] }); }
  private drawArrows(points: any[], layer: L.LayerGroup): void { layer.clearLayers(); const stride = Math.max(1, Math.floor(points.length / 16)); for (let i = 1; i < points.length; i += stride) { const a = this.point(points[i - 1]); const b = this.point(points[i]); const heading = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; L.marker(b, { icon: this.createArrow(heading), interactive: false }).addTo(layer); } }

  private setVehicle(item: any): void { if (!this.mapView) return; this.updateTrackingData(item); const icon = L.divIcon({ className: 'live-vehicle-marker-div', html: `<div class="geofence-vehicle-marker" style="background-image:url('assets/mapimages/car/green.png')"></div>`, iconSize: [42,42], iconAnchor: [21,21], popupAnchor: [0,-21] }); if (this.mapViewMarker) this.mapView.removeLayer(this.mapViewMarker); this.mapViewMarker = L.marker(this.point(item), { icon, zIndexOffset: 1000 }).addTo(this.mapView); this.bindVehiclePopup(); }
  private bindVehiclePopup(): void {
    if (!this.mapViewMarker) return;
    const d = this.trackingData;
    const lat = Number.isFinite(Number(d.lat)) ? Number(d.lat).toFixed(6) : '-';
    const lng = Number.isFinite(Number(d.lng)) ? Number(d.lng).toFixed(6) : '-';
    const ignitionClass = d.ignition === 'On' ? 'is-on' : 'is-off';

    this.mapViewMarker.bindPopup(`
      <div class="geofence-vehicle-popup">
        <header class="geo-popup-header">
          <span class="geo-popup-car"><i class="fa fa-car"></i></span>
          <div><strong>${this.escapeHtml(d.vehicleno || this.selectedVehicleNo)}</strong><small>Vehicle details</small></div>
        </header>
        <div class="geo-popup-body">
          <div><i class="fa fa-object-group"></i><span>Geofence</span><b>${this.escapeHtml(this.selectedMapRow?.param4 || '-')}</b></div>
          <div><i class="fa fa-barcode"></i><span>IMEI</span><b>${this.escapeHtml(d.imei || '-')}</b></div>
          <div><i class="fa fa-tachometer"></i><span>Speed</span><b>${Number(d.speed || 0)} km/h</b></div>
          <div><i class="fa fa-bolt"></i><span>Ignition</span><b class="${ignitionClass}">${this.escapeHtml(d.ignition || 'Off')}</b></div>
          <div><i class="fa fa-clock-o"></i><span>Time</span><b>${this.escapeHtml(String(d.time || '-'))}</b></div>
          <div><i class="fa fa-map-marker"></i><span>Lat/Lng</span><b>${lat}, ${lng}</b></div>
        </div>
        <footer>
          <button type="button" id="geoLiveBtn" class="geo-live-action"><i class="fa fa-location-arrow"></i><span>Live Track</span></button>
          <button type="button" id="geoHistoryBtn" class="geo-history-action"><i class="fa fa-history"></i><span>History Track</span></button>
        </footer>
      </div>`,
      { minWidth: 245, maxWidth: 265, className: 'geofence-report-popup' }
    );

    this.mapViewMarker.off('popupopen').on('popupopen', () => setTimeout(() => {
      document.getElementById('geoLiveBtn')?.addEventListener('click', () => this.openTrackingPanel('live'));
      document.getElementById('geoHistoryBtn')?.addEventListener('click', () => this.openTrackingPanel('history'));
    }));
  }
  private updateTrackingData(item: any): void { const [lat,lng] = this.point(item); this.trackingData = { ...this.trackingData, vehicleno: item?.param13 || item?.param15 || item?.vehicleno || this.selectedVehicleNo, imei: item?.param4 || item?.imei, speed: Number(item?.param40 ?? item?.param6 ?? item?.speed ?? 0), time: item?.param35 || item?.param3 || item?.pollingdate || item?.time, ignition: String(item?.param45 ?? item?.param12 ?? item?.ignition) === '1' ? 'On' : 'Off', lat, lng }; }

  private firstResponseItem(res: any): any { const entity = res?.entity; if (Array.isArray(entity)) return entity[0]; if (Array.isArray(entity?.listData)) return entity.listData[0]; return entity && typeof entity === 'object' ? entity : null; }
  private fetchLiveVehicle(onItem: (item: any) => void, onEmpty: () => void = () => {}): void {
    const identifiers = Array.from(new Set([
      this.liveLookupValue,
      this.selectedVehicleId,
      this.selectedVehicleNo
    ].map(value => String(value || '').trim()).filter(Boolean)));

    const tryIdentifier = (index: number): void => {
      if (index >= identifiers.length) {
        onEmpty();
        return;
      }

      const identifier = identifiers[index];
      this.vehicleService.getLiveTrack(identifier, false).subscribe({
        next: (res: any) => {
          const item = this.firstResponseItem(res);
          if (this.validPoints([item]).length) {
            this.liveLookupValue = identifier;
            onItem(item);
            return;
          }
          tryIdentifier(index + 1);
        },
        error: () => tryIdentifier(index + 1)
      });
    };

    tryIdentifier(0);
  }

  private plotCurrentVehicle(): void {
    this.fetchLiveVehicle(item => {
      if (this.panelOpen) return;
      this.setVehicle(item);
      this.fitMapBounds();
    });
  }
  
  openTrackingPanel(tab: 'live'|'history'): void { this.stopLiveTimer(); this.stopHistory(); this.mapViewMarker?.closePopup(); this.clearTrackingModeLayers(); this.panelOpen = true; this.panelCollapsed = false; this.activeTrackingTab = tab; if (tab === 'live') this.startLiveTracking(); this.cdr.detectChanges(); }

  /** Removes every plotted overlay so the selected tracking mode is shown alone. */
  private clearTrackingModeLayers(): void {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = undefined;
    if (this.mapView && this.trackingRouteLayer) this.mapView.removeLayer(this.trackingRouteLayer);
    if (this.mapView && this.eventRouteLayer) this.mapView.removeLayer(this.eventRouteLayer);
    if (this.mapView && this.geofenceLayer) this.mapView.removeLayer(this.geofenceLayer);
    if (this.mapView && this.mapViewMarker) this.mapView.removeLayer(this.mapViewMarker);
    this.trackingRouteLayer = undefined;
    this.eventRouteLayer = undefined;
    this.geofenceLayer = undefined;
    this.mapViewMarker = undefined;
    this.arrowsLayer?.clearLayers();
    this.trackingArrowsLayer?.clearLayers();
    this.historyEndpointLayer?.clearLayers();
    this.historyAlertLayer?.clearLayers();
    this.liveAlertLayer?.clearLayers();
    this.alertFeatures = [];
    this.historyDataList = [];
    this.historyPathCoordinates = [];
    this.historyPlaybackIndex = 0;
    this.isHistoryPlaying = false;
  }

  startLiveTracking(): void { this.stopLiveTimer(); const refresh = () => { if (this.liveRequestPending) return; this.liveRequestPending = true; this.fetchLiveVehicle(item => { this.liveRequestPending = false; if (this.activeTrackingTab !== 'live' || !this.panelOpen) return; this.moveSmoothly(item, 4800, () => this.plotLiveAlert(item)); }, () => this.liveRequestPending = false); }; refresh(); this.liveTimer = setInterval(refresh, 5000); }

  private plotLiveAlert(item: any): void {
    if (!this.mapView || !this.validPoints([item]).length) return;

    const alertId = String(item?.param47 || '').trim();
    const alertName = String(item?.param48 || '').trim();
    if (!alertId || alertId === '01' || !alertName || alertName.toLowerCase() === 'na') return;

    const [lat, lng] = this.point(item);
    const key = `${alertId}|${item?.param35 || ''}|${lat}|${lng}`;
    if (this.alertFeatures.some(feature => feature.key === key)) return;

    const normalizedName = alertName.toLowerCase();
    const mappingKey = Object.keys(this.alertIconMappings)
      .find(name => name !== 'default' && normalizedName.includes(name)) || 'default';
    const iconConfig = (this.alertIconMappings as Record<string, { name: string; path: string }>)[mappingKey];
    const feature = { key, alertId, alertName, lat, lng, time: item?.param35, speed: item?.param40, vehicleNo: item?.param13 || this.selectedVehicleNo };
    this.alertFeatures.push(feature);

    this.liveAlertLayer = this.liveAlertLayer || L.layerGroup().addTo(this.mapView);
    // Keep the icon centre on the exact alert GPS coordinate/route point.
    const icon = L.icon({ iconUrl: iconConfig.path, iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -18] });
    L.marker([lat, lng], { icon, zIndexOffset: 1200 })
      .bindPopup(this.createAlertPopupContent(alertName, alertId, feature.vehicleNo, feature.time, feature.speed, lat, lng))
      .addTo(this.liveAlertLayer);
  }
  private moveSmoothly(item: any, duration: number, onArrive?: () => void): void { if (!this.mapViewMarker || !this.mapView) { this.setVehicle(item); this.mapView?.flyTo(this.point(item),14); onArrive?.(); return; } const from = this.mapViewMarker.getLatLng(); const p = this.point(item); if (!this.validPoints([item]).length) return; const to = L.latLng(p); if (Math.abs(from.lat-to.lat)<1e-7 && Math.abs(from.lng-to.lng)<1e-7) { this.updateTrackingData(item); this.cdr.detectChanges(); onArrive?.(); return; } if (this.animationFrame) cancelAnimationFrame(this.animationFrame); const started = performance.now(); const heading = Math.atan2(to.lng-from.lng,to.lat-from.lat)*180/Math.PI; const el = this.mapViewMarker.getElement()?.querySelector('.geofence-vehicle-marker') as HTMLElement; if(el) el.style.transform=`rotate(${heading}deg)`; const animate=(now:number)=>{const t=Math.min((now-started)/duration,1),e=t*t*(3-2*t);const pos=L.latLng(from.lat+(to.lat-from.lat)*e,from.lng+(to.lng-from.lng)*e);this.mapViewMarker?.setLatLng(pos);if(!this.trackingRouteLayer)this.trackingRouteLayer=L.polyline([from],{color:'#009C4E',weight:4,lineJoin:'round',lineCap:'round'}).addTo(this.mapView!);this.trackingRouteLayer.addLatLng(pos);if(t<1)this.animationFrame=requestAnimationFrame(animate);else{this.updateTrackingData(item);this.bindVehiclePopup();this.cdr.detectChanges();onArrive?.();}};this.animationFrame=requestAnimationFrame(animate); }

  showHistoryTrack(): void {
    this.stopLiveTimer();
    this.stopHistory();
    this.clearTrackingModeLayers();
    this.activeTrackingTab = 'history';

    const request = {
      param1: this.selectedVehicleNo,
      param2: moment(this.historyDate?.startDate || this.historyDate || new Date()).format('DD-MMM-YYYY'),
      param3: moment(this.historyFromTime).format('hh:mm A'),
      param4: moment(this.historyToTime).format('hh:mm A')
    };

    this.vehicleService.getVehicleHistory(request).subscribe({
      next: (res: any) => {
        if (this.activeTrackingTab !== 'history' || !this.panelOpen) return;
        this.historyDataList = this.validPoints(res?.entity?.listData || res?.entity || []);
        this.historyPathCoordinates = this.historyDataList.map(x => this.point(x));
        if (this.historyDataList.length < 2) {
          this.toast.show('Selected time me history data nahi mila', 'error');
          return;
        }
        this.trackingRouteLayer = L.polyline(this.historyPathCoordinates, {
          color: 'orange', weight: 4, opacity: .96, lineJoin: 'round', lineCap: 'round'
        }).addTo(this.mapView!);
        this.trackingArrowsLayer = this.trackingArrowsLayer || L.layerGroup().addTo(this.mapView!);
        this.drawArrows(this.historyDataList, this.trackingArrowsLayer);
        this.historyPlaybackIndex = 0;
        this.setVehicle(this.historyDataList[0]);
        this.renderHistoryEndpoints(this.historyDataList);
        this.renderHistoryAlerts(this.historyDataList);
        this.fitMapBounds();
        this.cdr.detectChanges();
      }
    });
  }

  private renderHistoryEndpoints(points: any[]): void { if (!this.mapView || !points.length) return; this.historyEndpointLayer=this.historyEndpointLayer||L.layerGroup().addTo(this.mapView);this.historyEndpointLayer.clearLayers();const add=(item:any,type:'start'|'end')=>{const title=type==='start'?'Start Point':'End Point';const icon=L.icon({iconUrl:type==='start'?'assets/mapimages/startpointroute.png':'assets/mapimages/endpointroute.png',iconSize:[35,35],iconAnchor:[17,35],popupAnchor:[0,-34]});L.marker(this.point(item),{icon,zIndexOffset:1100}).bindPopup(`<b>${title}</b><br>${this.escapeHtml(this.selectedVehicleNo)}`).addTo(this.historyEndpointLayer!);};add(points[0],'start');add(points[points.length-1],'end'); }
  private renderHistoryAlerts(points: any[]): void { if (!this.mapView) return; this.historyAlertLayer=this.historyAlertLayer||L.layerGroup().addTo(this.mapView);this.historyAlertLayer.clearLayers();points.forEach(item=>{const alertId=String(item?.param12||'').trim(),alertName=String(item?.param13||'').trim();if(!alertId||alertId==='01'||!alertName||alertName.toLowerCase()==='na')return;const [lat,lng]=this.point(item);const normalized=alertName.toLowerCase();const key=Object.keys(this.alertIconMappings).find(name=>name!=='default'&&normalized.includes(name))||'default';const config=(this.alertIconMappings as Record<string,{name:string;path:string}>)[key];const icon=L.icon({iconUrl:config.path,iconSize:[34,34],iconAnchor:[17,17],popupAnchor:[0,-18]});L.marker([lat,lng],{icon,zIndexOffset:900}).bindPopup(this.createAlertPopupContent(alertName,alertId,this.selectedVehicleNo,item?.param3,item?.param6,lat,lng)).addTo(this.historyAlertLayer!);}); }
  private createAlertPopupContent(name:any,id:any,vehicle:any,time:any,speed:any,lat:number,lng:number):HTMLElement{const root=document.createElement('div');root.className='compact-alert-card';const header=document.createElement('div');header.className='compact-alert-card__header';const badge=document.createElement('span');badge.className='compact-alert-card__badge';badge.textContent='!';const heading=document.createElement('div'),title=document.createElement('strong');title.textContent=String(name||'Alert');heading.append(title);header.append(badge,heading);root.append(header);const body=document.createElement('div');body.className='compact-alert-card__body';[['Vehicle',vehicle||'-'],['Speed',`${Number(speed||0)} km/h`],['Time',time||'-'],['Location',`${lat.toFixed(5)}, ${lng.toFixed(5)}`]].forEach(([label,value])=>{const row=document.createElement('div'),key=document.createElement('span'),val=document.createElement('b');key.textContent=String(label);val.textContent=String(value);row.append(key,val);body.append(row);});root.append(body);return root;}
  playHistory():void{if(this.isHistoryPlaying||this.historyDataList.length<2)return;this.isHistoryPlaying=true;this.playNext();} private playNext():void{if(!this.isHistoryPlaying||this.historyPlaybackIndex>=this.historyDataList.length-1){this.isHistoryPlaying=false;return;}this.historyPlaybackIndex++;this.moveSmoothly(this.historyDataList[this.historyPlaybackIndex],Math.max(150,2200/this.speedSliderValue));this.playbackTimer=setTimeout(()=>this.playNext(),Math.max(180,2300/this.speedSliderValue));} restartHistory():void{this.stopHistory();this.historyPlaybackIndex=0;if(this.historyDataList[0]){this.setVehicle(this.historyDataList[0]);this.playHistory();}} stopHistory():void{this.isHistoryPlaying=false;if(this.animationFrame)cancelAnimationFrame(this.animationFrame);if(this.playbackTimer)clearTimeout(this.playbackTimer);} onSpeedChange(_:Event):void{this.speedSliderValue=Number(this.speedSliderValue);} private stopLiveTimer():void{if(this.liveTimer)clearInterval(this.liveTimer);this.liveTimer=undefined;this.liveRequestPending=false;} stopTracking():void{this.stopLiveTimer();this.stopHistory();}
  private fitMapBounds():void{if(!this.mapView)return;const bounds=L.latLngBounds([]);[this.geofenceLayer,this.eventRouteLayer,this.trackingRouteLayer].forEach((l:any)=>{if(l?.getBounds)bounds.extend(l.getBounds());});if(this.mapViewMarker)bounds.extend(this.mapViewMarker.getLatLng());if(bounds.isValid())this.mapView.fitBounds(bounds,{padding:[35,35]});}

   getGeofenceDetails(): void {
    this.loading = true;
    this.geofenceService.getGeofenceDetails({
      param1: this.detailsParam.searchParameter || '',
      param2: '',
      param3: '',
      param4: '',
      param5: ''
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.status && res?.entity) {
          this.geofenceDetails = res.entity.listData || [];
        } else {
          this.geofenceDetails = [];
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.geofenceDetails = [];
        alert(error?.error?.entity || 'Error loading geofence details');
      }
    });
  }

  private escapeHtml(value: string): string {
    const element = document.createElement('div');
    element.textContent = value;
    return element.innerHTML;
  }
}
